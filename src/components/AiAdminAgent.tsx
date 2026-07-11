'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function AiAdminAgent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white border border-border/80 rounded-lg shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-secondary/30 border-b border-border/60">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Atelier Blanc AI 營運助理 <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gemini 1.5 Powered Agent</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">我是您的 AI 營運助理</p>
              <p className="text-xs text-muted-foreground mt-1">您可以問我：「目前有幾筆退款申請？」<br />或是「幫我核准最新的提款單」</p>
            </div>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600">
                <Bot className="h-4 w-4" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm ${
              m.role === 'user' 
                ? 'bg-foreground text-background rounded-tr-sm' 
                : 'bg-white border border-border/60 shadow-sm text-foreground rounded-tl-sm'
            }`}>
              {/* Text content */}
              {m.content && (
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              )}
              
              {/* Tool Calls & Invocations */}
              {m.toolInvocations?.map((toolInvocation) => {
                const toolCallId = toolInvocation.toolCallId;
                const toolName = toolInvocation.toolName;
                
                return (
                  <div key={toolCallId} className="mt-3 p-3 rounded-md bg-stone-100/80 border border-border/50 text-xs font-mono">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      {toolInvocation.state === 'result' ? (
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                      )}
                      <span className="font-semibold text-indigo-900/70">Tool: {toolName}</span>
                    </div>
                    
                    {toolInvocation.state === 'result' && (
                      <div className="mt-2 pt-2 border-t border-border/60 text-stone-600 overflow-x-auto">
                        <pre>{JSON.stringify(toolInvocation.result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {m.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-stone-600">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-white border border-border/60 rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-center p-3 text-xs text-rose-500 bg-rose-50 rounded-lg border border-rose-200">
            連線發生錯誤：{error.message}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-border/60">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            className="w-full bg-stone-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full pl-5 pr-14 py-3 text-sm transition-all outline-none"
            value={input}
            placeholder="指派任務給您的 AI 助理..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
