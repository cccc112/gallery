import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 用 user session client，不需要 service_role
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const title = (form.get('title') as string)?.slice(0, 100) || 'AI 生成作品';
    const description = (form.get('description') as string) || '';
    const artType = (form.get('art_type') as string) || 'digital';

    if (!file) return NextResponse.json({ error: '缺少圖片檔案' }, { status: 400 });

    // 1. 上傳到 Supabase Storage（用 user session，需要 Storage Policy 允許）
    const ext = 'png';
    const storagePath = `artworks/${user.id}/${Date.now()}.${ext}`;
    const arrayBuf = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('artworks')
      .upload(storagePath, arrayBuf, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadErr) {
      console.error('[upload-ai] storage error:', uploadErr.message);

      // 如果是 RLS/policy 問題，提供更清楚的錯誤訊息
      if (uploadErr.message.includes('row-level security') || uploadErr.message.includes('policy')) {
        return NextResponse.json({
          error: 'Storage 權限未設定，請聯絡管理員開啟上傳權限'
        }, { status: 403 });
      }

      return NextResponse.json({ error: `儲存失敗：${uploadErr.message}` }, { status: 500 });
    }

    // 2. 取得公開 URL
    const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 3. 在 artworks 表建立草稿記錄
    const { data: artwork, error: dbErr } = await supabase
      .from('artworks')
      .insert({
        artist_id: user.id,
        title,
        description,
        art_type: artType,
        preview_file_url: publicUrl,
        full_file_url: publicUrl,
        price: null,
        is_rentable: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbErr) {
      console.error('[upload-ai] db error:', dbErr.message);
      return NextResponse.json({ error: `資料庫錯誤：${dbErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ artworkId: artwork.id, previewUrl: publicUrl });
  } catch (e: any) {
    console.error('[upload-ai] error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
