import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Invalid signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      // ── 首次付款成功（押金 + 首月）──────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.type !== 'rental_first_charge') break;

        const {
          artwork_id, buyer_id,
          deposit_amount, monthly_rent, platform_fee, rental_months,
        } = pi.metadata;

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + Number(rental_months));

        // 建立 Stripe Subscription（次月起）
        const subscription = await stripe.subscriptions.create({
          customer: pi.customer as string,
          items: [{
            price_data: {
              currency: 'twd',
              unit_amount: Number(monthly_rent),
              recurring: { interval: 'month' },
              product_data: {
                name: `Atelier Blanc 租賃月費`,
                metadata: { artwork_id },
              },
            },
          }],
          billing_cycle_anchor: Math.floor(endDate.getTime() / 1000), // 首次扣款在一個月後
          proration_behavior: 'none',
          metadata: { artwork_id, buyer_id, platform_fee },
          payment_behavior: 'default_incomplete',
          payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
          },
          expand: ['latest_invoice.payment_intent'],
        });

        // 在 DB 建立 rental 記錄
        const { error: rentalErr } = await admin.from('rentals').insert({
          artwork_id,
          tenant_id: buyer_id,
          start_date: startDate.toISOString().slice(0, 10),
          end_date: endDate.toISOString().slice(0, 10),
          monthly_rent: Number(monthly_rent),
          deposit_amount: Number(deposit_amount),
          rental_months: Number(rental_months),
          status: 'active',
          deposit_status: 'paid',
          subscription_status: 'active',
          stripe_customer_id: pi.customer as string,
          stripe_deposit_payment_intent_id: pi.id,
          stripe_subscription_id: subscription.id,
          next_billing_date: endDate.toISOString().slice(0, 10),
          payment_transaction_id: pi.id,
          created_at: new Date().toISOString(),
        });

        if (rentalErr) {
          console.error('[stripe-webhook] Failed to create rental:', rentalErr.message);
        }

        // 寫入首月付款紀錄
        await admin.from('rental_payments').insert({
          rental_id: (await admin.from('rentals').select('id').eq('stripe_deposit_payment_intent_id', pi.id).single()).data?.id,
          stripe_payment_intent_id: pi.id,
          amount: Number(monthly_rent),
          period_start: startDate.toISOString().slice(0, 10),
          period_end: endDate.toISOString().slice(0, 10),
          status: 'paid',
          paid_at: new Date().toISOString(),
        });

        break;
      }

      // ── 月扣款發票付款成功 ────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const { data: rental } = await admin
          .from('rentals')
          .select('id, end_date')
          .eq('stripe_subscription_id', invoice.subscription)
          .single();

        if (!rental) break;

        const periodStart = invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString().slice(0, 10)
          : undefined;
        const periodEnd = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString().slice(0, 10)
          : undefined;

        await admin.from('rental_payments').insert({
          rental_id: rental.id,
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          amount: invoice.amount_paid,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'paid',
          paid_at: new Date().toISOString(),
        });

        // 更新下次扣款日
        await admin.from('rentals').update({
          next_billing_date: periodEnd,
        }).eq('id', rental.id);

        break;
      }

      // ── 月扣款失敗 ────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        await admin.from('rentals')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);

        await admin.from('rental_payments').insert({
          rental_id: (await admin.from('rentals').select('id').eq('stripe_subscription_id', invoice.subscription).single()).data?.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_due,
          status: 'failed',
        });

        break;
      }

      // ── 訂閱取消 ─────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await admin.from('rentals')
          .update({
            subscription_status: 'canceled',
            status: 'ended',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[stripe-webhook] Handler error:', err.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
