'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Bot, Send, BarChart3, Users, MessageSquare, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AdminDashboard() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      { id: '1', role: 'assistant', content: '您好！我是 Atelier Blanc 的 AI 營運助理。我可以幫您分析全站流量、銷售數據，或是草擬客服回覆。請問今天需要什麼協助？' }
    ]
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // 假資料用作圖表展示
  const mockStats = [
    { title: '今日訪客', value: '1,284', icon: <Users className="h-4 w-4" />, change: '+12%' },
    { title: '本週銷售額', value: '$84,500', icon: <TrendingUp className="h-4 w-4" />, change: '+5.4%' },
    { title: '待處理客訴', value: '3', icon: <MessageSquare className="h-4 w-4" />, change: '-2' },
    { title: '轉換率', value: '2.8%', icon: <BarChart3 className="h-4 w-4" />, change: '+0.4%' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">管理員戰情室 (Super Admin)</h1>
          <p className="text-sm text-muted-foreground mt-1">流量監控、自動化數據分析與客服助理</p>
        </div>

        {/* 流量與數據監控區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {mockStats.map((stat, i) => (
            <div key={i} className="bg-white p-5 border border-border rounded-sm shadow-sm flex flex-col">
              <div className="flex items-center justify-between text-muted-foreground mb-4">
                <span className="text-sm font-medium">{stat.title}</span>
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-2 mt-auto">
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* 左側：數據圖表 (Mock) */}
          <div className="lg:col-span-2 bg-white border border-border rounded-sm shadow-sm p-6 flex flex-col">
            <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> 網站流量與轉換趨勢
            </h2>
            <div className="flex-1 relative border border-dashed border-border/50 rounded-sm bg-stone-50/50 flex items-end justify-between p-4 gap-2">
              {/* 簡單 CSS 柱狀圖示意 */}
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    數值: {h * 12}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
              <span>週一</span><span>週二</span><span>週三</span><span>週四</span><span>週五</span><span>週六</span><span>週日</span>
            </div>
          </div>

          {/* 右側：AI Agent 聊天室 */}
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-stone-50 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">AI 營運助理</h2>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> 在線中 (Gemini 3.1 Pro)
                </p>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-md px-4 py-2.5 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-foreground shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-md px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">正在分析資料...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-white flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="輸入指令，例如：幫我分析這週的銷售狀況..."
                className="flex-1 text-sm bg-stone-50 border border-border rounded-sm px-3 py-2 outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
