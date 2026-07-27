import { NextResponse } from 'next/server';
import { requestLinePay } from '@/lib/linepay';
import { createClient } from '@supabase/supabase-js';
import { sql } from '@/lib/db';

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

    // Call raw SQL to safely increment points
    await sql`
      UPDATE users 
      SET wallet_balance = wallet_balance + ${pointsToAdd} 
      WHERE id = ${userId}
    `;

    // Also record the transaction
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        id: orderId, // Use the generated orderId
        user_id: userId,
        amount: pointsToAdd, // Point amount
        type: 'topup_card', // Fallback type for linepay
        status: 'completed',
        reference_id: transactionId,
        metadata: { payment_method: 'linepay' }
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
