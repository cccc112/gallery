import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { artworkId, rating, comment } = await request.json();
    if (!artworkId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 確認使用者是否真的有購買這項作品
    const checkOrder = await sql`
      SELECT id FROM public.orders 
      WHERE buyer_id = ${user.id} AND artwork_id = ${artworkId} AND payment_status = 'paid'
      LIMIT 1
    `;
    if (checkOrder.length === 0) {
      return NextResponse.json({ error: '您必須先購買此作品才能留下評價' }, { status: 403 });
    }

    // 檢查是否已經評價過
    const checkReview = await sql`
      SELECT id FROM public.reviews
      WHERE buyer_id = ${user.id} AND artwork_id = ${artworkId}
    `;
    if (checkReview.length > 0) {
      return NextResponse.json({ error: '您已經評價過此作品' }, { status: 400 });
    }

    // 寫入評價
    const review = await sql`
      INSERT INTO public.reviews (artwork_id, buyer_id, rating, comment)
      VALUES (${artworkId}, ${user.id}, ${rating}, ${comment})
      RETURNING *
    `;

    return NextResponse.json({ success: true, review: review[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
