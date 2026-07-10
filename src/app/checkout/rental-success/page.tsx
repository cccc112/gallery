'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function RentalSuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-3">租賃成立！</h1>
        <p className="text-sm text-muted-foreground mb-2">
          押金與首月租金已成功扣款，次月起將自動每月扣款。
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          合約與付款詳情將寄送至您的電子郵件。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-sm bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            前往儀表板
          </Link>
          <Link
            href="/gallery"
            className="rounded-sm border border-border px-6 py-3 text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            繼續瀏覽畫廊
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RentalSuccessPage() {
  return (
    <Suspense fallback={null}>
      <RentalSuccessContent />
    </Suspense>
  );
}
