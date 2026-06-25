import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function generateTradeNo() {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-8); // 後 8 碼
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AB${timestamp}${random}`; // 長度 14，綠界限制為 20 以內
}

export async function POST(request: Request) {
  try {
    // 1. 驗證登入狀態
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入才能結帳' }, { status: 401 });
    }

    // 2. 解析請求
    let artworkId: string, actionType: string;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      artworkId = body.artworkId;
      actionType = body.actionType; // 'buy' | 'rent'
    } else {
      const form = await request.formData();
      artworkId = form.get('artworkId') as string;
      actionType = (form.get('checkoutType') || form.get('actionType')) as string;
    }

    if (!artworkId || !actionType) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 3. 取得作品資料
    const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
    if (artworks.length === 0) {
      return NextResponse.json({ error: '找不到該作品' }, { status: 404 });
    }
    const artwork = artworks[0];

    const isRental = actionType === 'rent';
    const tradeNo = generateTradeNo();

    // 4. 計算金額並寫入 Pending 訂單
    if (isRental) {
      const rentAmount = Math.round(Number(artwork.monthly_rent_price));
      const depositAmount = Math.round(Number(artwork.deposit_amount));

      if (!rentAmount || !depositAmount) {
        return NextResponse.json({ error: '此作品未設定租賃金額' }, { status: 400 });
      }
      
      const rentalMonths = 1;
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + rentalMonths * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      await sql`
        INSERT INTO public.rentals (
          artwork_id, tenant_id, start_date, end_date,
          monthly_rent, deposit_amount, status, created_at, payment_transaction_id
        ) VALUES (
          ${artworkId}, ${user.id},
          ${startDate}, ${endDate},
          ${rentAmount}, ${depositAmount},
          ${'pending'}, NOW(), ${tradeNo}
        )
      `;
    } else {
      const purchaseAmount = Math.round(Number(artwork.price));
      if (!purchaseAmount) {
        return NextResponse.json({ error: '此作品未設定售價' }, { status: 400 });
      }

      await sql`
        INSERT INTO public.orders (
          artwork_id, buyer_id, amount,
          payment_status, payment_transaction_id, created_at
        ) VALUES (
          ${artworkId}, ${user.id}, ${purchaseAmount},
          ${'pending'}, ${tradeNo}, NOW()
        )
      `;
    }

    // 5. 回傳跳轉至中繼頁面的 URL
    return NextResponse.json({ url: `/checkout/ecpay?tradeNo=${tradeNo}` });
  } catch (error: any) {
    console.error('[Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || '結帳初始化失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
