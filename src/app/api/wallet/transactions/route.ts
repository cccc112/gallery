import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // Get user wallet balance from users table (we need to bypass RLS or use the one from auth if possible, but users table RLS should allow viewing own data)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, frozen_balance')
      .eq('id', user.id)
      .single();
      
    if (userError) throw userError;

    return NextResponse.json({ 
      success: true, 
      transactions, 
      wallet_balance: userData.wallet_balance || 0,
      frozen_balance: userData.frozen_balance || 0
    });

  } catch (error: any) {
    console.error('Fetch wallet error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
