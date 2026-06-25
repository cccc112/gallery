'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import {
  X, CreditCard, Wallet, Loader2, Check,
  MapPin, Lock, Shield, ChevronRight, RefreshCw,
  AlertTriangle, ExternalLink,
} from 'lucide-react';
import { PLATFORM_WALLET, USDC_CONTRACTS, USDC_ABI } from '@/lib/wagmi';

type ActionType = 'buy' | 'rent';
type PaymentMethod = 'card' | 'crypto';
type Step = 'select' | 'stripe-loading' | 'crypto-confirm' | 'processing' | 'success' | 'error';

interface CheckoutModalProps {
  artwork: {
    id: string;
    title: string;
    price: number | null;
    monthly_rent_price: number | null;
    deposit_amount: number | null;
    art_type: 'physical' | 'digital' | 'photography';
    is_rentable: boolean;
  };
  actionType: ActionType;
  isOpen: boolean;
  onClose: () => void;
}

const formatNTD = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

// USDC 換算：1 TWD ≈ 0.031 USDC（以固定匯率示意，正式環境請接即時匯率）
const twdToUsdc = (twd: number) => (twd * 0.031).toFixed(2);

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum', 8453: 'Base', 137: 'Polygon',
};
const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  137: 'https://polygonscan.com/tx/',
};

export function CheckoutModal({ artwork, actionType, isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [txId, setTxId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', zip: '',
    cardNumber: '', cardExpiry: '', cardCvc: '',
  });

  // ── wagmi hooks ──
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isTxPending, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  const isRental = actionType === 'rent';
  const isPhysical = artwork.art_type === 'physical';
  const amount = isRental ? artwork.monthly_rent_price : artwork.price;
  const depositAmount = artwork.deposit_amount;
  const usdcAmount = isRental
    ? `${twdToUsdc((artwork.monthly_rent_price || 0) + (artwork.deposit_amount || 0))} USDC`
    : `${twdToUsdc(artwork.price || 0)} USDC`;

  const totalDisplay = isRental
    ? `首月 ${formatNTD(artwork.monthly_rent_price)} + 押金 ${formatNTD(depositAmount)}`
    : formatNTD(amount);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('crypto-confirm');
      setPayMethod('crypto');
      setErrorMsg('');
      setPendingTxHash(undefined);
      setForm({ name: '', phone: '', address: '', city: '', zip: '', cardNumber: '', cardExpiry: '', cardCvc: '' });
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // 等待 tx 確認後呼叫 API
  useEffect(() => {
    if (isTxConfirmed && pendingTxHash && step === 'processing') {
      confirmCryptoOnServer(pendingTxHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTxConfirmed, pendingTxHash]);

  // ── Stripe Checkout redirect ──
  const handleStripeCheckout = async () => {
    setStep('stripe-loading');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artwork.id, actionType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '建立結帳失敗');
      window.location.href = data.url;
    } catch (err: any) {
      setErrorMsg(err.message || '無法連線至付款平台，請稍後再試');
      setStep('error');
    }
  };

  // ── Crypto checkout ──
  const handleCryptoCheckout = async () => {
    if (!isConnected || !walletAddress) {
      openConnectModal?.();
      return;
    }
    setStep('processing');

    const usdcContract = USDC_CONTRACTS[chainId];
    if (!usdcContract) {
      setErrorMsg(`請切換至支援的網路：Ethereum / Base / Polygon（目前 chain ID: ${chainId}）`);
      setStep('error');
      return;
    }

    try {
      const totalTwd = isRental
        ? (artwork.monthly_rent_price || 0) + (artwork.deposit_amount || 0)
        : (artwork.price || 0);
      const usdcRaw = BigInt(Math.round(totalTwd * 0.031 * 1_000_000)); // USDC 6 decimals

      // 開發環境：模擬 Mock tx hash
      if (process.env.NODE_ENV !== 'production' || !usdcContract) {
        const mockHash = `0xMOCK${Math.random().toString(16).slice(2).padEnd(62, '0')}` as `0x${string}`;
        setPendingTxHash(mockHash);
        await confirmCryptoOnServer(mockHash);
        return;
      }

      // 正式：呼叫 USDC contract.transfer(platform_wallet, amount)
      const hash = await writeContractAsync({
        address: usdcContract,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [PLATFORM_WALLET as `0x${string}`, usdcRaw],
      });
      setPendingTxHash(hash);
      // isTxConfirmed effect 會自動呼叫 confirmCryptoOnServer

    } catch (err: any) {
      // 使用者拒絕 / 餘額不足 等
      setErrorMsg(err.shortMessage || err.message || '交易被拒絕');
      setStep('error');
    }
  };

  const confirmCryptoOnServer = useCallback(async (hash: string) => {
    try {
      const res = await fetch('/api/checkout/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: artwork.id,
          actionType,
          txHash: hash,
          walletAddress,
          chainId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTxId(hash);
      setSuccessMsg(data.message);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || '伺服器確認失敗');
      setStep('error');
    }
  }, [artwork.id, actionType, walletAddress, chainId]);

  const updateForm = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-border/60 rounded-sm shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-stone-50 flex-shrink-0">
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">
              {isRental ? '短期租賃結帳' : '收藏作品'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">{artwork.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount bar */}
        {step !== 'success' && step !== 'error' && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-stone-50 to-amber-50/40 border-b border-border/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">應付金額</p>
                <p className="font-serif text-xl font-semibold text-foreground mt-0.5">{totalDisplay}</p>
              </div>
              <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-sm border ${
                isRental ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isRental ? '押金預授權' : '全額扣款'}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">

          {/* ── 選擇付款方式 (已隱藏，全站改走 Web3) ── */}
          {step === 'select' && (
            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground mb-3 font-light">正在進入 Web3 結帳流程...</p>
            </div>
          )}

          {/* ── Stripe 跳轉 loading ── */}
          {step === 'stripe-loading' && (
            <div className="p-10 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">正在連接安全付款頁面…</p>
              <p className="text-xs text-muted-foreground">即將導向 Stripe 安全結帳，請稍候</p>
            </div>
          )}

          {/* ── Crypto 確認頁 ── */}
          {step === 'crypto-confirm' && (
            <div className="p-6 space-y-5">
              {/* 錢包狀態 */}
              {isConnected ? (
                <div className="flex items-center gap-3 p-3.5 rounded-sm border border-emerald-200 bg-emerald-50/60">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-800">錢包已連接</p>
                    <p className="text-[10px] font-mono text-emerald-700 truncate">{walletAddress}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">網路：{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3.5 rounded-sm border border-amber-200 bg-amber-50/60">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">尚未連接錢包</p>
                    <p className="text-[10px] text-amber-700">點擊下方按鈕連接您的 Web3 錢包</p>
                  </div>
                </div>
              )}

              {/* 付款摘要 */}
              <div className="space-y-2 border border-border/50 rounded-sm p-4 bg-white/50">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">付款摘要</h3>
                {[
                  { label: '作品', value: artwork.title },
                  { label: '類型', value: isRental ? '短期租賃' : '買斷收藏' },
                  ...(isRental ? [
                    { label: '首月租金', value: formatNTD(artwork.monthly_rent_price) },
                    { label: '押金（預授權）', value: formatNTD(artwork.deposit_amount) },
                  ] : [
                    { label: '售價', value: formatNTD(artwork.price) },
                  ]),
                  { label: 'USDC 等值', value: usdcAmount },
                  { label: '收款網路', value: CHAIN_NAMES[chainId] || `Chain ${chainId}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground text-right max-w-[180px] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {!USDC_CONTRACTS[chainId] && isConnected && (
                <div className="flex items-start gap-2.5 p-3 rounded-sm border border-rose-200 bg-rose-50/60 text-xs text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <p>目前連接的網路不支援，請在 MetaMask 中切換至 Ethereum / Base / Polygon</p>
                </div>
              )}

              <button
                onClick={handleCryptoCheckout}
                disabled={isConnected && !USDC_CONTRACTS[chainId]}
                className="w-full rounded-sm bg-purple-700 text-white py-3.5 text-sm font-semibold hover:bg-purple-800 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="h-4 w-4" />
                {isConnected ? `發送 ${usdcAmount}` : '連接錢包並支付'}
              </button>
              <button type="button" onClick={onClose} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                取消結帳
              </button>
            </div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-secondary border-t-primary animate-spin" />
                {payMethod === 'crypto' && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center">
                    <Wallet className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {payMethod === 'crypto' ? '等待區塊鏈確認...' : '與金融機構確認中...'}
                </p>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  {payMethod === 'crypto'
                    ? isTxPending ? '交易已廣播，等待礦工確認' : '正在廣播交易'
                    : '模擬 TapPay 安全驗證'}
                </p>
              </div>
              {isTxPending && pendingTxHash && (
                <a
                  href={`${BLOCK_EXPLORERS[chainId] || 'https://etherscan.io/tx/'}${pendingTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                >
                  在區塊瀏覽器查看 <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-serif text-xl font-semibold text-foreground">
                  {isRental ? '租賃成功！' : '收藏成功！'}
                </p>
                <p className="text-xs text-muted-foreground font-light mt-1.5 leading-relaxed max-w-[280px]">
                  {successMsg}
                </p>
              </div>
              {txId && (
                <div className="w-full bg-secondary/40 rounded-sm px-4 py-2.5 text-left">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {payMethod === 'crypto' ? 'Transaction Hash' : '交易編號'}
                  </p>
                  <p className="font-mono text-[11px] text-foreground font-semibold break-all">{txId}</p>
                  {payMethod === 'crypto' && (
                    <a
                      href={`${BLOCK_EXPLORERS[chainId] || 'https://etherscan.io/tx/'}${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-800 mt-1.5 transition-colors"
                    >
                      在區塊瀏覽器查看 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              <button onClick={() => { onClose(); router.push('/profile'); }}
                className="w-full rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-all">
                查看個人紀錄
              </button>
              <button onClick={() => { onClose(); router.push('/gallery'); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                繼續探索藝廊
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl">
                ❌
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-foreground">付款未完成</p>
                <p className="text-sm text-rose-600 font-light mt-1.5 leading-relaxed">{errorMsg}</p>
              </div>
              <button onClick={onClose}
                className="w-full rounded-sm border border-border py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors">
                關閉
              </button>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                取消
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'select' || step === 'crypto-confirm') && (
          <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-border/40 bg-secondary/10 flex-shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" /> SSL 加密</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Shield className="h-3 w-3" /> PCI DSS</span>
            <span className="text-[10px] text-muted-foreground">🇹🇼 + ⛓️ 雙軌金流</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        .field-label { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--muted-foreground)); margin-bottom: 6px; }
        .field-input { width: 100%; border-radius: 2px; border: 1px solid hsl(var(--border)); background: rgba(255,255,255,0.8); padding: 10px 14px; font-size: 0.875rem; color: hsl(var(--foreground)); outline: none; transition: border-color 0.15s; }
        .field-input:focus { border-color: hsl(var(--primary)); }
        .field-input::placeholder { color: hsl(var(--muted-foreground) / 0.5); }
      `}</style>
    </div>
  );
}
