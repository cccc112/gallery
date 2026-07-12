import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const artworkId = params.id;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // Check if the user has purchased this artwork
    const orders = await sql`
      SELECT id, payment_status 
      FROM public.orders 
      WHERE buyer_id = ${user.id} AND artwork_id = ${artworkId} AND (payment_status = 'paid' OR payment_status = 'completed')
      LIMIT 1
    `;

    if (orders.length === 0) {
      return NextResponse.json({ error: '尚未購買此作品，或付款未完成' }, { status: 403 });
    }

    // Get artwork file URL
    const artworks = await sql`
      SELECT title, high_res_file_url, preview_file_url 
      FROM public.artworks 
      WHERE id = ${artworkId}
    `;

    if (artworks.length === 0) {
      return NextResponse.json({ error: '找不到該作品' }, { status: 404 });
    }

    const artwork = artworks[0];
    const fileUrl = artwork.high_res_file_url || artwork.preview_file_url;

    if (!fileUrl) {
      return NextResponse.json({ error: '該作品尚無可下載的檔案' }, { status: 404 });
    }

    // Return the URL and suggested filename
    const ext = fileUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${artwork.title.replace(/\s+/g, '_')}_HighRes.${ext}`;

    return NextResponse.json({
      url: fileUrl,
      filename: filename
    });

  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: '系統發生錯誤，請稍後再試' }, { status: 500 });
  }
}
