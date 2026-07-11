'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OAuthButtons } from '@/components/OAuthButtons';

function LoginForm() {
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get('redirectTo') || '/';
  const redirectTo = rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') ? rawRedirectTo : '/';
  const error = searchParams.get('error') || '';

  return (
    <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
      <h2 className="font-serif text-xl font-semibold text-foreground mb-1 text-center">歡迎來到 Atelier Blanc</h2>
      <p className="text-xs text-muted-foreground font-light mb-8 text-center">請使用 Google 帳號登入</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium whitespace-pre-wrap">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="mt-2">
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
