import Link from 'next/link';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
    artworkId?: string;
    type?: string;
    mock?: string;
  };
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const isMock = searchParams.mock === 'true';
  const checkoutType = searchParams.type || 'buy';
  const artworkId = searchParams.artworkId;

  const isRental = checkoutType === 'rent';

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-50/60 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Success icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-6 mx-auto">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>

        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
          {isRental ? '租賃申請成功！' : '收藏成功！'}
        </h1>

        <p className="text-sm text-muted-foreground font-light leading-relaxed mb-2">
          {isRental
            ? '您的租賃申請已完成付款，押金已預授權。我們將於 2 個工作天內安排配送。'
            : '感謝您的典藏。我們將於 2-3 個工作天內處理您的訂單並安排配送。'}
        </p>

        {isMock && (
          <div className="mt-3 mb-6 px-4 py-2.5 rounded-sm bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
            ⚠️ 測試模式：尚未設定 Stripe 金鑰，此為模擬成功頁面
          </div>
        )}

        {/* Order summary card */}
        <div className="mt-6 bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-5 text-left space-y-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">訂單摘要</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">訂單類型</span>
              <span className="font-semibold text-foreground">{isRental ? '短期租賃' : '買斷收藏'}</span>
            </div>
            {!isMock && searchParams.session_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">結帳編號</span>
                <span className="font-mono text-xs text-foreground truncate max-w-[180px]">{searchParams.session_id.slice(0, 20)}...</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">後續步驟</span>
              <span className="font-semibold text-foreground">等待出貨通知</span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3">
          {artworkId && (
            <Link
              href={`/artwork/${artworkId}`}
              className="flex items-center justify-center gap-2 w-full rounded-sm border border-border py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              查看作品頁面
            </Link>
          )}
          <Link
            href="/gallery"
            className="flex items-center justify-center gap-2 w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            繼續探索藝廊
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
