'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, ImageIcon, X, Loader2, CheckCircle, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ArtType = 'physical' | 'digital' | 'photography';

export default function EditArtworkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [artType, setArtType] = useState<ArtType>('physical');
  const [isRentable, setIsRentable] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Controlled fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [monthlyRentPrice, setMonthlyRentPrice] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [originalGuaranteed, setOriginalGuaranteed] = useState(false);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [selectedSeries, setSelectedSeries] = useState('');

  useEffect(() => {
    async function fetchArtwork() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        setErrorMsg('無法載入作品資料');
        setIsLoading(false);
        return;
      }

      if (data.artist_id !== user.id) {
        router.push('/dashboard');
        return;
      }

      setTitle(data.title || '');
      setDescription(data.description || '');
      setArtType(data.art_type as ArtType);
      setIsRentable(data.is_rentable || false);
      setImagePreview(data.preview_file_url);
      setPrice(data.price ? String(data.price) : '');
      setMonthlyRentPrice(data.monthly_rent_price ? String(data.monthly_rent_price) : '');
      setDepositAmount(data.deposit_amount ? String(data.deposit_amount) : '');
      setStock(data.stock ? String(data.stock) : '');
      setTags(data.tags || []);
      setIsAIGenerated(data.is_ai_generated || false);
      setOriginalGuaranteed(data.original_guaranteed || false);
      setSelectedSeries(data.series_id || '');
      
      try {
        const res = await fetch('/api/series');
        const d = await res.json();
        if (res.ok) setSeriesList(d.series || []);
      } catch (e) {}
      
      setIsLoading(false);
    }
    fetchArtwork();
  }, [params.id, router]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (!val) return;
      if (tags.length >= 5) {
        setErrorMsg('最多只能新增 5 個標籤');
        return;
      }
      if (!tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
      setErrorMsg('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.set('title', title);
    formData.set('description', description);
    formData.set('is_rentable', isRentable.toString());
    formData.set('tags', JSON.stringify(tags));
    formData.set('is_ai_generated', isAIGenerated.toString());
    formData.set('original_guaranteed', originalGuaranteed.toString());
    if (selectedSeries) formData.set('series_id', selectedSeries);
    
    if (price) formData.set('price', price);
    if (monthlyRentPrice) formData.set('monthly_rent_price', monthlyRentPrice);
    if (depositAmount) formData.set('deposit_amount', depositAmount);
    if (stock) formData.set('stock', stock);

    try {
      const res = await fetch(`/api/artworks/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '更新失敗');
      }

      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || '更新失敗，請稍後再試');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center marble-bg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <div className="mb-10">
          <Link href="/dashboard" className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← 返回儀表板
          </Link>
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            編輯作品
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">更新您的作品資訊與定價。</p>
        </div>

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="font-serif text-2xl font-semibold text-foreground">作品更新成功！</h2>
            <p className="text-sm text-muted-foreground mt-2">正在跳轉至儀表板...</p>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-10">
              {errorMsg && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Image Preview (Readonly in edit mode for now) */}
              <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                  作品圖片
                </label>
                <div className="relative aspect-[4/3] w-full rounded-sm border-2 border-border overflow-hidden">
                  {imagePreview && (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-contain bg-stone-50" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">註：編輯模式暫不開放更換圖片。如需更換，請刪除作品後重新上傳。</p>
              </div>

              {/* Basic Info */}
              <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">基本資訊</h2>

                <div>
                  <label htmlFor="title" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                    作品名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：《山海之間》系列 No.3"
                    className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                    作品介紹
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述這件作品的創作理念、媒材、靈感來源..."
                    className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                    自訂標籤 <span className="font-normal text-[10px] text-muted-foreground/60">(最多 5 個，輸入後按 Enter)</span>
                  </label>
                  <div className="w-full rounded-sm border border-border bg-white/80 p-2 flex flex-wrap gap-2 items-center focus-within:border-primary transition-colors">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-secondary text-foreground text-xs px-2.5 py-1 rounded-sm border border-border">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length < 5 ? "例如：油畫、風景..." : "已達標籤上限"}
                      disabled={tags.length >= 5}
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/50 min-w-[120px]"
                    />
                  </div>
                </div>
                
                {/* Series Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="series" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                      作品主題 / 系列
                    </label>
                    <Link href="/profile/series" target="_blank" className="text-xs text-primary hover:underline font-medium">
                      + 建立新主題
                    </Link>
                  </div>
                  <select
                    id="series"
                    name="series_id"
                    value={selectedSeries}
                    onChange={(e) => setSelectedSeries(e.target.value)}
                    className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                  >
                    <option value="">(不加入任何系列)</option>
                    {seriesList.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                
                {/* AI Generated Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name="is_ai_generated" 
                        value="true"
                        checked={isAIGenerated}
                        onChange={(e) => {
                          setIsAIGenerated(e.target.checked);
                          if (e.target.checked) setOriginalGuaranteed(false);
                        }}
                        className="peer sr-only" 
                      />
                      <div className="h-5 w-5 rounded-sm border border-border bg-white transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground group-hover:text-purple-700 transition-colors">
                      這是 AI 生成作品
                    </div>
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1.5 ml-8">勾選後，作品頁面將會顯示「🤖 AI 生成藝術」標籤。</p>
                </div>
                
                {/* Original Guarantee Checkbox (only if not AI) */}
                {!isAIGenerated && (
                  <div className="flex items-start gap-3 p-4 border border-foreground/20 rounded-sm bg-foreground/5 mt-4">
                    <input
                      type="checkbox"
                      id="original_guaranteed"
                      name="original_guaranteed"
                      checked={originalGuaranteed}
                      onChange={e => setOriginalGuaranteed(e.target.checked)}
                      required
                      className="mt-0.5 h-4 w-4 rounded-sm border-foreground/30 text-foreground accent-foreground"
                    />
                    <div className="flex-1">
                      <label htmlFor="original_guaranteed" className="text-sm font-medium text-foreground cursor-pointer flex items-center flex-wrap gap-1">
                        我保證此為本人原創作品，並同意
                        <Link href="/terms/original-guarantee" target="_blank" className="underline underline-offset-4 hover:text-rose-600 transition-colors">
                          原創者責任條款
                        </Link>
                        <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-1">原創作品必須同意此條款方可發布。</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">定價</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="price" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                      買斷售價 (TWD)
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="例：50000"
                      className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">留空表示不出售</p>
                  </div>

                  {artType === 'physical' && (
                    <div>
                      <label htmlFor="stock" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        庫存數量
                      </label>
                      <input
                        id="stock"
                        name="stock"
                        type="number"
                        min="1"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="1"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                </div>

                {artType === 'physical' && (
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          name="is_rentable"
                          checked={isRentable}
                          onChange={(e) => setIsRentable(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-5 w-5 rounded-sm border border-border bg-white transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        開放藝術品租賃 (短期展出、拍攝道具等)
                      </div>
                    </label>
                  </div>
                )}

                {artType === 'physical' && isRentable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-border/50">
                    <div>
                      <label htmlFor="monthly_rent_price" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        月租費 (TWD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="monthly_rent_price"
                        name="monthly_rent_price"
                        type="number"
                        min="0"
                        required={isRentable}
                        value={monthlyRentPrice}
                        onChange={(e) => setMonthlyRentPrice(e.target.value)}
                        placeholder="例：2000"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="deposit_amount" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        押金 (TWD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="deposit_amount"
                        name="deposit_amount"
                        type="number"
                        min="0"
                        required={isRentable}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="例：10000"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={status === 'uploading'}
                  className="flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {status === 'uploading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      更新作品 <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
          </form>
        )}
      </div>
    </div>
  );
}
