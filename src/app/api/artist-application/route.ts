import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { real_name, id_number, bank_account, portfolio_url } = await req.json();

    if (!real_name || !id_number || !bank_account) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if there's already a pending application
    const existing = await sql`
      SELECT id FROM public.artist_applications 
      WHERE user_id = ${user.id} AND status = 'pending'
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: '您已經有一份審核中的申請，請耐心等候' }, { status: 400 });
    }

    await sql`
      INSERT INTO public.artist_applications (
        user_id, real_name, id_number, bank_account, portfolio_url
      ) VALUES (
        ${user.id}, ${real_name}, ${id_number}, ${bank_account}, ${portfolio_url}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Artist Application Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
