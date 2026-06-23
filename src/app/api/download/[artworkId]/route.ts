import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { artworkId: string } }
) {
  // 1. 驗證登入
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  const { artworkId } = params;

  // 2. 驗證已付款（orders 表）
  const orders = await sql`
    SELECT * FROM public.orders
    WHERE artwork_id = ${artworkId}
      AND buyer_id = ${user.id}
      AND payment_status = 'paid'
    LIMIT 1
  `;

  if (orders.length === 0) {
    return NextResponse.json({ error: '您尚未購買此作品' }, { status: 403 });
  }

  // 3. 取得作品的 full_file_url
  const artworks = await sql`
    SELECT full_file_url, title, art_type FROM public.artworks WHERE id = ${artworkId} LIMIT 1
  `;
  if (!artworks.length) {
    return NextResponse.json({ error: '找不到作品' }, { status: 404 });
  }

  const artwork = artworks[0];
  const fullUrl: string | null = artwork.full_file_url;

  // 如果沒有 full_file_url，回退到 preview（暫時）
  if (!fullUrl) {
    return NextResponse.json(
      { error: '此作品尚未上傳高畫質原檔，請聯絡藝術家' },
      { status: 404 }
    );
  }

  // 4. 從 Supabase Storage 產生 15 分鐘有效的簽名 URL
  // full_file_url 格式：https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  // 需要取出 bucket/path
  try {
    const admin = createAdminClient();
    const urlObj = new URL(fullUrl);
    // 路徑格式：/storage/v1/object/public/artworks/xxx.jpg
    const pathParts = urlObj.pathname.split('/object/public/');
    if (pathParts.length < 2) {
      return NextResponse.json({ error: '無法解析儲存路徑' }, { status: 500 });
    }
    const [bucket, ...rest] = pathParts[1].split('/');
    const filePath = rest.join('/');

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 15); // 15 分鐘

    if (error || !data?.signedUrl) {
      console.error('[Download] Signed URL error:', error);
      return NextResponse.json({ error: '無法產生下載連結' }, { status: 500 });
    }

    return NextResponse.json({
      url: data.signedUrl,
      filename: `${artwork.title}.${filePath.split('.').pop() || 'jpg'}`,
      expiresIn: 900, // 秒
    });
  } catch (e: any) {
    console.error('[Download] Error:', e.message);
    return NextResponse.json({ error: '下載服務錯誤' }, { status: 500 });
  }
}
