import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-04-22.dahlia',
});

// POST /api/rentals/[rentalId]/return
// 藝術家確認作品已歸還，觸發押金退款
export async function POST(
  req: NextRequest,
  { params }: { params: { rentalId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const admin = createAdminClient();

  // 取得 rental 資料
  const { data: rental, error: rentalErr } = await admin
    .from('rentals')
    .select(`
      id, status, deposit_status, deposit_amount,
      stripe_subscription_id, stripe_deposit_payment_intent_id,
      artwork_returned_at,
      artworks!inner(artist_id, title)
    `)
    .eq('id', params.rentalId)
    .single();

  if (rentalErr || !rental) {
    return NextResponse.json({ error: '找不到租約' }, { status: 404 });
  }

  // 確認操作者是作品的藝術家
  const artistId = (rental.artworks as any)?.artist_id;
  if (artistId !== user.id) {
    return NextResponse.json({ error: '只有藝術家可以確認歸還' }, { status: 403 });
  }

  if (rental.artwork_returned_at) {
    return NextResponse.json({ error: '作品已確認歸還' }, { status: 400 });
  }

  if (rental.deposit_status !== 'paid') {
    return NextResponse.json({ error: '押金狀態異常，無法退款' }, { status: 400 });
  }

  try {
    // 1. 取消 Stripe Subscription（若還在進行中）
    if (rental.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(rental.stripe_subscription_id);
      } catch (e: any) {
        // 可能已取消，忽略
        console.warn('[return] subscription cancel warning:', e.message);
      }
    }

    // 2. 退還押金
    let refundId: string | undefined;
    if (rental.stripe_deposit_payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: rental.stripe_deposit_payment_intent_id,
        amount: rental.deposit_amount,
        reason: 'requested_by_customer',
        metadata: {
          rental_id: params.rentalId,
          reason: '租約結束押金退還',
        },
      });
      refundId = refund.id;
    }

    // 3. 更新 DB
    const now = new Date().toISOString();
    await admin.from('rentals').update({
      artwork_returned_at: now,
      status: 'ended',
      deposit_status: 'refunded',
      subscription_status: 'canceled',
      canceled_at: now,
    }).eq('id', params.rentalId);

    return NextResponse.json({
      success: true,
      refundId,
      message: `押金 NT$${rental.deposit_amount} 已退款，通常 5-10 個工作日到帳`,
    });
  } catch (err: any) {
    console.error('[return] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
