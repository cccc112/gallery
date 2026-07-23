'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ChevronLeft, Wallet } from 'lucide-react';

export default function AdminTopupsPage() {
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopups = async () => {
    try {
      const res = await fetch('/api/admin/topups');
      const data = await res.json();
      if (data.success) {
        setTopups(data.topups || []);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopups();
  }, []);

  if (loading) return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 mb-2 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              返回管理後台
            </Link>
            <h1 className="text-3xl font-serif font-semibold text-stone-900">儲值紀錄 (自動化 Web3)</h1>
            <p className="text-sm text-stone-500 mt-1">目前網站採用純 Web3 儲值，所有交易皆由智能合約自動核發，管理員無需手動對帳。</p>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <div className="bg-white/60 border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-stone-100">
                {topups.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">目前沒有歷史紀錄</div>
                ) : (
                  topups.map(t => (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">
                            {t.users?.display_name || t.users?.email}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            時間: {new Date(t.created_at).toLocaleString()}
                          </p>
                          {t.metadata?.txHash && (
                            <div className="mt-2 text-[10px] text-stone-400 font-mono">
                              Tx: <a href={`https://etherscan.io/tx/${t.metadata.txHash}`} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">{t.metadata.txHash}</a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-stone-500 uppercase tracking-wide">儲值金額</p>
                          <p className="font-mono text-xl font-medium text-stone-900">{Number(t.amount).toLocaleString()} <span className="text-sm">Pts</span></p>
                        </div>
                        
                        <div className="border-l border-stone-200 pl-6 flex items-center justify-center">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {t.status === 'completed' ? '自動核發完畢' : t.status === 'pending' ? '舊版待處理' : '已拒絕'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
