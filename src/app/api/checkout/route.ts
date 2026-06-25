import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. 驗證登入狀態（Supabase Auth）
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入才能結帳' }, { status: 401 });
    }

    // 2. 解析請求（支援 JSON 與 FormData）
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

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${proto}://${host}`;
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&artworkId=${artworkId}&type=${actionType}&art_type=${artwork.art_type}`;
    const cancelUrl = `${baseUrl}/artwork/${artworkId}?cancelled=true`;

    // 4. 若 Stripe key 未設定，走 Mock 模式
    if (!isStripeConfigured()) {
      console.log('[Mock Checkout] Stripe key not configured, redirecting to mock success.');
      const mockUrl = `${baseUrl}/checkout/success?mock=true&artworkId=${artworkId}&type=${actionType}&art_type=${artwork.art_type}`;
      return NextResponse.json({ url: mockUrl });
    }

    const isRental = actionType === 'rent';
    const isPhysical = artwork.art_type === 'physical';

    // 5. 建構 Line Items
    const lineItems: any[] = [];

    if (isRental) {
      const rentAmount = Math.round(Number(artwork.monthly_rent_price) * 100);
      const depositAmount = Math.round(Number(artwork.deposit_amount) * 100);

      if (!rentAmount || !depositAmount) {
        return NextResponse.json({ error: '此作品未設定租賃金額' }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency: 'twd',
          product_data: {
            name: `${artwork.title} — 首月租金`,
            description: '短期租賃首月租金（之後按月自動扣款）',
          },
          unit_amount: rentAmount,
        },
        quantity: 1,
      });

      lineItems.push({
        price_data: {
          currency: 'twd',
          product_data: {
            name: `${artwork.title} — 租賃押金`,
            description: '租賃押金（保管期間預授權；歸還無損則全額退還）',
          },
          unit_amount: depositAmount,
        },
        quantity: 1,
      });
    } else {
      const purchaseAmount = Math.round(Number(artwork.price) * 100);
      if (!purchaseAmount) {
        return NextResponse.json({ error: '此作品未設定售價' }, { status: 400 });
      }
      lineItems.push({
        price_data: {
          currency: 'twd',
          product_data: {
            name: `${artwork.title}（買斷收藏）`,
            description: isPhysical
              ? '實體藝術品 · 含安全包裝與運輸保險'
              : '數位藝術品 · 付款後可下載高解析度原檔',
          },
          unit_amount: purchaseAmount,
        },
        quantity: 1,
      });
    }

    // ── 加入 10% 平台服務費 ──────────────────────────
    const PLATFORM_FEE_RATE = 0.10;
    const subtotal = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
    if (platformFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'twd',
          product_data: {
            name: 'Atelier Blanc 平台服務費',
            description: '安全交易、版權保護、平台維運費用（10%）',
          },
          unit_amount: platformFee,
        },
        quantity: 1,
      });
    }

    // 6. Stripe Checkout Session 設定
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        artwork_id: artworkId,
        buyer_id: user.id,
        checkout_type: actionType,
      },
    };

    // 實體或租賃 → 收集收件地址
    if (isPhysical || isRental) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['TW', 'HK', 'US', 'JP', 'SG'],
      };
    }

    // 租賃 → 押金使用 manual capture（預授權，不立即請款）
    if (isRental) {
      sessionConfig.payment_intent_data = {
        capture_method: 'manual',
        metadata: {
          rental_deposit: String(artwork.deposit_amount),
          rental_months: '1',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // 7. 回傳 session URL（前端使用 window.location.href 跳轉）
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || '結帳初始化失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
