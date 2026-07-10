import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const COMMISSION_RATE = 0.10; // 平台抽成 10%

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { artworkId, rentalMonths = 1 } = await req.json();
  if (!artworkId) return NextResponse.json({ error: '缺少 artworkId' }, { status: 400 });

  // 取得作品資料
  const { data: artwork, error: artworkErr } = await supabase
    .from('artworks')
    .select('id, title, monthly_rent_price, deposit_amount, artist_id, is_rentable, status')
    .eq('id', artworkId)
    .single();

  if (artworkErr || !artwork) return NextResponse.json({ error: '找不到作品' }, { status: 404 });
  if (!artwork.is_rentable) return NextResponse.json({ error: '此作品不提供租賃' }, { status: 400 });
  if (artwork.status !== 'published') return NextResponse.json({ error: '此作品目前不可租賃' }, { status: 400 });

  const monthlyRent = Math.round(Number(artwork.monthly_rent_price));
  const depositAmount = Math.round(Number(artwork.deposit_amount));
  if (!monthlyRent || !depositAmount) {
    return NextResponse.json({ error: '此作品未設定租賃金額' }, { status: 400 });
  }

  // 首次收費 = 押金 + 首月租金
  const firstChargeAmount = depositAmount + monthlyRent;
  const platformFee = Math.round(monthlyRent * COMMISSION_RATE);

  try {
    // 1. 建立或取得 Stripe Customer
    let stripeCustomerId: string;
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email, display_name')
      .eq('id', user.id)
      .single();

    if (userProfile?.stripe_customer_id) {
      stripeCustomerId = userProfile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: userProfile?.display_name || user.email!,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // 儲存 stripe_customer_id 到 users 表
      const admin = createAdminClient();
      await admin.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('id', user.id);
    }

    // 2. 建立 PaymentIntent（押金 + 首月）
    const paymentIntent = await stripe.paymentIntents.create({
      amount: firstChargeAmount,     // TWD 直接以元為單位
      currency: 'twd',
      customer: stripeCustomerId,
      setup_future_usage: 'off_session', // 允許後續月扣
      metadata: {
        artwork_id: artworkId,
        buyer_id: user.id,
        type: 'rental_first_charge',
        deposit_amount: depositAmount.toString(),
        monthly_rent: monthlyRent.toString(),
        platform_fee: platformFee.toString(),
        rental_months: rentalMonths.toString(),
      },
      description: `${artwork.title} 租賃 - 押金 NT$${depositAmount} + 首月租金 NT$${monthlyRent}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      summary: {
        monthlyRent,
        depositAmount,
        firstCharge: firstChargeAmount,
        platformFee,
        artistReceives: monthlyRent - platformFee,
        rentalMonths,
      },
    });
  } catch (err: any) {
    console.error('[rental-stripe] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
