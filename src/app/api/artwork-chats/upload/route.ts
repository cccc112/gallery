import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const chatId = formData.get('chatId') as string;

    if (!file || !chatId) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 });
    }

    // 確認使用者是否在該聊天室中
    const chats = await sql`
      SELECT id FROM public.artwork_chats
      WHERE id = ${chatId} AND (buyer_id = ${user.id} OR seller_id = ${user.id})
      LIMIT 1
    `;
    if (chats.length === 0) return NextResponse.json({ error: '無權限' }, { status: 403 });

    const ext = file.name.split('.').pop() || 'tmp';
    const filename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // sanitize
    const storagePath = `chats/${chatId}/${Date.now()}-${filename}`;
    const arrayBuf = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('artwork-images') // reuse existing bucket
      .upload(storagePath, arrayBuf, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error('Chat file upload error:', uploadErr);
      return NextResponse.json({ error: '檔案上傳失敗' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('artwork-images').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({ url: publicUrl, name: file.name, type: file.type });
  } catch (error: any) {
    console.error('Chat upload error:', error);
    return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
  }
}
