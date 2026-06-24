'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.alreadySubscribed ? '您已經是訂閱者了！' : '訂閱成功！感謝您的加入。');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '訂閱失敗，請稍後再試');
      }
    } catch {
      setStatus('error');
      setMessage('連線失敗，請稍後再試');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 py-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-primary-foreground/80">{message}</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="電子郵件"
          required
          disabled={status === 'loading'}
          className="flex-1 px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm text-sm placeholder:text-primary-foreground/45 focus:outline-none focus:border-primary-foreground/40 text-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2.5 bg-primary-foreground text-primary text-sm font-semibold rounded-sm hover:bg-primary-foreground/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : '訂閱'}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-xs text-rose-300">{message}</p>
      )}
    </>
  );
}

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-serif font-semibold tracking-tight">
                Atelier Blanc
              </span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs font-light">
              精選實體與數位當代藝術，為全球藏家提供卓越的純買賣與短期租賃雙軌平台。成立於 2026 年。
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <InstagramIcon />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <TwitterIcon />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              Explore
            </h4>
            <ul className="space-y-3 font-light text-sm">
              <li>
                <Link href="/gallery" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  探索藝廊
                </Link>
              </li>
              <li>
                <Link href="/gallery?type=digital" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  數位藝術品
                </Link>
              </li>
              <li>
                <Link href="/gallery?type=physical" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  實體藝術品
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  AI 藝術生成
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              Support
            </h4>
            <ul className="space-y-3 font-light text-sm">
              <li>
                <Link href="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  聯絡我們
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  運送與退還政策
                </Link>
              </li>
              <li>
                <Link href="/consulting" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  藝術諮詢服務
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  常見問題 FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              Stay Informed
            </h4>
            <p className="text-sm text-primary-foreground/70 mb-4 font-light">
              訂閱以獲取獨家預展資訊與藝術家專訪。
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Atelier Blanc. All rights reserved. 買賣與租賃雙軌制線上藝廊
          </p>
          <div className="flex items-center gap-6 text-xs text-primary-foreground/50">
            <Link href="/faq#privacy" className="hover:text-primary-foreground/70 transition-colors">
              隱私權政策
            </Link>
            <Link href="/faq#terms" className="hover:text-primary-foreground/70 transition-colors">
              服務條款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
