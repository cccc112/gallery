'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ApplyArtistPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    real_name: '',
    id_number: '',
    bank_account: '',
    portfolio_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.real_name || !form.id_number || !form.bank_account) {
      setErrorMsg('請填寫所有必填欄位');
      return;
    }
    
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/artist-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '申請送出失敗');
      
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-border text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">申請已送出</h1>
          <p className="text-muted-foreground mb-8">
            感謝您申請成為平台藝術家！我們的審核團隊將在 1-3 個工作天內完成實名審核與銀行帳戶驗證。審核通過後，您即可開始上架您的藝術作品。
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
    <div className="max-w-2xl mx-auto p-6 md:p-10 min-h-screen">
      <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回會員中心
      </Link>
      
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2">申請成為藝術家 (KYC 實名認證)</h1>
      <p className="text-muted-foreground mb-8">
        為了保障買賣雙方權益，並符合反洗錢法規，請提供您的真實身份與收款帳戶資訊。
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            真實姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="請輸入與身分證 / 銀行帳戶一致的姓名"
            value={form.real_name}
            onChange={e => setForm({ ...form, real_name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            身分證字號 / 統一編號 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="A123456789"
            value={form.id_number}
            onChange={e => setForm({ ...form, id_number: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            收款銀行帳號 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="銀行代碼 - 帳號 (例如: 808-1234567890)"
            value={form.bank_account}
            onChange={e => setForm({ ...form, bank_account: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">此帳號將用於平台撥款，戶名必須與上方真實姓名相符。</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            作品集連結 (選填)
          </label>
          <input
            type="url"
            className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="https://instagram.com/your_art"
            value={form.portfolio_url}
            onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-foreground text-background py-3 rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex justify-center items-center font-medium"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交審核中...
            </>
          ) : (
            '送出申請'
          )}
        </button>
      </form>
    </div>
  );
}
