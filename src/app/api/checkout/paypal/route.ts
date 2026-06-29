import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal API keys not configured');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Auth failed');
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, artworkId, orderID, actionType } = await req.json();

    if (action === 'create') {
      const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
      if (!artworks.length) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
      const artwork = artworks[0];
      const isRental = actionType === 'rent';
      // 注意：PayPal 要求金額為字串格式，通常以 USD 計價。這裡假設我們以 USD 計價，做個粗略的 TWD->USD 轉換 (1:0.031)
      const twdAmount = isRental ? Number(artwork.monthly_rent_price) + Number(artwork.deposit_amount) : Number(artwork.price);
      const usdAmount = (twdAmount * 0.031).toFixed(2);

      const accessToken = await generateAccessToken();
      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: 'USD', value: usdAmount },
            description: `${isRental ? 'Rent' : 'Buy'} - ${artwork.title}`
          }],
        }),
      });

      const orderData = await response.json();
      if (!response.ok) throw new Error('Failed to create PayPal order');
      return NextResponse.json({ id: orderData.id });
    }

    if (action === 'capture') {
      const accessToken = await generateAccessToken();
      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const captureData = await response.json();
      if (!response.ok) throw new Error('Failed to capture PayPal order');
      
      if (captureData.status === 'COMPLETED') {
        const isRental = actionType === 'rent';
        const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
        const artwork = artworks[0];
        
        if (isRental) {
          const rentAmount = Math.round(Number(artwork.monthly_rent_price));
          const depositAmount = Math.round(Number(artwork.deposit_amount));
          const startDate = new Date().toISOString().slice(0, 10);
          const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          await sql`
            INSERT INTO public.rentals (
              artwork_id, tenant_id, start_date, end_date,
              monthly_rent, deposit_amount, status, payment_transaction_id, created_at
            ) VALUES (
              ${artworkId}, ${user.id}, ${startDate}, ${endDate},
              ${rentAmount}, ${depositAmount}, 'active', ${captureData.id}, NOW()
            )
          `;
        } else {
          const purchaseAmount = Math.round(Number(artwork.price));
          await sql`
            INSERT INTO public.orders (
              artwork_id, buyer_id, amount,
              payment_status, payment_transaction_id, created_at
            ) VALUES (
              ${artworkId}, ${user.id}, ${purchaseAmount},
              'paid', ${captureData.id}, NOW()
            )
          `;
          
          if (artwork.art_type === 'physical' && artwork.stock > 0) {
            await sql`UPDATE public.artworks SET stock = stock - 1 WHERE id = ${artworkId}`;
          }
        }
        return NextResponse.json({ success: true, captureId: captureData.id });
      }
      return NextResponse.json({ error: 'Order not completed' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('PayPal API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
