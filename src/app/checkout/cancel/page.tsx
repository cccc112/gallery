import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';

interface CancelPageProps {
  searchParams: { artworkId?: string };
}

export default function CheckoutCancelPage({ searchParams }: CancelPageProps) {
  const artworkId = searchParams.artworkId;

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-200 mb-6 mx-auto">
          <XCircle className="h-8 w-8 text-rose-400" />
        </div>

        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">結帳已取消</h1>
        <p className="text-sm text-muted-foreground font-light mb-8">
          您的付款尚未完成，作品仍保留於藝廊中。若有任何疑問，歡迎聯絡我們。
        </p>

        <div className="flex flex-col gap-3">
          {artworkId ? (
            <Link
              href={`/artwork/${artworkId}`}
              className="flex items-center justify-center gap-2 w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              返回作品頁面
            </Link>
          ) : (
            <Link
              href="/gallery"
              className="flex items-center justify-center gap-2 w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              返回探索藝廊
            </Link>
          )}
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
