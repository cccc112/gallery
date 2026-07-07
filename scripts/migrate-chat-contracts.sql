-- ════════════════════════════════════════════════════════════════
-- 藝廊平台升級：聊天室、電子合約、配送方式
-- 請在 Supabase Dashboard > SQL Editor 執行此腳本
-- ════════════════════════════════════════════════════════════════

-- 1. orders 表格新增欄位
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'shipping',
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contract_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contract_signed_buyer_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_signed_seller_at timestamptz;

-- 2. 建立 artwork_chats 表格（一個作品 + 一對買賣家 = 一間聊天室）
CREATE TABLE IF NOT EXISTS public.artwork_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(artwork_id, buyer_id, seller_id)
);

-- 3. 建立 chat_messages 表格
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.artwork_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. RLS 政策
ALTER TABLE public.artwork_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- artwork_chats: 只有聊天室成員可看
DROP POLICY IF EXISTS "chat members can view" ON public.artwork_chats;
CREATE POLICY "chat members can view" ON public.artwork_chats
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "buyer can create chat" ON public.artwork_chats;
CREATE POLICY "buyer can create chat" ON public.artwork_chats
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- chat_messages: 只有聊天室成員可讀寫
DROP POLICY IF EXISTS "chat members can read messages" ON public.chat_messages;
CREATE POLICY "chat members can read messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.artwork_chats
      WHERE id = chat_messages.chat_id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat members can send messages" ON public.chat_messages;
CREATE POLICY "chat members can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.artwork_chats
      WHERE id = chat_messages.chat_id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- 5. 開啟 Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.artwork_chats;
