'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import TopUpModal from '@/components/TopUpModal';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/transactions');
      const data = await res.json();
      if (data.success) {
        setBalance(data.wallet_balance);
        setFrozenBalance(data.frozen_balance);
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium"><CheckCircle2 className="h-3 w-3" /> 完成</span>;
      case 'pending': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium"><Clock className="h-3 w-3" /> 審核中</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-medium"><XCircle className="h-3 w-3" /> 拒絕</span>;
      default: return null;
    }
  };

  const getTxName = (type: string) => {
    const map: Record<string, string> = {
      'topup_bank': '銀行轉帳儲值',
      'topup_card': '信用卡儲值',
      'topup_crypto': '加密貨幣儲值',
      'purchase': '購買藝術品',
      'rent_deposit_freeze': '租賃押金凍結',
      'rent_deposit_unfreeze': '租賃押金退還',
      'rent_payment': '支付租金',
      'withdrawal': '提領餘額'
    };
    return map[type] || type;
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-foreground">我的錢包</h1>
            <p className="text-sm text-muted-foreground mt-1">管理您的 Blanc 幣餘額與儲值紀錄 (1 點 = 1 NTD)</p>
          </div>
          <Link href="/profile" className="text-sm font-medium hover:underline text-muted-foreground">返回個人主頁</Link>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <p className="text-stone-300 font-medium tracking-wide uppercase text-sm mb-2">可用餘額 (Blanc 幣)</p>
            <div className="text-5xl font-mono font-light tracking-tight mb-8">
              {Number(balance).toLocaleString()} <span className="text-2xl text-stone-400">Pts</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-stone-700/50 pt-6">
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">凍結押金</p>
                <p className="text-xl font-mono text-stone-200">{Number(frozenBalance).toLocaleString()} Pts</p>
              </div>
              
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="bg-white text-stone-900 hover:bg-stone-100 px-8 py-3 rounded-full font-medium transition-colors shadow-lg shadow-white/10"
              >
                儲值點數
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/80 border border-border rounded-xl shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-border bg-stone-50/50">
            <h2 className="text-lg font-semibold text-foreground">交易明細</h2>
          </div>
          
          <div className="divide-y divide-border">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">目前沒有任何交易紀錄</div>
            ) : (
              transactions.map(tx => {
                const isPositive = Number(tx.amount) > 0;
                return (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isPositive ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{getTxName(tx.type)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-medium text-lg ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                        {isPositive ? '+' : ''}{Number(tx.amount).toLocaleString()}
                      </p>
                      <div className="mt-1 flex justify-end">
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {isTopUpOpen && (
        <TopUpModal 
          onClose={() => setIsTopUpOpen(false)} 
          onSuccess={() => {
            setIsTopUpOpen(false);
            fetchWallet();
          }}
        />
      )}
    </div>
  );
}
