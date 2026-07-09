import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unreadCount: 0 });

  // 取得與目前使用者有關的所有聊天室 ID
  const { data: chats } = await supabase
    .from('artwork_chats')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (!chats || chats.length === 0) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const chatIds = chats.map(c => c.id);

  // 取得這些聊天室中，不是自己發送且未讀的訊息數量
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('chat_id', chatIds)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  return NextResponse.json({ unreadCount: count || 0 });
}
