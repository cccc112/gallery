import Link from 'next/link';
import { forgotPassword } from '@/app/auth/actions';

interface ForgotPasswordPageProps {
  searchParams: { error?: string; sent?: string; email?: string };
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const error = searchParams.error;
  const sent = searchParams.sent === '1';
  const email = searchParams.email ? decodeURIComponent(searchParams.email) : '';

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
              乙太藝廊 · 重設密碼
            </p>
          </Link>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-lg px-8 py-10">
          {sent ? (
            <>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl">
                  ✉
                </div>
                <h2 className="font-serif text-xl font-semibold text-foreground">確認信已寄出</h2>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  我們已將密碼重設連結寄送至
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                  <br />
                  請查收信箱並點擊連結（連結有效 1 小時）。
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  若未收到，請確認垃圾郵件資料夾，或
                </p>
                <button
                  form="resend-form"
                  type="submit"
                  className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  再次發送
                </button>
                <form id="resend-form" action={forgotPassword}>
                  <input type="hidden" name="email" value={email} />
                </form>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-1">忘記密碼</h2>
              <p className="text-xs text-muted-foreground font-light mb-8">
                輸入您的帳號電子郵件，我們將寄送重設連結給您。
              </p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {decodeURIComponent(error)}
                </div>
              )}

              <form action={forgotPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
                  >
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

                <button
                  type="submit"
                  className="w-full rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md mt-2"
                >
                  發送重設連結
                </button>
              </form>
            </>
          )}

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
