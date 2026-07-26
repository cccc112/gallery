'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CheckEmailPageProps {
  searchParams: { email?: string };
}

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const email = searchParams.email || '';
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || token.trim().length !== 6) {
      setError('請輸入正確的 6 位數驗證碼');
      return;
    }
    setError('');

    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message);
      } else {
        setSuccess(true);
        window.location.href = '/dashboard';
      }
    });
  };

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary border border-border mb-6 mx-auto">
          <Mail className="h-7 w-7 text-foreground" />
        </div>

        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">請確認您的信箱</h1>
        <p className="text-sm text-muted-foreground font-light leading-relaxed mb-6">
          我們已寄送郵件至：<br />
          <span className="font-semibold text-foreground">{decodeURIComponent(email)}</span>
        </p>

        {/* 驗證碼輸入表單 */}
        <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-md p-6 text-left mb-6">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4 text-center">
            請輸入信件中的 6 位數驗證碼
          </h2>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              驗證成功！正在登入後台…
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="123456"
              maxLength={6}
              disabled={isPending || success}
              className="w-full text-center tracking-[1em] font-mono text-lg rounded-sm border border-border bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={isPending || success}
              className="w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {isPending ? '驗證中…' : '驗證代碼'}
            </button>
          </form>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-border/60 rounded-sm p-5 text-left text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">沒收到信？</p>
          <ul className="space-y-1 list-disc list-inside font-light">
            <li>請檢查您的垃圾郵件或促銷信件匣</li>
            <li>驗證碼的有效期間為 24 小時</li>
            <li>若仍未收到，請稍後重新嘗試註冊</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            直接前往登入頁面
          </Link>
          <Link
            href="/"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
