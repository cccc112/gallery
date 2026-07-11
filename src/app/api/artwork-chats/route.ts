import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

// GET /api/artwork-chats?artworkId=xxx  → 取得或建立聊天室
// POST /api/artwork-chats               → 傳送訊息
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const artworkId = req.nextUrl.searchParams.get('artworkId');
  const chatIdParam = req.nextUrl.searchParams.get('chatId');

  if (!artworkId && !chatIdParam) return NextResponse.json({ error: '缺少參數' }, { status: 400 });

  let chat: any = null;
  let sellerId: string | null = null;

  if (chatIdParam) {
    const data = await sql`SELECT id, artwork_id, buyer_id, seller_id FROM public.artwork_chats WHERE id = ${chatIdParam} LIMIT 1`;
    if (!data.length) return NextResponse.json({ error: '找不到聊天室' }, { status: 404 });
    const c = data[0];
    if (c.buyer_id !== user.id && c.seller_id !== user.id) return NextResponse.json({ error: '無權限' }, { status: 403 });
    chat = c;
    sellerId = c.seller_id;
  } else if (artworkId) {
    const aw = await sql`SELECT artist_id FROM public.artworks WHERE id = ${artworkId} LIMIT 1`;
    if (!aw.length) return NextResponse.json({ error: '找不到作品' }, { status: 404 });
    sellerId = aw[0].artist_id;
    const buyerId = user.id;

    if (sellerId === buyerId) {
      return NextResponse.json({ error: '藝術家無法詢問自己的作品' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM public.artwork_chats WHERE artwork_id = ${artworkId} AND buyer_id = ${buyerId} AND seller_id = ${sellerId} LIMIT 1`;
    if (existing.length > 0) {
      chat = existing[0];
    } else {
      const newChat = await sql`INSERT INTO public.artwork_chats (artwork_id, buyer_id, seller_id) VALUES (${artworkId}, ${buyerId}, ${sellerId}) RETURNING id`;
      chat = newChat[0];
    }
  }

  const messages = await sql`SELECT id, sender_id, content, created_at FROM public.chat_messages WHERE chat_id = ${chat.id} ORDER BY created_at ASC`;

  await sql`UPDATE public.chat_messages SET is_read = true WHERE chat_id = ${chat.id} AND sender_id != ${user.id} AND is_read = false`;

  return NextResponse.json({ chatId: chat.id, messages, sellerId });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { chatId, content } = await req.json();
  if (!chatId || !content?.trim()) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  // 確認此用戶是聊天室成員
  const chats = await sql`
    SELECT id FROM public.artwork_chats
    WHERE id = ${chatId} AND (buyer_id = ${user.id} OR seller_id = ${user.id})
    LIMIT 1
  `;
  if (chats.length === 0) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const inserted = await sql`
    INSERT INTO public.chat_messages (chat_id, sender_id, content)
    VALUES (${chatId}, ${user.id}, ${content.trim()})
    RETURNING id, sender_id, content, created_at
  `;

  return NextResponse.json({ message: inserted[0] });
}

// GET /api/artwork-chats/mine → 取得自己所有的聊天室列表（dashboard 用）
