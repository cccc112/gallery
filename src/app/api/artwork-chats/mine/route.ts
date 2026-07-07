import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/artwork-chats/mine → 取得我參與的所有聊天室（dashboard 用）
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { data: chats, error } = await supabase
    .from('artwork_chats')
    .select(`
      id,
      artwork_id,
      buyer_id,
      seller_id,
      created_at,
      artworks (title, preview_file_url),
      buyer:buyer_id (raw_user_meta_data),
      seller:seller_id (raw_user_meta_data)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 為每個聊天室取得最新一則訊息
  const chatsWithLastMsg = await Promise.all(
    (chats || []).map(async (chat) => {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...chat, lastMessage: lastMsg };
    })
  );

  return NextResponse.json({ chats: chatsWithLastMsg, userId: user.id });
}
