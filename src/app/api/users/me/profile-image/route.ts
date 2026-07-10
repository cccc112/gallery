import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;

    if (!file || (type !== 'avatar' && type !== 'cover')) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `avatars/${user.id}/${type}-${Date.now()}.${ext}`;
    const arrayBuf = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('artwork-images') // Using existing bucket for convenience
      .upload(storagePath, arrayBuf, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage error:', uploadErr);
      return NextResponse.json({ error: '檔案上傳失敗' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('artwork-images').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    if (type === 'avatar') {
      await sql`UPDATE public.users SET avatar_url = ${publicUrl} WHERE id = ${user.id}`;
    } else {
      await sql`UPDATE public.users SET cover_url = ${publicUrl} WHERE id = ${user.id}`;
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Profile image update error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
