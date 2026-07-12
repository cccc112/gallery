'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Home, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
    artworkId?: string;
    type?: string;
    mock?: string;
    art_type?: string;
  };
}

function DownloadButton({ artworkId }: { artworkId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleDownload = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/download/${artworkId}`);
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error || '下載失敗');
        setState('error');
        return;
      }
      // 觸發下載
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename || 'artwork';
      a.click();
      setState('done');
    } catch {
      setErrMsg('網路錯誤，請稍後再試');
      setState('error');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={state === 'loading' || state === 'done'}
        className="flex items-center justify-center gap-2 w-full rounded-sm bg-emerald-600 text-white py-3 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
      >
        {state === 'loading' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> 產生下載連結中…</>
        ) : state === 'done' ? (
          <><CheckCircle className="h-4 w-4" /> 已開始下載</>
        ) : (
          <><Download className="h-4 w-4" /> 下載高畫質原檔</>
        )}
      </button>
      {state === 'error' && (
        <p className="text-xs text-rose-600 text-center">{errMsg}</p>
      )}
      {state === 'done' && (
        <p className="text-xs text-muted-foreground text-center">連結 15 分鐘內有效，若需重新下載請重新整理頁面</p>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const isMock = searchParams.mock === 'true';
  const checkoutType = searchParams.type || 'buy';
  const artworkId = searchParams.artworkId;
  const artType = searchParams.art_type;

  const isRental = checkoutType === 'rent';
  const isDigital = artType === 'digital' || artType === 'photography';

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (isMock || !searchParams.session_id) {
      setIsVerifying(false);
      setPaymentStatus('paid'); // Mock environment defaults to paid
      return;
    }

    let intervalId: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/status?session_id=${searchParams.session_id}&type=${checkoutType}`);
        const data = await res.json();
        if (data.isPaid || data.status === 'paid') {
          setPaymentStatus('paid');
          setIsVerifying(false);
          clearInterval(intervalId);
        } else if (data.status === 'failed') {
          setPaymentStatus('failed');
          setIsVerifying(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to check status', err);
      }
    };

    // Check immediately, then poll every 2 seconds
    checkStatus();
    intervalId = setInterval(checkStatus, 2000);

    // Timeout after 30 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setIsVerifying(false);
    }, 30000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [searchParams.session_id, isMock, checkoutType]);

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
          {isVerifying ? '正在確認付款狀態...' : paymentStatus === 'paid' ? (isRental ? '租賃申請成功！' : '收藏成功！') : '付款未完成'}
        </h1>

        <p className="text-sm text-muted-foreground font-light leading-relaxed mb-2">
          {isVerifying ? '這可能需要幾秒鐘的時間，請稍候。' : paymentStatus === 'paid' ? (isRental
            ? '您的租賃申請已完成付款，押金已預授權。我們將於 2 個工作天內安排配送。'
            : isDigital
            ? '感謝您的典藏！您可以立即下載高畫質原檔。'
            : '感謝您的典藏。我們將於 2-3 個工作天內處理您的訂單並安排配送。') : '我們未能確認您的付款成功。如果您取消了付款，可以返回重新結帳。'}
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
              <span className="font-semibold text-foreground">
                {isDigital && !isRental ? '立即下載原檔' : '等待出貨通知'}
              </span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3">
          {/* 數位作品買斷 → 顯示下載按鈕 */}
          {isDigital && !isRental && artworkId && !isMock && paymentStatus === 'paid' && (
            <DownloadButton artworkId={artworkId} />
          )}

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
