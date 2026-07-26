import { NextResponse } from 'next/server';
import { requestLinePay } from '@/lib/linepay';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit('api');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const { amount, orderId } = body;

    if (!amount || !orderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const host = req.headers.get('origin') || 'http://localhost:3000';
    const confirmUrl = `${host}/checkout/linepay?orderId=${orderId}&userId=${userId}&amount=${amount}`;
    const cancelUrl = `${host}/`; // User cancelled payment, redirect to home

    const linePayBody = {
      amount: parseInt(amount),
      currency: 'TWD',
      orderId: orderId,
      packages: [
        {
          id: `PKG_${orderId}`,
          amount: parseInt(amount),
          name: 'Blanc Coin Top-up',
          products: [
            {
              id: 'BLANC_COIN',
              name: 'Blanc 幣 (站內點數)',
              quantity: 1,
              price: parseInt(amount),
            }
          ]
        }
      ],
      redirectUrls: {
        confirmUrl: confirmUrl,
        cancelUrl: cancelUrl,
      },
    };

    // Request LINE Pay API
    const result = await requestLinePay('/v3/payments/request', linePayBody);

    if (result.returnCode !== '0000') {
      console.error('LINE Pay request failed:', result);
      return NextResponse.json({ error: result.returnMessage }, { status: 400 });
    }

    const paymentUrl = result.info.paymentUrl.web;
    const transactionId = result.info.transactionId;

    // Optional: Store transactionId in DB for verification later if needed
    // (We will verify with amount in confirm route)

    return NextResponse.json({ paymentUrl, transactionId });
  } catch (error: any) {
    console.error('LINE Pay API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
