import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/artwork-chats?artworkId=xxx  → 取得或建立聊天室
// POST /api/artwork-chats               → 傳送訊息
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const artworkId = req.nextUrl.searchParams.get('artworkId');
  if (!artworkId) return NextResponse.json({ error: '缺少 artworkId' }, { status: 400 });

  // 找到這件作品的藝術家
  const { data: artwork } = await supabase
    .from('artworks')
    .select('artist_id')
    .eq('id', artworkId)
    .single();

  if (!artwork) return NextResponse.json({ error: '找不到作品' }, { status: 404 });

  const sellerId = artwork.artist_id;
  const buyerId = user.id;

  // 如果是藝術家自己，不能跟自己聊
  if (sellerId === buyerId) {
    return NextResponse.json({ error: '藝術家無法詢問自己的作品' }, { status: 400 });
  }

  // 嘗試取得現有聊天室
  let { data: chat } = await supabase
    .from('artwork_chats')
    .select('id')
    .eq('artwork_id', artworkId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  // 若不存在則建立
  if (!chat) {
    const { data: newChat, error } = await supabase
      .from('artwork_chats')
      .insert({ artwork_id: artworkId, buyer_id: buyerId, seller_id: sellerId })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    chat = newChat;
  }

  // 取得訊息歷史
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', chat!.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ chatId: chat!.id, messages: messages || [], sellerId });
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
  const { data: chat } = await supabase
    .from('artwork_chats')
    .select('id')
    .eq('id', chatId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .maybeSingle();

  if (!chat) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert({ chat_id: chatId, sender_id: user.id, content: content.trim() })
    .select('id, sender_id, content, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message });
}

// GET /api/artwork-chats/mine → 取得自己所有的聊天室列表（dashboard 用）
