'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function LinePayConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const userId = searchParams.get('userId');

    if (!transactionId || !orderId || !amount || !userId) {
      setStatus('error');
      setErrorMsg('缺少必要的交易參數');
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch('/api/linepay/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId, orderId, amount, userId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '確認付款失敗');

        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || '發生未知錯誤');
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 max-w-md w-full text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-[#06C755] animate-spin mb-6" />
            <h1 className="text-2xl font-serif font-semibold text-stone-900 mb-2">處理中</h1>
            <p className="text-stone-500 text-sm">正在與 LINE Pay 確認您的付款，請勿關閉視窗...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-[#06C755] mb-6" />
            <h1 className="text-2xl font-serif font-semibold text-stone-900 mb-2">付款成功！</h1>
            <p className="text-stone-500 text-sm mb-8">Blanc 幣已成功儲值至您的站內錢包。</p>
            <Link 
              href="/"
              className="px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors w-full inline-block font-medium"
            >
              返回首頁
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <XCircle className="h-16 w-16 text-rose-500 mb-6" />
            <h1 className="text-2xl font-serif font-semibold text-stone-900 mb-2">付款失敗</h1>
            <p className="text-stone-500 text-sm mb-2">{errorMsg}</p>
            <p className="text-stone-400 text-xs mb-8">若您已被扣款，請聯繫客服處理。</p>
            <Link 
              href="/"
              className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors w-full inline-block font-medium"
            >
              返回首頁
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
