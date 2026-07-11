'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, ImageIcon, X, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

type ArtType = 'physical' | 'digital' | 'photography';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  const [artType, setArtType] = useState<ArtType>('physical');
  const [isRentable, setIsRentable] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      setUserRole(data?.role || 'buyer');
      setIsCheckingRole(false);
    }
    checkRole();
  }, [router]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('圖片不可超過 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('uploading');
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    // 附加圖片檔案
    if (imageFile) {
      formData.set('image', imageFile);
    }
    formData.set('is_rentable', isRentable.toString());
    formData.set('tags', JSON.stringify(tags));

    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '發布失敗');
      }

      setStatus('success');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || '發布失敗，請稍後再試');
    }
  };

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← 返回首頁
          </Link>
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            發布作品
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">分享您的創作，讓世界看見。</p>
        </div>

        {/* Success state */}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="font-serif text-2xl font-semibold text-foreground">作品發布成功！</h2>
            <p className="text-sm text-muted-foreground mt-2">正在跳轉至首頁...</p>
          </div>
        )}

        {status !== 'success' && (
          isCheckingRole ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userRole !== 'artist' ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-border text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">權限不足</h2>
              <p className="text-muted-foreground mb-6">
                只有經過認證的藝術家才能夠上傳作品。請先提交藝術家申請，審核通過後即可開始銷售。
              </p>
              <Link
                href="/apply-artist"
                className="inline-flex items-center justify-center bg-foreground text-background px-6 py-2.5 rounded hover:bg-foreground/90 transition-colors font-medium"
              >
                申請成為藝術家 <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* Error banner */}
              {errorMsg && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Image Upload */}
              <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                  作品圖片 <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-[4/3] w-full rounded-sm border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${
                    imagePreview ? 'border-border' : 'border-border/60 hover:border-primary/50 bg-stone-50/50'
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-contain bg-stone-50" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-background/90 border border-border shadow-sm hover:bg-background transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">點擊上傳圖片</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG、PNG、WebP，最大 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">基本資訊</h2>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                    作品名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="例：《山海之間》系列 No.3"
                    className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                    作品介紹
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="描述這件作品的創作理念、媒材、靈感來源..."
                    className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                {/* Tags */}
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
                {/* Art Type */}
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                    作品類型 <span className="text-rose-500">*</span>
                  </label>
                  <input type="hidden" name="art_type" value={artType} />
                  <div className="grid grid-cols-3 gap-3">
                    {(['physical', 'digital', 'photography'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setArtType(type)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-sm text-center transition-all ${
                          artType === type
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-white/60 hover:bg-white'
                        }`}
                      >
                        <span className="text-2xl">{type === 'physical' ? '🖼️' : type === 'digital' ? '💻' : '📷'}</span>
                        <span className="text-xs font-semibold text-foreground mt-1">
                          {type === 'physical' ? '實體作品' : type === 'digital' ? '數位作品' : '攝影'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">* 註：目前僅開放實體作品提供短期租賃服務。</p>
                </div>
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
                        defaultValue="1"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Rentable toggle - ONLY for physical artworks */}
                {artType === 'physical' && (
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isRentable}
                        onClick={() => setIsRentable(!isRentable)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isRentable ? 'bg-primary' : 'bg-border'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                          isRentable ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-foreground">開放短期租賃</p>
                        <p className="text-xs text-muted-foreground">讓買家按月租用，提高作品曝光率</p>
                      </div>
                    </label>
                  </div>
                )}

                {isRentable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/40">
                    <div>
                      <label htmlFor="monthly_rent_price" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        月租金 (TWD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="monthly_rent_price"
                        name="monthly_rent_price"
                        type="number"
                        min="0"
                        required={isRentable}
                        placeholder="例：3000"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="deposit_amount" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        押金額度 (TWD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="deposit_amount"
                        name="deposit_amount"
                        type="number"
                        min="0"
                        required={isRentable}
                        placeholder="例：10000"
                        className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Physical dimensions */}
              {artType === 'physical' && (
                <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
                  <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">實體作品規格</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                    { name: 'width', label: '寬 (cm)' },
                    { name: 'height', label: '高 (cm)' },
                    { name: 'depth', label: '深 (cm)' },
                    { name: 'weight', label: '重量 (kg)' },
                  ].map(({ name, label }) => (
                    <div key={name}>
                      <label htmlFor={name} className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                        {label}
                      </label>
                      <input
                        id={name}
                        name={name}
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="—"
                        className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'uploading'}
              className="w-full rounded-sm bg-primary text-primary-foreground py-4 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  發布中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  發布作品至藝廊
                </>
              )}
            </button>
          </form>
          )
        )}
      </div>
    </div>
  );
}
