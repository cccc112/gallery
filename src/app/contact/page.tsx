'use client';

import Link from 'next/link';
import { Mail, Clock, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Support</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">聯絡我們</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
            無論是作品詢問、合作邀約或技術問題，我們的團隊將在 1–2 個工作天內回覆您。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-foreground">聯絡資訊</h2>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">電子信箱</p>
                  <a href="mailto:hello@atelierblanc.art" className="text-sm text-foreground hover:underline">
                    hello@atelierblanc.art
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">回覆時間</p>
                  <p className="text-sm text-foreground">週一至週五，上午 10:00 – 下午 6:00</p>
                  <p className="text-xs text-muted-foreground mt-0.5">一般問題 1 個工作天，複雜事項 2–3 天</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">所在地區</p>
                  <p className="text-sm text-foreground">台灣・台北</p>
                  <p className="text-xs text-muted-foreground mt-0.5">提供全台灣及國際線上服務</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
              <h2 className="font-serif text-base font-semibold text-foreground mb-4">常見問題快速入口</h2>
              <div className="space-y-2">
                {[
                  { href: '/faq', label: '常見問題 FAQ' },
                  { href: '/shipping', label: '運送與退還政策' },
                  { href: '/consulting', label: '藝術諮詢服務' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-secondary/50 transition-colors text-sm text-foreground group">
                    {label}
                    <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground mb-5">傳送訊息</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">姓名</label>
                <input type="text" placeholder="王小明" required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">電子信箱</label>
                <input type="email" placeholder="your@email.com" required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">主旨</label>
                <select className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors">
                  <option>作品詢問</option>
                  <option>購買 / 租賃問題</option>
                  <option>藝術家合作</option>
                  <option>技術問題</option>
                  <option>其他</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">訊息內容</label>
                <textarea rows={5} placeholder="請描述您的問題或需求…" required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors resize-none" />
              </div>
              <button type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                <Send className="h-4 w-4" />
                送出訊息
              </button>
              <p className="text-[10px] text-muted-foreground text-center">送出後我們將於 1–2 個工作天內以 Email 回覆</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
