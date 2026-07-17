'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SeriesPage() {
  const router = useRouter();
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/series');
      const data = await res.json();
      if (res.ok) {
        setSeries(data.series || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('請輸入主題名稱');
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/series/${editingId}` : '/api/series';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      
      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setTitle('');
        setDescription('');
        fetchSeries();
      } else {
        const data = await res.json();
        alert(data.error || '儲存失敗');
      }
    } catch (e) {
      alert('儲存失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此主題嗎？作品將不會被刪除，但會解除與此主題的綁定。')) return;
    
    try {
      const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSeries();
      } else {
        const data = await res.json();
        alert(data.error || '刪除失敗');
      }
    } catch (e) {
      alert('刪除失敗');
    }
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setTitle(s.title);
    setDescription(s.description || '');
    setIsAdding(true);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-foreground">作品主題 / 系列管理</h1>
            <p className="text-sm text-muted-foreground mt-1">您可以在此建立專屬的作品主題，將作品分門別類，方便買家欣賞。</p>
          </div>
          <Link href="/profile" className="text-sm font-medium hover:underline text-muted-foreground">返回個人主頁</Link>
        </div>

        {!isAdding ? (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setTitle(''); setDescription(''); }}
            className="mb-8 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            建立新主題
          </button>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{editingId ? '編輯主題' : '建立新主題'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">主題名稱 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：2024 盛夏星空系列"
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">主題介紹</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="描述這個主題的創作理念..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium">
                  <Check className="h-4 w-4" /> {editingId ? '儲存變更' : '確認建立'}
                </button>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-4 py-2 text-sm font-medium">
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {series.length === 0 && !isAdding && (
            <div className="text-center py-16 bg-white/50 border border-border rounded-lg">
              <p className="text-muted-foreground">您尚未建立任何主題。</p>
            </div>
          )}
          
          {series.map(s => (
            <div key={s.id} className="bg-white/80 border border-border rounded-lg p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-primary/30 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-serif font-semibold text-foreground">{s.title}</h3>
                  <span className="text-xs font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                    {s.artwork_count} 件作品
                  </span>
                </div>
                {s.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button onClick={() => startEdit(s)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md border border-border transition-colors">
                  <Edit2 className="h-3.5 w-3.5" /> 編輯
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-md border border-transparent hover:border-rose-200 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> 刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
