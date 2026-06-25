import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { sql } from '@/lib/db';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable.');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // 處理 checkout session 成功完成的事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { artwork_id, buyer_id, checkout_type } = session.metadata || {};
      if (!artwork_id || !buyer_id || !checkout_type) {
        console.error('Missing metadata in session', session.id);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // session.amount_total 單位為 cents (例如 100 TWD = 10000 cents)
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
      const stripePaymentIntentId = session.payment_intent as string;
      const isRental = checkout_type === 'rent';

      // 取得作品資料以判斷是否為實體且有庫存
      const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artwork_id}`;
      const artwork = artworks[0];

      if (isRental) {
        // 租賃處理：寫入 rentals
        const rentalMonths = 1; // 預設 1 個月
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + rentalMonths * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const monthlyRent = Number(artwork.monthly_rent_price) || 0;
        const depositAmount = Number(artwork.deposit_amount) || 0;

        await sql`
          INSERT INTO public.rentals (
            artwork_id, tenant_id, start_date, end_date,
            monthly_rent, deposit_amount, status, created_at
          ) VALUES (
            ${artwork_id}, ${buyer_id},
            ${startDate}, ${endDate},
            ${monthlyRent}, ${depositAmount},
            ${'active'}, NOW()
          )
        `;
        console.log(`[Webhook] Rental created for artwork ${artwork_id} by user ${buyer_id}`);
      } else {
        // 買斷處理：寫入 orders
        await sql`
          INSERT INTO public.orders (
            artwork_id, buyer_id, amount,
            payment_status, stripe_payment_intent_id, created_at
          ) VALUES (
            ${artwork_id}, ${buyer_id}, ${amountPaid},
            ${'paid'}, ${stripePaymentIntentId}, NOW()
          )
        `;
        console.log(`[Webhook] Order created for artwork ${artwork_id} by user ${buyer_id}`);

        // 若為實體作品且有庫存，庫存減一
        if (artwork?.art_type === 'physical' && artwork.stock > 0) {
          await sql`
            UPDATE public.artworks
            SET stock = stock - 1
            WHERE id = ${artwork_id} AND stock > 0
          `;
          console.log(`[Webhook] Stock reduced for physical artwork ${artwork_id}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Webhook] Error processing event ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
