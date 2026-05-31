import Link from 'next/link';
import { signUp } from '@/app/auth/actions';

interface RegisterPageProps {
  searchParams: { error?: string };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const error = searchParams.error;

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
              乙太藝廊 · 建立帳號
            </p>
          </Link>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-1">加入典藏社群</h2>
          <p className="text-xs text-muted-foreground font-light mb-8">
            建立帳號後即可收藏、購買、租賃，並自由上傳您的創作作品
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signUp} className="space-y-5">
            <div>
              <label htmlFor="display_name" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                顯示名稱
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                placeholder="例：陳大文 / 林小藝"
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

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
              <label htmlFor="password" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                密碼{' '}
                <span className="font-light normal-case tracking-normal text-muted-foreground/60">(至少 6 個字元)</span>
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

            <button
              type="submit"
              className="w-full rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md mt-2"
            >
              建立帳號
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              已有帳號？{' '}
              <Link href="/login" className="text-foreground font-semibold hover:underline underline-offset-4">
                直接登入
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-light tracking-wide">
          註冊即表示您同意 Atelier Blanc 的服務條款與隱私政策
        </p>
      </div>
    </div>
  );
}
