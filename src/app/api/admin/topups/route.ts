import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if admin
    const { data: userData } = await supabase.from('users').select('role').eq('id', user?.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    
    const { data: topups, error } = await adminClient
      .from('wallet_transactions')
      .select(`
        *,
        users ( id, email, display_name )
      `)
      .eq('type', 'topup_bank')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, topups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: userData } = await supabase.from('users').select('role').eq('id', user?.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transaction_id, status } = await request.json(); // status: 'completed' or 'rejected'
    
    if (status !== 'completed' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Get transaction to verify it's pending
    const { data: tx, error: txError } = await adminClient
      .from('wallet_transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();
      
    if (txError || !tx) throw new Error('Transaction not found');
    if (tx.status !== 'pending') throw new Error('Transaction is not pending');

    // 2. Update transaction status
    const { error: updateError } = await adminClient
      .from('wallet_transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', transaction_id);
      
    if (updateError) throw updateError;

    // 3. If completed, add to user's wallet_balance
    if (status === 'completed') {
      // In Supabase SQL we'd do an RPC, but we can do a read/write here since traffic is low
      const { data: targetUser, error: userError } = await adminClient
        .from('users')
        .select('wallet_balance')
        .eq('id', tx.user_id)
        .single();
        
      if (!userError && targetUser) {
        const newBalance = Number(targetUser.wallet_balance || 0) + Number(tx.amount);
        await adminClient
          .from('users')
          .update({ wallet_balance: newBalance })
          .eq('id', tx.user_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin topup update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
