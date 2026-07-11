import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const application = await sql`
      UPDATE public.artist_applications
      SET status = ${status}, updated_at = timezone('utc'::text, now())
      WHERE id = ${params.id}
      RETURNING user_id
    `;

    if (application.length > 0 && status === 'approved') {
      const targetUserId = application[0].user_id;
      await sql`
        UPDATE public.users
        SET role = 'artist', updated_at = timezone('utc'::text, now())
        WHERE id = ${targetUserId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Update Application Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
