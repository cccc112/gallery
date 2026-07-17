import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Check ownership
    const check = await sql`SELECT * FROM public.artist_series WHERE id = ${params.id} AND artist_id = ${user.id}`;
    if (check.length === 0) {
      return NextResponse.json({ error: '找不到該系列或無權限修改' }, { status: 404 });
    }

    const result = await sql`
      UPDATE public.artist_series
      SET title = ${title}, description = ${description || null}
      WHERE id = ${params.id} AND artist_id = ${user.id}
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, series: result[0] });
  } catch (error: any) {
    console.error('Failed to update series:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  try {
    // Check ownership
    const check = await sql`SELECT * FROM public.artist_series WHERE id = ${params.id} AND artist_id = ${user.id}`;
    if (check.length === 0) {
      return NextResponse.json({ error: '找不到該系列或無權限刪除' }, { status: 404 });
    }

    // Note: Due to ON DELETE SET NULL on artworks.series_id, artworks won't be deleted.
    await sql`DELETE FROM public.artist_series WHERE id = ${params.id} AND artist_id = ${user.id}`;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete series:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
