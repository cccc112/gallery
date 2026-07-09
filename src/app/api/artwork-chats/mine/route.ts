import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/artwork-chats/mine → 取得我參與的所有聊天室（dashboard 用）
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // 先取得聊天室
  const { data: chats, error } = await supabase
    .from('artwork_chats')
    .select(`
      id,
      artwork_id,
      buyer_id,
      seller_id,
      created_at,
      artworks (title, preview_file_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 收集所有需要查詢的 user id
  const userIds = new Set<string>();
  chats?.forEach(chat => {
    userIds.add(chat.buyer_id);
    userIds.add(chat.seller_id);
  });

  // 查詢 public.users 取得更新的 profile
  const { data: usersData } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, role')
    .in('id', Array.from(userIds));

  const userMap = new Map();
  usersData?.forEach(u => userMap.set(u.id, u));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 為每個聊天室取得最新一則訊息與未讀數量
  const chatsWithDetails = await Promise.all(
    (chats || []).map(async (chat) => {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      return { 
        ...chat, 
        buyer: userMap.get(chat.buyer_id) || {},
        seller: userMap.get(chat.seller_id) || {},
        lastMessage: lastMsg, 
        unread_count: count || 0 
      };
    })
  );

  return NextResponse.json({ chats: chatsWithDetails, userId: user.id });
}
