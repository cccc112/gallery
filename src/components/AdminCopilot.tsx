'use client';

import { useChat } from 'ai/react';
import { Bot, Send, User, Loader2, X, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function AdminCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/admin/chat',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-105 z-50 group"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold text-sm tracking-wider">AI 總管 (Admin Copilot)</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-10">
            <Bot className="h-10 w-10 mx-auto text-indigo-300 mb-2 opacity-50" />
            <p>你好！我是您的專屬 AI 總管。</p>
            <p className="mt-1">您可以問我：「目前網站有多少位使用者？」<br/>或是「幫我尋找名稱有宇宙的作品」。</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-200 text-stone-700'}`}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-border text-foreground rounded-tl-sm shadow-sm'
              }`}>
                {m.content}
                
                {m.toolInvocations?.map((tool) => (
                  <div key={tool.toolCallId} className="mt-2 text-xs text-indigo-500 bg-indigo-50 p-2 rounded flex items-center gap-2">
                    {tool.state === 'result' ? (
                      <span className="font-medium text-emerald-600">✓ 成功執行工具: {tool.toolName}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> 正在呼叫系統...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <div className="h-7 w-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-2 bg-white border border-border rounded-2xl rounded-tl-sm shadow-sm text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce delay-75" />
                <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-border">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="指派任務或詢問營運數據..."
            className="w-full pl-4 pr-12 py-2.5 bg-stone-50 border border-border rounded-full text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 h-8 w-8 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-stone-300 hover:bg-indigo-700 transition-colors"
          >
            <Send className="h-4 w-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
