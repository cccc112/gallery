import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── Mock 本地金流回應模擬器（TapPay / 綠界風格）────────────────────────
function mockFiatGateway(params: {
  amount: number;
  cardLastFour: string;
  actionType: 'buy' | 'rent';
  depositAmount?: number;
}): { success: boolean; transactionId: string; authCode: string; message: string } {
  // 模擬 1% 失敗率（測試用）
  if (params.cardLastFour === '0000') {
    return { success: false, transactionId: '', authCode: '', message: '卡號無效，請確認後重試' };
  }

  const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const authCode = Math.floor(100000 + Math.random() * 900000).toString();

  if (params.actionType === 'rent') {
    // 租賃：模擬「預先授權 (Pre-Auth)」—— 凍結押金 + 扣首月租金
    return {
      success: true,
      transactionId,
      authCode,
      message: `預授權成功：押金 NT$${params.depositAmount?.toLocaleString()} 已凍結，首月租金 NT$${params.amount.toLocaleString()} 已扣款`,
    };
  } else {
    // 買斷：模擬全額扣款
    return {
      success: true,
      transactionId,
      authCode,
      message: `全額扣款成功：NT$${params.amount.toLocaleString()}`,
    };
  }
}

// ── 主處理器 ──────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 1. 驗證登入
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入才能結帳' }, { status: 401 });
    }

    const body = await request.json();
    const {
      artworkId,
      actionType,          // 'buy' | 'rent'
      shippingAddress,     // { name, phone, address, city, zip }
      cardInfo,            // { lastFour } (前端已透過 TapPay SDK 加密，這裡只收 lastFour 做記錄)
      rentalMonths = 1,
    } = body;

    if (!artworkId || !actionType) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 2. 取得作品資料
    const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
    if (!artworks.length) {
      return NextResponse.json({ error: '找不到該作品' }, { status: 404 });
    }
    const artwork = artworks[0];

    const isRental = actionType === 'rent';
    const isPhysical = artwork.art_type === 'physical';

    // 3. 計算金額
    const amount = isRental
      ? Number(artwork.monthly_rent_price)
      : Number(artwork.price);
    const depositAmount = isRental ? Number(artwork.deposit_amount) : 0;

    if (!amount && amount !== 0) {
      return NextResponse.json({ error: '此作品未設定金額' }, { status: 400 });
    }

    // 實體商品必須有收件地址
    if (isPhysical && !shippingAddress?.address) {
      return NextResponse.json({ error: '實體作品需填寫收件地址' }, { status: 400 });
    }

    // 4. 呼叫 Mock 金流閘道
    const gatewayResult = mockFiatGateway({
      amount,
      depositAmount,
      cardLastFour: cardInfo?.lastFour || '1234',
      actionType,
    });

    if (!gatewayResult.success) {
      return NextResponse.json({ error: gatewayResult.message }, { status: 402 });
    }

    // 5. 寫入 DB
    if (isRental) {
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + rentalMonths * 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      await sql`
        INSERT INTO public.rentals (
          artwork_id, tenant_id, start_date, end_date,
          monthly_rent, deposit_amount, status, created_at
        ) VALUES (
          ${artworkId}, ${user.id},
          ${startDate}, ${endDate},
          ${amount}, ${depositAmount},
          ${'active'}, NOW()
        )
      `;
    } else {
      await sql`
        INSERT INTO public.orders (
          artwork_id, buyer_id, amount,
          payment_status, stripe_payment_intent_id, created_at
        ) VALUES (
          ${artworkId}, ${user.id}, ${amount},
          ${'paid'}, ${gatewayResult.transactionId}, NOW()
        )
      `;

      // 扣減庫存（實體作品）
      if (isPhysical && artwork.stock > 0) {
        await sql`
          UPDATE public.artworks
          SET stock = stock - 1
          WHERE id = ${artworkId} AND stock > 0
        `;
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: gatewayResult.transactionId,
      authCode: gatewayResult.authCode,
      message: gatewayResult.message,
      actionType,
    });
  } catch (error: any) {
    console.error('[Fiat Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || '結帳失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
