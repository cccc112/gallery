import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE /api/artworks/[id] — 藝術家刪除自己的作品
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { id } = params;

  // 確認是本人的作品
  const { data: artwork } = await supabase
    .from('artworks')
    .select('artist_id')
    .eq('id', id)
    .single();

  if (!artwork) return NextResponse.json({ error: '作品不存在' }, { status: 404 });
  if (artwork.artist_id !== user.id) return NextResponse.json({ error: '無權限' }, { status: 403 });

  // 確認此作品沒有進行中的訂單或租賃
  const { count: activeOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('artwork_id', id)
    .eq('payment_status', 'paid');

  const { count: activeRentals } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('artwork_id', id)
    .eq('status', 'active');

  if ((activeOrders ?? 0) > 0 || (activeRentals ?? 0) > 0) {
    return NextResponse.json(
      { error: '此作品有進行中的訂單或租賃，無法刪除' },
      { status: 400 }
    );
  }

  // 刪除作品
  const { error } = await supabase.from('artworks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
