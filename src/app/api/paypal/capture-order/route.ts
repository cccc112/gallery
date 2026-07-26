import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Capture the payment with PayPal
    const captureData = await capturePayPalOrder(orderId);

    // Ensure the capture was successful
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get the captured amount and currency
    const capture = captureData.purchase_units[0].payments.captures[0];
    const amountStr = capture.amount.value;
    const currency = capture.amount.currency_code;
    const customOrderId = captureData.purchase_units[0].reference_id; // we passed this in create-order

    if (currency !== 'TWD') {
      console.warn(`Unexpected currency captured: ${currency}`);
    }

    const pointsToAdd = parseInt(amountStr, 10);

    // Call stored procedure to safely increment points
    const { error: updateError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      user_id_param: user.id,
      amount: pointsToAdd
    });

    if (updateError) {
      console.error('Failed to update wallet after PayPal:', updateError);
      return NextResponse.json({ error: 'Payment succeeded but wallet update failed.' }, { status: 500 });
    }

    // Record the transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: customOrderId || `PP_${orderId}`,
        user_id: user.id,
        amount: pointsToAdd,
        type: 'topup',
        status: 'completed',
        payment_method: 'paypal',
        payment_id: capture.id, // The capture ID
      });

    if (txError) {
      console.error('Failed to log PayPal transaction:', txError);
    }

    return NextResponse.json({ success: true, message: 'Top up successful', captureData });
  } catch (error: any) {
    console.error('Capture PayPal Order Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
