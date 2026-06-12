'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updatePassword } from '@/app/auth/actions';

interface UpdatePasswordPageProps {
  searchParams: { error?: string };
}

export default function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const error = searchParams?.error;
  const [confirmError, setConfirmError] = useState('');

  function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm_password') as string;
    if (password !== confirm) {
      setConfirmError('兩次輸入的密碼不一致，請重新確認。');
      return;
    }
    setConfirmError('');
    updatePassword(formData);
  }

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
              乙太藝廊 · 設定新密碼
            </p>
          </Link>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-1">設定新密碼</h2>
          <p className="text-xs text-muted-foreground font-light mb-8">
            請輸入您的新密碼（至少 6 個字元）。
          </p>

          {(error || confirmError) && (
            <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {confirmError || decodeURIComponent(error!)}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                新密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                確認新密碼
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md mt-2"
            >
              確認更新密碼
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              <Link href="/login" className="text-foreground font-semibold hover:underline underline-offset-4">
                ← 返回登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
