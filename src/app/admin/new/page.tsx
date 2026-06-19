'use client';

import { useState } from 'react';
import { createArtwork } from './actions';
import Link from 'next/link';
import { ArrowLeft, Upload, Sparkles, Box, Lock, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { ProtectedImage } from '@/components/protected-image';

type ArtType = 'physical' | 'digital' | 'photography';

const PRINT_MATERIALS = [
  '藝術微噴 (Giclée)',
  '無酸棉紙',
  '相紙 (RC Paper)',
  '鋁板 (Aluminum)',
  '壓克力背裱',
  '典藏絨面紙',
];

export default function NewArtworkPage() {
  const [artType, setArtType] = useState<ArtType>('physical');
  const [isRentable, setIsRentable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

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

  const isPhysical = artType === 'physical' || artType === 'photography';

  return (
    <div className="marble-bg min-h-screen">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-10">
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
                placeholder="寫下您創作此作品的靈感背景、技法或特別的故事..."
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
                  onChange={e => setArtType(e.target.value as ArtType)}
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="physical">實體畫作/雕塑 (Physical)</option>
                  <option value="digital">數位授權藝術 (Digital)</option>
                  <option value="photography">攝影作品 (Photography)</option>
                </select>
                {artType === 'photography' && (
                  <p className="text-[10px] text-amber-700 mt-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    攝影作品需填寫沖印尺寸、版數與材質
                  </p>
                )}
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
              <label className="block text-foreground font-semibold mb-2">公開預覽圖 URL (或貼上圖床連結) *</label>
              <input
                type="url"
                name="previewFileUrl"
                placeholder="https://..."
                required
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                className="block w-full rounded-lg border border-border bg-background py-2.5 px-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
              
              {/* 即時預覽區塊 */}
              {previewUrl && (
                <div className="mt-4 p-2 border border-border/80 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 px-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    圖片預覽
                  </p>
                  <div className="relative aspect-square sm:aspect-video w-full rounded-lg overflow-hidden bg-stone-100 shadow-inner">
                    <ProtectedImage
                      src={previewUrl}
                      alt="預覽圖片"
                      fill
                      className="object-contain"
                      showWatermark={false}
                      onError={() => {
                        // 載入失敗時不顯示破圖，可以選擇清空或顯示提示
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Physical 實體 ── */}
            {artType === 'physical' && (
              <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200/60 space-y-4">
                <h3 className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="h-4 w-4" />
                  實體藝術品專屬屬性
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: '寬度 (cm)', name: 'width' },
                    { label: '高度 (cm)', name: 'height' },
                    { label: '深度 (cm)', name: 'depth' },
                    { label: '重量 (kg)', name: 'weight' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs text-muted-foreground mb-1">
                        {f.label}{(f.name === 'width' || f.name === 'height') ? ' *' : ''}
                      </label>
                      <input
                        type="number"
                        name={f.name}
                        step="0.01"
                        required={f.name === 'width' || f.name === 'height'}
                        className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">初始庫存件數 *</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue="1"
                    required
                    className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* ── Digital 數位 ── */}
            {artType === 'digital' && (
              <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/60 space-y-4">
                <h3 className="text-xs text-blue-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  數位作品版權下載連結
                </h3>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">私有高解析度檔案原始 URL *</label>
                  <input
                    type="url"
                    name="highResFileUrl"
                    placeholder="https://your-storage.com/private/..."
                    required
                    className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* ── Photography 攝影 ── */}
            {artType === 'photography' && (
              <div className="bg-violet-50/60 p-5 rounded-xl border border-violet-200/60 space-y-5">
                <h3 className="text-xs text-violet-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-4 w-4" />
                  攝影作品專屬屬性
                </h3>

                {/* 沖印尺寸（共用物理欄位） */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3">沖印尺寸 *</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: '寬度 (cm)', name: 'width', req: true },
                      { label: '高度 (cm)', name: 'height', req: true },
                      { label: '重量 (kg)', name: 'weight', req: false },
                      { label: '庫存件數', name: 'stock', req: true, defaultValue: '1' },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs text-muted-foreground mb-1">
                          {f.label}{f.req ? ' *' : ''}
                        </label>
                        <input
                          type="number"
                          name={f.name}
                          step={f.name === 'weight' ? '0.01' : '1'}
                          required={f.req}
                          defaultValue={f.defaultValue}
                          className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 攝影專屬欄位 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-violet-200/50">
                  {/* edition_size */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      版數 (Edition Size)
                    </label>
                    <input
                      type="number"
                      name="edition_size"
                      min="1"
                      placeholder="例如：50（代表限量 50 張）"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">留空表示不限版數</p>
                  </div>

                  {/* print_material */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      沖印材質 (Print Material)
                    </label>
                    <select
                      name="print_material"
                      className="block w-full rounded border border-border bg-background py-1.5 px-3 text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">— 請選擇材質（選填）—</option>
                      {PRINT_MATERIALS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      可在作品詳情頁向買家展示沖印規格
                    </p>
                  </div>
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
                  onChange={e => setIsRentable(e.target.checked)}
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
                      placeholder="例如：5000"
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
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    上架中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    確認上架
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
