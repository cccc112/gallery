'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ArtworkChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  artworkTitle: string;
  artistName: string;
  currentUserId: string;
}

export function ArtworkChatModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
  artistName,
  currentUserId,
}: ArtworkChatModalProps) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sellerId, setSellerId] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 初始化：取得或建立聊天室
  const initChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/artwork-chats?artworkId=${artworkId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatId(data.chatId);
      setMessages(data.messages || []);
      setSellerId(data.sellerId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    if (isOpen) initChat();
  }, [isOpen, initChat]);

  // Supabase Realtime 訂閱
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // 避免重複（如果自己發送的訊息已先透過 API 加入）
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  // 自動捲到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/artwork-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        // 樂觀更新
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
           style={{ height: '85vh', maxHeight: '600px' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-stone-50 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">詢問 {artistName}</p>
            <p className="text-xs text-muted-foreground truncate">{artworkTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">開始與藝術家對話吧！</p>
              <p className="text-xs text-muted-foreground/70">可詢問作品故事、材質、尺寸等問題</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isArtist = msg.sender_id === sellerId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {!isMe && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[10px] font-bold text-primary">藝</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] space-y-0.5`}>
                    {!isMe && (
                      <p className="text-[10px] text-muted-foreground pl-1">
                        {isArtist ? '藝術家' : '看展人'}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground/60 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Replies & Input */}
        <div className="flex flex-col border-t border-border/50 bg-white flex-shrink-0">
          <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar bg-stone-50 border-b border-border/30">
            {["請問這件作品還有嗎？", "可以約時間看實體作品嗎？", "運費大約多少？", "請問能提供更多細節照片嗎？"].map(reply => (
              <button
                key={reply}
                onClick={() => setInput(reply)}
                className="whitespace-nowrap px-3 py-1.5 text-[11px] bg-white border border-border/60 rounded-full text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息... (Enter 送出)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-stone-50 max-h-28"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
