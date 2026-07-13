'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Send, MessageSquare, Loader2, Paperclip, ImageIcon, FileText } from 'lucide-react';

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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if ((!input.trim() && pendingFiles.length === 0) || !chatId || sending) return;
    setSending(true);

    try {
      let finalContent = input.trim();
      
      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chatId', chatId);
          
          const res = await fetch('/api/artwork-chats/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          
          const isImage = file.type.startsWith('image/');
          return isImage ? `![${data.name}](${data.url})` : `[📁 ${data.name}](${data.url})`;
        });
        
        const uploadedLinks = await Promise.all(uploadPromises);
        if (finalContent) finalContent += '\n\n';
        finalContent += uploadedLinks.join('\n');
      }

      const res = await fetch('/api/artwork-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content: finalContent }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      
      setInput('');
      setPendingFiles([]);
    } catch (e: any) {
      alert('發送失敗: ' + (e.message || '未知錯誤'));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const oversized = newFiles.find(f => f.size > 5 * 1024 * 1024);
      if (oversized) {
        alert('檔案大小不能超過 5MB');
        return;
      }
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderContent = (content: string) => {
    // 簡單解析圖片 ![alt](url)
    const imgRegex = /!\[([^\]]*)\]\((.*?)\)/g;
    // 解析連結 [text](url)
    const linkRegex = /\[([^\]]+)\]\((.*?)\)/g;

    let parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // 將所有匹配找出來處理
    const textWithImagesReplaced = content.replace(imgRegex, (match, alt, url) => {
      return `__IMG__${alt}__URL__${url}__END__`;
    }).replace(linkRegex, (match, text, url) => {
      return `__LINK__${text}__URL__${url}__END__`;
    });

    const tokens = textWithImagesReplaced.split(/(__IMG__.*?__END__|__LINK__.*?__END__)/g);

    return tokens.map((token, i) => {
      if (token.startsWith('__IMG__')) {
        const alt = token.split('__IMG__')[1].split('__URL__')[0];
        const url = token.split('__URL__')[1].split('__END__')[0];
        return (
          <a key={i} href={url} target="_blank" rel="noreferrer" className="block mt-1">
            <img src={url} alt={alt} className="max-w-[200px] max-h-[200px] rounded-lg object-contain border border-border/30 bg-white" />
          </a>
        );
      }
      if (token.startsWith('__LINK__')) {
        const text = token.split('__LINK__')[1].split('__URL__')[0];
        const url = token.split('__URL__')[1].split('__END__')[0];
        return (
          <a key={i} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline underline-offset-2">
            <FileText className="h-3.5 w-3.5" />
            {text}
          </a>
        );
      }
      return <span key={i} className="whitespace-pre-wrap break-words">{token}</span>;
    });
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
                      {renderContent(msg.content)}
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
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1 bg-stone-50">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white border border-border/60 rounded-md px-2 py-1 text-xs">
                  {f.type.startsWith('image/') ? <ImageIcon className="h-3 w-3 text-muted-foreground" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                  <span className="max-w-[150px] truncate text-muted-foreground">{f.name}</span>
                  <button onClick={() => removePendingFile(i)} className="text-muted-foreground hover:text-rose-500 ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 p-3">
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={sending}
                className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-muted-foreground hover:bg-stone-200 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="上傳圖片"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-muted-foreground hover:bg-stone-200 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="上傳檔案"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            <input
              type="file"
              multiple
              ref={imageInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx"
            />
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
            disabled={(!input.trim() && pendingFiles.length === 0) || sending}
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
