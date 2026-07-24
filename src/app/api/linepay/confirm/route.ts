import { NextResponse } from 'next/server';
import { requestLinePay } from '@/lib/linepay';
import { createClient } from '@supabase/supabase-js';

// We need a service role key to bypass RLS for wallet updates since this might not have full user session context from LINE Pay redirect
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, amount, orderId, userId } = body;

    if (!transactionId || !amount || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const confirmBody = {
      amount: parseInt(amount),
      currency: 'TWD',
    };

    // Request LINE Pay Confirm API
    const result = await requestLinePay(`/v3/payments/${transactionId}/confirm`, confirmBody);

    if (result.returnCode !== '0000') {
      console.error('LINE Pay confirm failed:', result);
      return NextResponse.json({ error: result.returnMessage }, { status: 400 });
    }

    // Payment is successful, now top up user's wallet points
    // 1 NTD = 1 Blanc Coin
    const pointsToAdd = parseInt(amount);

    // Call stored procedure to safely increment points
    const { data: updateData, error: updateError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      user_id_param: userId,
      amount: pointsToAdd
    });

    if (updateError) {
      console.error('Failed to update wallet:', updateError);
      return NextResponse.json({ error: 'Payment succeeded but wallet update failed.' }, { status: 500 });
    }

    // Also record the transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: orderId, // Use the generated orderId
        user_id: userId,
        amount: pointsToAdd, // Point amount
        type: 'topup',
        status: 'completed',
        payment_method: 'linepay',
        payment_id: transactionId,
      });

    if (txError) {
      console.error('Failed to log transaction:', txError);
      // We don't fail the request here since wallet is already updated
    }

    return NextResponse.json({ success: true, message: 'Top up successful' });
  } catch (error: any) {
    console.error('LINE Pay API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
