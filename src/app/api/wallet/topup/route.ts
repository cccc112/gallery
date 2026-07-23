import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type, metadata } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum topup amount is 1' }, { status: 400 });
    }

    if (type === 'topup_bank') {
      // Bank transfer is manual, status is pending
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'topup_bank',
          status: 'pending',
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, transaction: data });
    } 
    
    if (type === 'topup_card' || type === 'topup_crypto') {
      // For automated systems, we grant the points immediately and mark as completed
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          type,
          status: 'completed',
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Update user wallet balance immediately
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      
      const { data: userData } = await adminClient
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();
        
      if (userData) {
        await adminClient
          .from('users')
          .update({ wallet_balance: Number(userData.wallet_balance || 0) + Number(amount) })
          .eq('id', user.id);
      }

      return NextResponse.json({ success: true, transaction: data });
    }
    
    return NextResponse.json({ error: 'Unsupported topup type' }, { status: 400 });

  } catch (error: any) {
    console.error('Wallet topup error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
