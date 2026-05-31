import Link from 'next/link';
import { Mail } from 'lucide-react';

interface CheckEmailPageProps {
  searchParams: { email?: string };
}

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const email = searchParams.email || '您的信箱';

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
        <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
          我們已將確認信件寄送至<br />
          <span className="font-semibold text-foreground">{decodeURIComponent(email)}</span><br />
          <br />
          請點擊信件中的連結完成帳號驗證，即可開始使用 Atelier Blanc。
        </p>

        <div className="bg-white/60 backdrop-blur-sm border border-border/60 rounded-sm p-5 text-left text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">沒收到信？</p>
          <ul className="space-y-1 list-disc list-inside font-light">
            <li>請檢查垃圾郵件或促銷信件匣</li>
            <li>確認您輸入的 Email 地址正確</li>
            <li>連結有效期間為 24 小時</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all"
          >
            已確認，前往登入
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
