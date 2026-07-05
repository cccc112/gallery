import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  const artistId = url.searchParams.get('artistId');
  const artworkId = url.searchParams.get('artworkId');

  try {
    if (sessionId) {
      // 取得特定對話的所有訊息
      const messages = await sql`
        SELECT m.id, m.content, m.sender_id, m.created_at, m.is_read
        FROM public.messages m
        WHERE m.session_id = ${sessionId}
        ORDER BY m.created_at ASC
      `;
      // 將未讀訊息標記為已讀（如果接收者是當前用戶）
      await sql`
        UPDATE public.messages
        SET is_read = true
        WHERE session_id = ${sessionId} AND sender_id != ${user.id} AND is_read = false
      `;
      return NextResponse.json({ messages });
    }

    if (artistId && artworkId) {
      // 買家：查找或建立與特定藝術家、特定作品的對話
      let sessions = await sql`
        SELECT id FROM public.chat_sessions
        WHERE buyer_id = ${user.id} AND artist_id = ${artistId} AND artwork_id = ${artworkId}
        LIMIT 1
      `;
      let sid = sessions.length > 0 ? sessions[0].id : null;
      if (!sid) {
        const newSessions = await sql`
          INSERT INTO public.chat_sessions (buyer_id, artist_id, artwork_id)
          VALUES (${user.id}, ${artistId}, ${artworkId})
          RETURNING id
        `;
        sid = newSessions[0].id;
      }
      return NextResponse.json({ sessionId: sid });
    }

    // 預設：取得用戶參與的所有對話 (可能是買家或藝術家身分)
    const sessions = await sql`
      SELECT cs.id, cs.updated_at,
             a.display_name as artist_name, a.email as artist_email,
             b.display_name as buyer_name, b.email as buyer_email,
             aw.title as artwork_title,
             (SELECT content FROM public.messages m WHERE m.session_id = cs.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
             (SELECT count(*) FROM public.messages m WHERE m.session_id = cs.id AND m.sender_id != ${user.id} AND m.is_read = false) as unread_count
      FROM public.chat_sessions cs
      JOIN public.users a ON cs.artist_id = a.id
      JOIN public.users b ON cs.buyer_id = b.id
      LEFT JOIN public.artworks aw ON cs.artwork_id = aw.id
      WHERE cs.buyer_id = ${user.id} OR cs.artist_id = ${user.id}
      ORDER BY cs.updated_at DESC
    `;
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sessionId, content } = await request.json();
    if (!sessionId || !content) {
      return NextResponse.json({ error: 'Missing sessionId or content' }, { status: 400 });
    }

    // 檢查是否有權限
    const check = await sql`
      SELECT id FROM public.chat_sessions
      WHERE id = ${sessionId} AND (buyer_id = ${user.id} OR artist_id = ${user.id})
    `;
    if (check.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const message = await sql`
      INSERT INTO public.messages (session_id, sender_id, content)
      VALUES (${sessionId}, ${user.id}, ${content})
      RETURNING *
    `;

    // 更新 session 的 updated_at
    await sql`
      UPDATE public.chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}
    `;

    return NextResponse.json({ message: message[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
