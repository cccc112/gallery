'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle, Clock, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AiAdminAgent } from '@/components/AiAdminAgent';

type Application = {
  id: string;
  user_id: string;
  real_name: string;
  id_number: string;
  bank_account: string;
  portfolio_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Withdrawal = {
  id: string;
  artist_id: string;
  amount: number;
  bank_account: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'withdrawals' | 'ai-agent'>('applications');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    checkAdminAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAndFetchData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (userData?.role !== 'admin') {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsAdmin(true);

      // Fetch data
      fetchApplications();
      fetchWithdrawals();
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  }

  async function fetchApplications() {
    const res = await fetch('/api/admin/applications');
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications || []);
    }
  }

  async function fetchWithdrawals() {
    const res = await fetch('/api/admin/withdrawals');
    if (res.ok) {
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    }
  }

  async function updateApplication(id: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchApplications();
    }
  }

  async function updateWithdrawal(id: string, status: 'completed' | 'rejected') {
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchWithdrawals();
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-border text-center">
          <ShieldCheck className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">權限不足</h1>
          <p className="text-muted-foreground mb-8">
            此頁面僅限平台管理員存取。
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded hover:bg-primary/90 transition-colors"
          >
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-screen">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2">後台管理中心</h1>
      <p className="text-muted-foreground mb-8">管理藝術家審核與提領申請</p>

      {/* Tabs */}
      <div className="flex space-x-1 bg-secondary p-1 rounded-md mb-6 w-fit">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-all ${
            activeTab === 'applications' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          藝術家申請 ({applications.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-all ${
            activeTab === 'withdrawals' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          提領管理 ({withdrawals.filter(w => w.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('ai-agent')}
          className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-all ${
            activeTab === 'ai-agent' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
          ✨ AI 營運助理
        </button>
      </div>

      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">申請時間</th>
                  <th className="px-6 py-4 font-medium">藝術家名稱</th>
                  <th className="px-6 py-4 font-medium">撥款帳號 (PayPal/錢包)</th>
                  <th className="px-6 py-4 font-medium">作品集</th>
                  <th className="px-6 py-4 font-medium">狀態</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">目前沒有申請紀錄</td></tr>
                ) : applications.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{app.real_name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{app.bank_account}</td>
                    <td className="px-6 py-4">
                      {app.portfolio_url ? (
                        <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">連結</a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {app.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> 審核中</span>}
                      {app.status === 'approved' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> 已通過</span>}
                      {app.status === 'rejected' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> 已退件</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateApplication(app.id, 'approved')} className="text-emerald-600 hover:text-emerald-700 font-medium px-2">核准</button>
                          <button onClick={() => updateApplication(app.id, 'rejected')} className="text-rose-600 hover:text-rose-700 font-medium px-2">退件</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">申請時間</th>
                  <th className="px-6 py-4 font-medium">藝術家ID</th>
                  <th className="px-6 py-4 font-medium">提領金額</th>
                  <th className="px-6 py-4 font-medium">銀行帳戶</th>
                  <th className="px-6 py-4 font-medium">狀態</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">目前沒有提領紀錄</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{w.artist_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold text-foreground">NT$ {w.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">{w.bank_account}</td>
                    <td className="px-6 py-4">
                      {w.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> 處理中</span>}
                      {w.status === 'completed' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> 已匯款</span>}
                      {w.status === 'rejected' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> 已拒絕</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {w.status === 'pending' && (
                        <>
                          <button onClick={() => updateWithdrawal(w.id, 'completed')} className="text-emerald-600 hover:text-emerald-700 font-medium px-2">標記為已匯款</button>
                          <button onClick={() => updateWithdrawal(w.id, 'rejected')} className="text-rose-600 hover:text-rose-700 font-medium px-2">拒絕</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ai-agent' && (
        <div className="max-w-3xl mx-auto">
          <AiAdminAgent />
        </div>
      )}
    </div>
  );
}
