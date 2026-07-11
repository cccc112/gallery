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

    const applications = await sql`
      SELECT id, user_id, real_name, id_number, bank_account, portfolio_url, status, created_at
      FROM public.artist_applications
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Admin Fetch Applications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
