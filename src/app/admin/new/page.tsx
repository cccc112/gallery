'use client';

import { useState } from 'react';
import { createArtwork } from './actions';
import Link from 'next/link';
import { ArrowLeft, Upload, Sparkles, Box, Lock } from 'lucide-react';

export default function NewArtworkPage() {
  const [artType, setArtType] = useState<'physical' | 'digital'>('physical');
  const [isRentable, setIsRentable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    formData.append('isRentable', isRentable ? 'true' : 'false');
    
    try {
      await createArtwork(formData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '發生錯誤，請重試');
      setLoading(false);
    }
  };

  return (
    <div className="marble-bg min-h-screen">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-10">
        {/* Back Button */}
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回控制台
        </Link>

        <div className="bg-card rounded-xl p-8 md:p-10 border border-border/85 shadow-sm">
          <div className="flex items-center gap-2 mb-8 border-b border-border/40 pb-4">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-serif font-semibold text-foreground">上架新藝術作品</h1>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 mb-6">
              上架失敗: {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            {/* Title */}
            <div>
              <label className="block text-foreground font-semibold mb-2">作品名稱 *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="例如：流動的意念"
                className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-foreground font-semibold mb-2">作品敘述</label>
              <textarea
                name="description"
                rows={4}
                placeholder="寫下您創作此畫作的靈感背景、技法或特別的故事..."
                className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Grid: Type & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Art Type */}
              <div>
                <label className="block text-foreground font-semibold mb-2">藝術品類型 *</label>
                <select
                  name="artType"
                  value={artType}
                  onChange={(e) => setArtType(e.target.value as 'physical' | 'digital')}
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="physical">實體畫作/雕塑 (Physical)</option>
                  <option value="digital">數位授權藝術 (Digital)</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-foreground font-semibold mb-2">買斷收藏價 (TWD)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  placeholder="例如：58000 (留空則不對外販售)"
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Preview Image URL */}
            <div>
              <label className="block text-foreground font-semibold mb-2">公開預覽圖 URL *</label>
              <input
                type="url"
                name="previewFileUrl"
                placeholder="例如：https://images.unsplash.com/..."
                defaultValue="https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=600"
                required
                className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Physical Specific Fields */}
            {artType === 'physical' && (
              <div className="bg-secondary/40 p-5 rounded-xl border border-border/60 space-y-4">
                <h3 className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="h-4 w-4" />
                  實體藝術品專屬屬性
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">寬度 (cm) *</label>
                    <input
                      type="number"
                      name="width"
                      step="0.01"
                      required={artType === 'physical'}
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">高度 (cm) *</label>
                    <input
                      type="number"
                      name="height"
                      step="0.01"
                      required={artType === 'physical'}
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">深度 (cm)</label>
                    <input
                      type="number"
                      name="depth"
                      step="0.01"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">重量 (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      step="0.01"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">初始庫存件數 *</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue="1"
                    required={artType === 'physical'}
                    className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Digital Specific Fields */}
            {artType === 'digital' && (
              <div className="bg-secondary/40 p-5 rounded-xl border border-border/60 space-y-4">
                <h3 className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  數位作品版權下載連結
                </h3>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">私有高解析度檔案原始 URL *</label>
                  <input
                    type="url"
                    name="highResFileUrl"
                    placeholder="https://example.com/private/..."
                    defaultValue="https://example.com/private/custom-art-highres.png"
                    required={artType === 'digital'}
                    className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Rental Toggle */}
            <div className="bg-secondary/40 p-5 rounded-xl border border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">啟用短期月租方案</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">允許客戶以按月付租金與預授權押金形式租用此作品</p>
                </div>
                <input
                  type="checkbox"
                  checked={isRentable}
                  onChange={(e) => setIsRentable(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {isRentable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/65">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">每月租金 (TWD) *</label>
                    <input
                      type="number"
                      name="monthlyRentPrice"
                      required={isRentable}
                      placeholder="例如：1200"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">押金額度 (TWD) *</label>
                    <input
                      type="number"
                      name="depositAmount"
                      required={isRentable}
                      placeholder="例如：5000 (Stripe 授權凍結不請款)"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
              <Link
                href="/admin"
                className="rounded-lg border border-border hover:bg-secondary/50 bg-background px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary hover:bg-primary/95 disabled:bg-stone-300 disabled:text-stone-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-all flex items-center gap-1.5"
              >
                <Upload className="h-4 w-4" />
                {loading ? '上架中...' : '確認上架'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
