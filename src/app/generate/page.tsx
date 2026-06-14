'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Wand2, Download, Loader2, Sparkles, RefreshCw, ImageIcon, AlertCircle } from 'lucide-react';

const STYLE_PRESETS = [
  { label: '水彩', en: 'watercolor painting, soft washes of color, delicate brushstrokes' },
  { label: '油畫', en: 'oil painting, rich textures, impasto technique, classical style' },
  { label: '數位插畫', en: 'digital illustration, clean lines, vibrant colors, modern art' },
  { label: '素描', en: 'pencil sketch, fine line drawing, detailed shading, monochrome' },
  { label: '抽象', en: 'abstract art, bold geometric shapes, expressive brushwork' },
  { label: '日式版畫', en: 'Japanese woodblock print style, ukiyo-e, flat colors, decorative' },
];

const ASPECT_OPTIONS = [
  { label: '1:1 方形', w: 1024, h: 1024 },
  { label: '4:3 橫式', w: 1024, h: 768 },
  { label: '3:4 直式', w: 768, h: 1024 },
  { label: '16:9 寬幅', w: 1280, h: 720 },
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [aspect, setAspect] = useState(ASPECT_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ b64: string; prompt: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const finalPrompt = [prompt, selectedStyle].filter(Boolean).join(', ') +
    ', high quality, detailed artwork, gallery quality';

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('請輸入作品描述');
      textareaRef.current?.focus();
      return;
    }
    setLoading(true);
    setError('');
    setImageB64(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          width: aspect.w,
          height: aspect.h,
          steps: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失敗');

      setImageB64(data.image);
      setHistory(prev => [{ b64: data.image, prompt: finalPrompt }, ...prev].slice(0, 6));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!imageB64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageB64}`;
    link.download = `atelier-blanc-ai-${Date.now()}.png`;
    link.click();
  }

  const imgSrc = imageB64 ? `data:image/png;base64,${imageB64}` : null;

  return (
    <div className="marble-bg min-h-screen py-10 px-4 md:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-50/60 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-50/50 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
            ← 返回後台
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-10 w-10 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">AI 藝術生成工作室</h1>
              <p className="text-xs text-muted-foreground mt-0.5">由 NVIDIA FLUX.1 驅動 · 輸入描述，秒出精緻畫作</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* Left: Controls */}
          <div className="space-y-5">
            {/* Prompt */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                作品描述
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="例：台灣阿里山日出，雲海翻騰，晨光金黃，山巒層疊…"
                rows={4}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-2">描述越詳細效果越好，可用中英文混寫</p>
            </div>

            {/* Style Presets */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">畫風選擇</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_PRESETS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedStyle(prev => prev === s.en ? '' : s.en)}
                    className={`px-3 py-2 rounded-sm text-xs font-medium border transition-all ${
                      selectedStyle === s.en
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-white/60 text-foreground border-border hover:border-primary/50 hover:bg-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">畫面比例</p>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_OPTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => setAspect(a)}
                    className={`px-3 py-2 rounded-sm text-xs font-medium border transition-all ${
                      aspect.label === a.label
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-white/60 text-foreground border-border hover:border-primary/50 hover:bg-white'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 生成中，請稍候…</>
              ) : (
                <><Wand2 className="h-4 w-4" /> 開始生成畫作</>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div className="space-y-5">
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">生成結果</p>
                {imgSrc && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-sm border border-border hover:bg-white/80 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3" /> 重新生成
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-3 w-3" /> 下載原圖
                    </button>
                  </div>
                )}
              </div>

              {/* Canvas */}
              <div
                className="relative rounded-sm overflow-hidden bg-stone-100 border border-border/40 flex items-center justify-center"
                style={{ aspectRatio: `${aspect.w}/${aspect.h}`, minHeight: '280px' }}
                onContextMenu={e => e.preventDefault()}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="relative h-16 w-16">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-200 animate-ping opacity-60" />
                      <div className="absolute inset-2 rounded-full border-2 border-indigo-400 animate-spin border-t-transparent" />
                      <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-indigo-500" />
                    </div>
                    <p className="text-xs tracking-wide">AI 正在創作中…</p>
                    <p className="text-[10px] text-muted-foreground/60">約需 10–30 秒</p>
                  </div>
                ) : imgSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt="AI 生成畫作"
                      className="w-full h-full object-contain pointer-events-none select-none"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                    />
                    {/* 輕微浮水印（下載版無浮水印，這是預覽層） */}
                    <div
                      className="absolute inset-0 pointer-events-none select-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(-45deg, transparent 0px, transparent 80px, rgba(100,80,40,0.04) 80px, rgba(100,80,40,0.04) 81px)`,
                      }}
                    >
                      <div className="absolute bottom-3 right-4">
                        <span className="text-[10px] text-white/40 font-light tracking-widest select-none">
                          Atelier Blanc AI Studio
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
                    <ImageIcon className="h-12 w-12" />
                    <p className="text-xs tracking-wide">生成的畫作將顯示於此</p>
                  </div>
                )}
              </div>

              {imgSrc && (
                <p className="mt-3 text-[10px] text-muted-foreground/60 line-clamp-2">
                  <span className="font-medium">Prompt：</span>{finalPrompt}
                </p>
              )}
            </div>

            {/* History */}
            {history.length > 1 && (
              <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">本次紀錄</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setImageB64(h.b64)}
                      className="relative h-20 w-20 flex-shrink-0 rounded-sm overflow-hidden border border-border/50 hover:border-primary/50 hover:opacity-100 opacity-70 transition-all"
                      title={h.prompt}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${h.b64}`}
                        alt={`歷史 ${i + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
