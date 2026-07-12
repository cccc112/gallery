'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, User, MessageSquare, Paperclip, FileText, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ChatDashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) router.push('/login?redirectTo=/dashboard/chat');
      else {
        setCurrentUser(user);
        fetchSessions();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/artwork-chats/mine');
      const data = await res.json();
      if (data.chats) setSessions(data.chats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    try {
      const res = await fetch(`/api/artwork-chats?chatId=${sessionId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      
      // Update unread count locally
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unread_count: 0 } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSessionId) return;

    const content = input;
    setInput('');
    setMessages(prev => [...prev, { id: 'tmp', content, sender_id: currentUser?.id, created_at: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/artwork-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedSessionId, content })
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === 'tmp' ? data.message : m));
        fetchSessions(); // Refresh list to update latest message
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

    // 檢查檔案大小 (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB');
      return;
    }

    setSendingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', selectedSessionId);

      const res = await fetch('/api/artwork-chats/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const isImage = file.type.startsWith('image/');
      const content = isImage ? `![${data.name}](${data.url})` : `[📁 ${data.name}](${data.url})`;

      const sendRes = await fetch('/api/artwork-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedSessionId, content }),
      });
      const sendData = await sendRes.json();
      if (sendRes.ok && sendData.message) {
        setMessages(prev => {
          if (prev.find(m => m.id === sendData.message.id)) return prev;
          return [...prev, sendData.message];
        });
        fetchSessions();
      }
    } catch (e: any) {
      alert('上傳失敗: ' + (e.message || '未知錯誤'));
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderContent = (content: string) => {
    const imgRegex = /!\[([^\]]*)\]\((.*?)\)/g;
    const linkRegex = /\[([^\]]+)\]\((.*?)\)/g;

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

  if (loading) return <div className="p-10 text-center text-muted-foreground">載入中...</div>;

  return (
    <div className="marble-bg min-h-screen p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-stone-200/50 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">客服收件匣</h1>
            <p className="text-sm text-muted-foreground mt-1">在這裡管理與藝術家/看展人的客服私訊</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-border/50 rounded-sm shadow-sm flex h-[600px] overflow-hidden">
          {/* 左側對話列表 */}
          <div className="w-1/3 border-r border-border/50 flex flex-col bg-white/40">
            <div className="p-4 border-b border-border/50 font-semibold text-sm">所有對話 ({sessions.length})</div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">尚無對話紀錄</div>
              ) : (
                sessions.map(s => {
                  const isArtist = s.seller_id === currentUser?.id;
                  
                  const buyerData = s.buyer || {};
                  const sellerData = s.seller || {};
                  
                  const buyerName = buyerData.display_name || buyerData.raw_user_meta_data?.full_name || '看展人';
                  const sellerName = sellerData.display_name || sellerData.raw_user_meta_data?.full_name || '藝術家';

                  const otherName = isArtist ? buyerName : sellerName;
                  const otherAvatar = (isArtist ? buyerData.avatar_url : sellerData.avatar_url) 
                    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(otherName)}`;
                  const artworkTitle = s.artworks?.title ? `[詢問作品：${s.artworks.title}]` : '';
                  const lastMsgTime = s.lastMessage?.created_at ? new Date(s.lastMessage.created_at).toLocaleString() : new Date(s.created_at).toLocaleString();
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadMessages(s.id)}
                      className={`w-full text-left p-4 border-b border-border/50 hover:bg-stone-100/50 transition-colors ${selectedSessionId === s.id ? 'bg-stone-100' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img src={otherAvatar} alt={otherName} className="h-6 w-6 rounded-full bg-stone-100 border border-border/40 object-cover flex-shrink-0" />
                          <p className="text-sm font-semibold truncate">
                            {otherName} 
                            <span className="block text-[10px] text-indigo-600 font-medium mt-0.5">{artworkTitle}</span>
                          </p>
                        </div>
                        {Number(s.unread_count) > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0 ml-2">
                            {s.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.lastMessage?.content || '點擊開始對話'}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">{lastMsgTime}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 右側對話視窗 */}
          <div className="w-2/3 flex flex-col bg-stone-50/30">
            {selectedSessionId ? (
              <>
                <div className="p-4 border-b border-border/50 bg-white/40 flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-sm">對話視窗</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map(m => {
                    const isMe = m.sender_id === currentUser?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-sm text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-white border border-border/50'}`}>
                          {renderContent(m.content)}
                          <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={sendMessage} className="p-4 bg-white/60 border-t border-border/50 flex gap-2 items-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingImage}
                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-stone-100 rounded-sm text-muted-foreground hover:bg-stone-200 hover:text-foreground transition-colors disabled:opacity-50"
                    title="附加上傳"
                  >
                    {sendingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="輸入訊息..."
                    className="flex-1 bg-white border border-border/50 rounded-sm px-4 h-10 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-4 opacity-20" />
                <p className="text-sm">選擇左側對話以開始聊天</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
