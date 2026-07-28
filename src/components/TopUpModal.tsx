'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, Wallet as WalletIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { PLATFORM_WALLET, USDC_CONTRACTS, USDC_ABI } from '@/lib/crypto';
import { useUsdcRate } from '@/hooks/useUsdcRate';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum', 8453: 'Base', 137: 'Polygon',
};

export default function TopUpModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinePayLoading, setIsLinePayLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live rate
  const { rate, usdcInTwd, loading: rateLoading, isFallback } = useUsdcRate();

  // wagmi hooks
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isTxPending, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Calculate USDC with live rate
  const twdAmount = amount ? Number(amount) : 0;
  const usdcAmount = (twdAmount * rate).toFixed(4);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!amount || amount < 1) return setErrorMsg('儲值點數至少需為 1 點');
    if (!isConnected || !walletAddress) {
      openConnectModal?.();
      return;
    }

    const usdcContract = USDC_CONTRACTS[chainId];
    if (!usdcContract) {
      return setErrorMsg(`請切換至支援的網路：Ethereum / Base / Polygon`);
    }

    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const usdcRaw = BigInt(Math.round(twdAmount * rate * 1_000_000)); // USDC 6 decimals

      // Dev environment mock
      if (process.env.NODE_ENV !== 'production' || !usdcContract) {
        const mockHash = `0xMOCK${Math.random().toString(16).slice(2).padEnd(62, '0')}` as `0x${string}`;
        setPendingTxHash(mockHash);
        await confirmOnServer(mockHash, twdAmount);
        return;
      }

      // Execute real blockchain tx
      const hash = await writeContractAsync({
        address: usdcContract as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [PLATFORM_WALLET as `0x${string}`, usdcRaw],
      });
      
      setPendingTxHash(hash);
      // isTxConfirmed effect will handle the server confirmation
    } catch (err: any) {
      setErrorMsg(err.shortMessage || err.message || '交易被拒絕');
      setIsSubmitting(false);
    }
  };

  const confirmOnServer = async (hash: string, topupAmount: number) => {
    try {
      const res = await fetch('/api/wallet/topup/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: topupAmount,
          txHash: hash,
          chainId,
          walletAddress,
          rate, // 送出當時的匯率，讓後端驗算
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('儲值成功！點數已發放至您的錢包。');
        onSuccess();
      } else {
        throw new Error(data.error || '伺服器確認失敗');
      }
    } catch (e: any) {
      setErrorMsg(e.message || '發生錯誤');
      setIsSubmitting(false);
    }
  };

  const handleLinePay = async () => {
    if (!amount || amount < 1) return setErrorMsg('儲值點數至少需為 1 點');
    setIsLinePayLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/linepay/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: twdAmount,
          orderId: `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'LINE Pay 請求失敗');

      // Redirect to LINE Pay
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      setErrorMsg(err.message || '無法啟動 LINE Pay');
      setIsLinePayLoading(false);
    }
  };

  const createPayPalOrder = async () => {
    if (!amount || amount < 1) {
      setErrorMsg('儲值點數至少需為 1 點');
      throw new Error('Invalid amount');
    }
    setErrorMsg('');
    
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: twdAmount }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '無法建立 PayPal 訂單');
    return data.id; // Return PayPal order ID
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      
      const captureData = await res.json();
      if (!res.ok) throw new Error(captureData.error || 'PayPal 付款確認失敗');
      
      alert('儲值成功！點數已發放至您的錢包。');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || '發生錯誤');
      setIsSubmitting(false);
    }
  };

  // Wait for tx confirmation
  useEffect(() => {
    if (isTxConfirmed && pendingTxHash && isSubmitting) {
      confirmOnServer(pendingTxHash, twdAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTxConfirmed, pendingTxHash]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} disabled={isSubmitting} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-50">
          <X className="h-5 w-5" />
        </button>
        
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-purple-600" /> 點數儲值
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-stone-500">1 點 Blanc 幣 = 1 元新台幣 (NTD)</p>
            {rateLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
            ) : (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${isFallback ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                1 USDC ≈ {usdcInTwd.toFixed(1)} NTD {isFallback ? '(備援)' : '⟳'}
              </span>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">欲購買 Blanc 幣點數</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-mono">Pts</span>
              <input
                type="number"
                min="1"
                required
                disabled={isSubmitting}
                value={amount}
                onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="例如: 1000"
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg font-mono disabled:opacity-50"
              />
            </div>
            
            {amount && Number(amount) > 0 && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-700">需支付 USDC:</span>
                  {rateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  ) : (
                    <span className="font-mono font-bold text-purple-900">{usdcAmount} USDC</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-purple-500">
                  <span>即時匯率</span>
                  <span className="font-mono">1 TWD = {rate.toFixed(5)} USDC</span>
                </div>
              </div>
            )}
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
              <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800">錢包已連接</p>
                <p className="text-[10px] font-mono text-emerald-700 truncate">{walletAddress}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">網路：{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">尚未連接錢包</p>
                <p className="text-[10px] text-amber-700">點擊下方按鈕連接您的 Web3 錢包</p>
              </div>
            </div>
          )}

          {!USDC_CONTRACTS[chainId] && isConnected && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>目前連接的網路不支援，請切換至 Ethereum / Base / Polygon 網路以使用 USDC。</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-100">
              {errorMsg}
            </div>
          )}
          
          {/* Web3 Button */}
          <div className="relative group/btn">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover/btn:opacity-30 blur-md transition duration-500 group-hover/btn:duration-200"></div>
            <button
              type="submit"
              disabled={isSubmitting || rateLoading || (isConnected && !USDC_CONTRACTS[chainId])}
              className="relative w-full bg-gradient-to-b from-stone-800 to-stone-950 text-white rounded-xl py-4 font-sans tracking-widest uppercase text-xs font-semibold hover:from-stone-700 hover:to-stone-900 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 h-[56px] border border-stone-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
                  <span>{isTxPending ? '等待區塊鏈確認中...' : '處理中...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/></svg>
                  <span>{isConnected ? '確認支付並儲值 (USDC)' : '連接 Web3 錢包'}</span>
                </>
              )}
            </button>
          </div>

          {/* PayPal Wrapper */}
          <div className="relative z-0 group/paypal mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-stone-200"></div>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest font-sans">海外專用通道</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-stone-200"></div>
            </div>
            
            <PayPalScriptProvider options={{ 
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
              currency: "TWD",
              intent: "capture",
              locale: "zh_TW"
            }}>
              {(!amount || amount < 1) ? (
                <div className="w-full text-center py-4 bg-stone-50/50 border border-stone-200/60 rounded-xl text-xs font-sans font-medium tracking-wide text-stone-400 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-blue-800/40" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                  請先輸入儲值點數以啟用 PayPal
                </div>
              ) : (
                <div className="bg-gradient-to-b from-white to-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 group-hover/paypal:border-blue-300 group-hover/paypal:shadow-md">
                  <PayPalButtons
                    fundingSource="paypal"
                    style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay", height: 48 }}
                    createOrder={createPayPalOrder}
                    onApprove={onPayPalApprove}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      setErrorMsg("PayPal 載入或付款發生錯誤");
                    }}
                  />
                </div>
              )}
            </PayPalScriptProvider>
          </div>
        </form>
      </div>
    </div>
  );
}
