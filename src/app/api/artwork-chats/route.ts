import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    // 透過 chatId 取得聊天室
    const { data } = await supabase
      .from('artwork_chats')
      .select('id, artwork_id, buyer_id, seller_id')
      .eq('id', chatIdParam)
      .maybeSingle();
      
    if (!data) return NextResponse.json({ error: '找不到聊天室' }, { status: 404 });
    // 確認權限
    if (data.buyer_id !== user.id && data.seller_id !== user.id) {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }
    chat = data;
    sellerId = data.seller_id;
  } else if (artworkId) {
    // 透過 artworkId 取得或建立聊天室（看展人發起）
    const { data: artwork } = await supabase
      .from('artworks')
      .select('artist_id')
      .eq('id', artworkId)
      .single();

    if (!artwork) return NextResponse.json({ error: '找不到作品' }, { status: 404 });

    sellerId = artwork.artist_id;
    const buyerId = user.id;

    // 如果是藝術家自己，不能跟自己聊
    if (sellerId === buyerId) {
      return NextResponse.json({ error: '藝術家無法詢問自己的作品' }, { status: 400 });
    }

    // 嘗試取得現有聊天室
    const { data: existingChat } = await supabase
      .from('artwork_chats')
      .select('id')
      .eq('artwork_id', artworkId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (existingChat) {
      chat = existingChat;
    } else {
      // 若不存在則建立
      const { data: newChat, error } = await supabase
        .from('artwork_chats')
        .insert({ artwork_id: artworkId, buyer_id: buyerId, seller_id: sellerId })
        .select('id')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      chat = newChat;
    }
  }

  // 取得訊息歷史
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', chat!.id)
    .order('created_at', { ascending: true });

  // 將未讀訊息標記為已讀
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('chat_id', chat!.id)
    .neq('sender_id', user.id)
    .eq('is_read', false);

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
