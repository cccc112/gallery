import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  try {
    const series = await sql`
      SELECT s.*, 
             (SELECT count(*) FROM public.artworks WHERE series_id = s.id) as artwork_count
      FROM public.artist_series s
      WHERE s.artist_id = ${user.id}
      ORDER BY s.created_at DESC
    `;
    return NextResponse.json({ series });
  } catch (error: any) {
    console.error('Failed to fetch series:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  try {
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: '系列名稱為必填' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO public.artist_series (artist_id, title, description)
      VALUES (${user.id}, ${title}, ${description || null})
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, series: result[0] });
  } catch (error: any) {
    console.error('Failed to create series:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
