'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ summary }: {
  summary: {
    monthlyRent: number;
    depositAmount: number;
    firstCharge: number;
    platformFee: number;
    artistReceives: number;
    rentalMonths: number;
  };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/rental-success`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || '付款失敗，請稍後再試');
      setLoading(false);
    }
    // 成功時 Stripe 會自動導向 return_url
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 費用明細 */}
      <div className="bg-stone-50 rounded-sm border border-border/40 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">費用明細</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>押金（租約結束退還）</span>
            <span>NT${summary.depositAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>首月租金</span>
            <span>NT${summary.monthlyRent.toLocaleString()}</span>
          </div>
          <div className="border-t border-border/40 pt-2 flex justify-between font-semibold text-foreground">
            <span>今日收費合計</span>
            <span>NT${summary.firstCharge.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
          次月起每月自動扣款 NT${summary.monthlyRent.toLocaleString()}
          （平台服務費 NT${summary.platformFee.toLocaleString()}，藝術家實收 NT${summary.artistReceives.toLocaleString()}）
        </div>
      </div>

      {/* Stripe 付款元素 */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">信用卡資訊</h3>
        <div className="border border-border rounded-sm p-4 bg-white">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-500" />
        <span>您的信用卡資訊由 Stripe 加密保護，Atelier Blanc 不會儲存您的卡片資料。授權後，系統將自動每月扣款，您可隨時申請退租。</span>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full rounded-sm bg-primary text-primary-foreground py-4 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            處理中…
          </span>
        ) : (
          `確認租賃並授權每月扣款 NT$${summary.monthlyRent.toLocaleString()}`
        )}
      </button>
    </form>
  );
}

function RentalCheckoutContent() {
  const searchParams = useSearchParams();
  const artworkId = searchParams.get('artworkId');
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [artworkTitle, setArtworkTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!artworkId) {
      router.push('/gallery');
      return;
    }

    fetch('/api/checkout/rental-stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
          setSummary(data.summary);
          setArtworkTitle(data.artworkTitle || '');
        }
      })
      .catch(() => setError('初始化結帳失敗，請稍後再試'))
      .finally(() => setLoading(false));
  }, [artworkId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold mb-2">無法完成結帳</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-foreground">租賃結帳</h1>
          {artworkTitle && (
            <p className="text-sm text-muted-foreground mt-1">{artworkTitle}</p>
          )}
        </div>

        {clientSecret && summary && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1c1917',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-geist-sans)',
                },
              },
            }}
          >
            <CheckoutForm summary={summary} />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default function RentalCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <RentalCheckoutContent />
    </Suspense>
  );
}
