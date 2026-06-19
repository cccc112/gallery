'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Wand2, Loader2, Sparkles, Download, ArrowRight, ImageIcon } from 'lucide-react';

const QUICK_PROMPTS = [
  '台灣阿里山日出，雲海翻騰，晨光金黃',
  '水墨山水，潑墨大寫意，禪意意境',
  '野獸派油畫，鮮豔色彩，抽象人像',
  '浮世繪風格，富士山，春日櫻花',
];

export function HomeAISection() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate(customPrompt?: string) {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) {
      inputRef.current?.focus();
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
          prompt: finalPrompt + ', high quality artwork, gallery quality, masterpiece',
          width: 1024,
          height: 1024,
          steps: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('請先登入才能使用 AI 生圖功能');
        } else {
          throw new Error(data.error || '生成失敗');
        }
        return;
      }
      setImageB64(data.image);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!imageB64) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${imageB64}`;
    a.download = `atelier-blanc-ai-${Date.now()}.png`;
    a.click();
  }

  return (
    <section className="py-20 lg:py-28 border-t border-border/40 relative overflow-hidden">
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-indigo-50/70 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-50/60 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* 左：文字與操作 */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase text-indigo-600">
                AI 藝術生成 · NVIDIA FLUX.1
              </span>
            </div>

            <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight text-foreground text-balance leading-tight">
              用文字，<br />創作獨一無二的畫作
            </h2>
            <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed max-w-md">
              輸入任何描述，NVIDIA FLUX.1 模型將在數秒內為您生成精美畫作。
              可直接下載或上架至藝廊販售。
            </p>

            {/* 快速提示 */}
            <div className="mt-6 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setPrompt(q);
                    handleGenerate(q);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs rounded-full border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q.slice(0, 12)}…
                </button>
              ))}
            </div>

            {/* 輸入框 */}
            <div className="mt-6 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="描述你想要的畫面…"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-sm border border-border bg-white/80 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-60"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-3 rounded-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {loading ? '生成中' : '生成'}
              </button>
            </div>

            {error && (
              <div className="mt-3 text-xs text-rose-600">
                {error}
                {error.includes('登入') && (
                  <Link href="/login" className="ml-2 underline font-medium">
                    前往登入
                  </Link>
                )}
              </div>
            )}

            <Link
              href="/generate"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              進入完整 AI 工作室
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 右：結果預覽 */}
          <div className="relative">
            <div
              className="relative aspect-square rounded-sm overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 border border-border/40 shadow-xl shadow-black/5"
              onContextMenu={e => e.preventDefault()}
            >
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-100 animate-ping opacity-50" />
                    <div className="absolute inset-2 rounded-full border-2 border-indigo-300 animate-spin border-t-transparent" />
                    <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">AI 正在創作中…</p>
                    <p className="text-xs text-muted-foreground mt-1">約需 10–30 秒</p>
                  </div>
                </div>
              ) : imageB64 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${imageB64}`}
                    alt="AI 生成畫作"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                  />
                  {/* 浮水印 */}
                  <div className="absolute inset-0 pointer-events-none select-none flex items-end justify-end p-3">
                    <span className="text-[9px] text-white/30 font-light tracking-widest">
                      Atelier Blanc AI
                    </span>
                  </div>
                  {/* 下載按鈕 */}
                  <button
                    onClick={handleDownload}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                    title="下載圖片"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-indigo-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    在左側輸入描述，AI 將在此生成您的專屬畫作
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    由 NVIDIA FLUX.1-Schnell 提供支援
                  </p>
                </div>
              )}
            </div>

            {/* 裝飾角標 */}
            <div className="absolute -bottom-3 -right-3 h-24 w-24 rounded-sm bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/50 -z-10" />
            <div className="absolute -top-3 -left-3 h-16 w-16 rounded-sm bg-gradient-to-br from-amber-50 to-stone-100 border border-amber-200/50 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
