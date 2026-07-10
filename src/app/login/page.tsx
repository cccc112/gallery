'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OAuthButtons } from '@/components/OAuthButtons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const message = searchParams.get('message');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(searchParams.get('error') || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // 驗證 client 端 session 是否存在
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('登入成功但 client 端無法取得 session，請清除瀏覽器快取後重試');
      setLoading(false);
      return;
    }

    // 檢查 document.cookie 是否有 supabase token
    const hasSbCookie = document.cookie.includes('sb-');
    if (!hasSbCookie) {
      // Cookie 沒寫成功，顯示診斷訊息
      setError(`登入成功但 Cookie 未設定。Cookie 長度: ${document.cookie.length}。請檢查瀏覽器是否封鎖了 Cookie。`);
      setLoading(false);
      return;
    }

    // 登入成功，跳轉至目標頁面
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1">歡迎回來</h2>
      <p className="text-xs text-muted-foreground font-light mb-8">請輸入您的帳號資訊以繼續</p>

      {message === 'password_updated' && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
          密碼已成功更新，請使用新密碼登入。
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {decodeURIComponent(error)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
            電子郵件
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              密碼
            </label>
            <Link href="/forgot-password" className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
              忘記密碼？
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
            記住我的登入狀態（30 天）
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '登入中…' : '登入帳號'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-border/60 text-center">
        <p className="text-xs text-muted-foreground">
          還沒有帳號？{' '}
          <Link
            href={`/register${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-foreground font-semibold hover:underline underline-offset-4"
          >
            立即免費註冊
          </Link>
        </p>
      </div>

      <div className="mt-5">
        <OAuthButtons redirectTo={redirectTo} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="marble-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-50/60 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Atelier Blanc
            </h1>
            <p className="mt-1 text-xs font-light text-muted-foreground uppercase tracking-widest">
              乙太藝廊 · 會員登入
            </p>
          </Link>
        </div>

        {/* useSearchParams 必須包在 Suspense 內 */}
        <Suspense fallback={
          <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10 min-h-[400px] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-light tracking-wide">
          登入即表示您同意 Atelier Blanc 的服務條款與隱私政策
        </p>
      </div>
    </div>
  );
}
