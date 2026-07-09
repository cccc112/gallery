-- ════════════════════════════════════════════════════════════════
-- 藝廊平台升級：新增聊天訊息未讀狀態
-- 請在 Supabase Dashboard > SQL Editor 執行此腳本
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 也可以順便將現有的所有訊息標記為已讀，避免產生過多舊的未讀通知
UPDATE public.chat_messages SET is_read = true WHERE is_read IS NULL OR is_read = false;
