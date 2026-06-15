import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/favorites — 取得目前用戶的喜愛清單
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('favorites')
    .select('artwork_id, artworks(id, title, artist_id, preview_file_url, price, is_rentable, monthly_rent_price, art_type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data || [] });
}

// POST /api/favorites — 切換喜愛狀態（toggle）
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { artwork_id } = await req.json();
  if (!artwork_id) return NextResponse.json({ error: '缺少 artwork_id' }, { status: 400 });

  const admin = createAdminClient();

  // 檢查是否已存在
  const { data: existing } = await admin
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('artwork_id', artwork_id)
    .single();

  if (existing) {
    // 已存在 → 移除
    await admin.from('favorites').delete().eq('id', existing.id);
    return NextResponse.json({ liked: false });
  } else {
    // 不存在 → 新增
    await admin.from('favorites').insert({ user_id: user.id, artwork_id });
    return NextResponse.json({ liked: true });
  }
}
