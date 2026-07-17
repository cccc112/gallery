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

// PUT /api/artworks/[id] — 藝術家編輯自己的作品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { id } = params;

  try {
    // 確認是本人的作品
    const { data: artwork } = await supabase
      .from('artworks')
      .select('artist_id, is_rentable, art_type')
      .eq('id', id)
      .single();

    if (!artwork) return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    if (artwork.artist_id !== user.id) return NextResponse.json({ error: '無權限' }, { status: 403 });

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    
    // Some fields may be omitted depending on what we allow editing. Let's allow these:
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const isAiGenerated = formData.get('is_ai_generated') === 'true';
    const originalGuaranteed = formData.get('original_guaranteed') === 'true';
    const seriesId = formData.get('series_id') as string || null;
    const monthlyRentPrice = formData.get('monthly_rent_price') ? Number(formData.get('monthly_rent_price')) : null;
    const depositAmount = formData.get('deposit_amount') ? Number(formData.get('deposit_amount')) : null;
    const stock = formData.get('stock') ? Number(formData.get('stock')) : null;
    
    const tagsStr = formData.get('tags') as string | null;
    let tags: string[] = [];
    if (tagsStr) {
      try { tags = JSON.parse(tagsStr); } catch (e) {}
    }

    if (!title) {
      return NextResponse.json({ error: '作品名稱為必填' }, { status: 400 });
    }

    const updates: any = {
      title,
      description,
      is_ai_generated: isAiGenerated,
      original_guaranteed: originalGuaranteed,
      tags,
      series_id: seriesId
    };

    if (price !== null) updates.price = price;
    if (monthlyRentPrice !== null) updates.monthly_rent_price = monthlyRentPrice;
    if (depositAmount !== null) updates.deposit_amount = depositAmount;
    if (stock !== null) updates.stock = stock;

    const { error: updateError } = await supabase
      .from('artworks')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Artwork update error:', error);
    return NextResponse.json(
      { error: error.message || '更新失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
