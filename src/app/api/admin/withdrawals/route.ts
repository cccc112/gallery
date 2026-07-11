import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const withdrawals = await sql`
      SELECT id, artist_id, amount, bank_account, status, created_at
      FROM public.withdrawals
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Admin Fetch Withdrawals Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
