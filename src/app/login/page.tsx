import Link from 'next/link';
import { signIn } from '@/app/auth/actions';

interface LoginPageProps {
  searchParams: { error?: string; redirect?: string; message?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error;
  const redirectTo = searchParams.redirect || '/';
  const message = searchParams.message;

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center px-6 py-16">
      {/* Background decorative blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-50/60 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
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

        {/* Card */}
        <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-1">歡迎回來</h2>
          <p className="text-xs text-muted-foreground font-light mb-8">請輸入您的帳號資訊以繼續</p>

          {/* Error */}
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

          <form action={signIn} className="space-y-5">
            <input type="hidden" name="redirect" value={redirectTo} />

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
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  密碼
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
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
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md mt-2"
            >
              登入帳號
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              還沒有帳號？{' '}
              <Link href="/register" className="text-foreground font-semibold hover:underline underline-offset-4">
                立即免費註冊
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-muted-foreground mt-6 font-light tracking-wide">
          登入即表示您同意 Atelier Blanc 的服務條款與隱私政策
        </p>
      </div>
    </div>
  );
}
