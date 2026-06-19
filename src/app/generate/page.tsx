'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Wand2, Download, Loader2, Sparkles, RefreshCw,
  ImageIcon, AlertCircle, ChevronDown, Shuffle, Lock,
  SlidersHorizontal,
} from 'lucide-react';

const STYLE_PRESETS = [
  { label: '水彩', en: 'watercolor painting, soft washes of color, delicate brushstrokes' },
  { label: '油畫', en: 'oil painting, rich textures, impasto technique, classical style' },
  { label: '數位插畫', en: 'digital illustration, clean lines, vibrant colors, modern art' },
  { label: '素描', en: 'pencil sketch, fine line drawing, detailed shading, monochrome' },
  { label: '抽象', en: 'abstract art, bold geometric shapes, expressive brushwork' },
  { label: '日式版畫', en: 'Japanese woodblock print style, ukiyo-e, flat colors, decorative' },
  { label: '賽博龐克', en: 'cyberpunk style, neon lights, dark atmosphere, futuristic city' },
  { label: '古典油畫', en: 'old master oil painting, chiaroscuro, Renaissance style, dramatic lighting' },
  { label: '印象派', en: 'impressionist painting, loose brushwork, natural light, Monet style' },
];

const ASPECT_OPTIONS = [
  { label: '1:1', sublabel: '方形', w: 1024, h: 1024 },
  { label: '4:3', sublabel: '橫式', w: 1024, h: 768 },
  { label: '3:4', sublabel: '直式', w: 768, h: 1024 },
  { label: '16:9', sublabel: '寬幅', w: 1280, h: 720 },
  { label: '9:16', sublabel: '直幅', w: 720, h: 1280 },
];

const QUALITY_PRESETS = [
  { label: '草稿', steps: 1, desc: '最快，約 5 秒' },
  { label: '標準', steps: 2, desc: '均衡，約 10 秒' },
  { label: '精緻', steps: 3, desc: '較好，約 18 秒' },
  { label: '最高', steps: 4, desc: '最佳，約 30 秒' },
];

function randomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

function Slider({
  label, value, min, max, step = 1, onChange, unit = '',
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-border cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">{min}{unit}</span>
        <span className="text-[9px] text-muted-foreground">{max}{unit}</span>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [aspect, setAspect] = useState(ASPECT_OPTIONS[0]);
  const [steps, setSteps] = useState(2);
  const [seed, setSeed] = useState<number>(randomSeed());
  const [fixedSeed, setFixedSeed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ b64: string; prompt: string; seed: number }[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastSeed, setLastSeed] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const basePrompt = [prompt.trim(), selectedStyle].filter(Boolean).join(', ');
  const finalPrompt = basePrompt + ', high quality, detailed artwork, gallery quality';

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('請輸入作品描述');
      textareaRef.current?.focus();
      return;
    }
    setLoading(true);
    setError('');
    setImageB64(null);

    const useSeed = fixedSeed ? seed : randomSeed();
    if (!fixedSeed) setSeed(useSeed);
    setLastSeed(useSeed);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          negative_prompt: negativePrompt.trim() || undefined,
          width: aspect.w,
          height: aspect.h,
          steps,
          seed: useSeed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失敗');

      setImageB64(data.image);
      setHistory(prev => [{ b64: data.image, prompt: finalPrompt, seed: useSeed }, ...prev].slice(0, 8));
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
          {/* ── 左：控制面板 ── */}
          <div className="space-y-4">

            {/* Prompt */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                作品描述 <span className="text-rose-400">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="例：台灣阿里山日出，雲海翻騰，晨光金黃，山巒層疊…"
                rows={3}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-2">描述越詳細效果越好，中英文皆可</p>
            </div>

            {/* 畫風 */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">畫風</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_PRESETS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedStyle(prev => prev === s.en ? '' : s.en)}
                    className={`px-2 py-2 rounded-sm text-xs font-medium border transition-all ${
                      selectedStyle === s.en
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white/60 text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 比例 */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">畫面比例</p>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_OPTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => setAspect(a)}
                    className={`flex flex-col items-center py-2 px-1 rounded-sm text-xs border transition-all ${
                      aspect.label === a.label
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white/60 text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span className="font-mono font-semibold text-[11px]">{a.label}</span>
                    <span className="text-[9px] opacity-70 mt-0.5">{a.sublabel}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{aspect.w} × {aspect.h} px</p>
            </div>

            {/* 品質 (Steps) */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">生成品質</p>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  Steps: {steps}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {QUALITY_PRESETS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => setSteps(q.steps)}
                    className={`flex flex-col items-center py-2 px-1 rounded-sm text-xs border transition-all ${
                      steps === q.steps
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white/60 text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span className="font-semibold text-[11px]">{q.label}</span>
                    <span className="text-[9px] opacity-70 mt-0.5 text-center leading-tight">{q.desc}</span>
                  </button>
                ))}
              </div>
              {/* 細調 slider */}
              <Slider
                label="細調步數"
                value={steps}
                min={1}
                max={4}
                onChange={setSteps}
              />
            </div>

            {/* 進階設定（可折疊） */}
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-5 text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  進階設定
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 space-y-5 border-t border-border/40 pt-4">
                  {/* Seed */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-foreground">隨機種子 (Seed)</p>
                      <button
                        onClick={() => setFixedSeed(!fixedSeed)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium border transition-all ${
                          fixedSeed
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-stone-50 text-muted-foreground border-border'
                        }`}
                      >
                        {fixedSeed ? <Lock className="h-3 w-3" /> : <Shuffle className="h-3 w-3" />}
                        {fixedSeed ? '已鎖定' : '隨機'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={seed}
                        onChange={e => { setSeed(Number(e.target.value)); setFixedSeed(true); }}
                        className="flex-1 px-3 py-2 text-xs font-mono rounded-sm border border-border bg-white/80 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
                        min={0}
                        max={2147483647}
                      />
                      <button
                        onClick={() => { setSeed(randomSeed()); setFixedSeed(false); }}
                        className="px-3 py-2 text-xs rounded-sm border border-border bg-white/60 hover:bg-stone-50 transition-colors"
                        title="重新隨機"
                      >
                        <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1.5">
                      相同 Seed + 相同 Prompt → 可重現相同畫面。鎖定 Seed 可做細微調整的對比測試。
                    </p>
                  </div>

                  {/* Negative Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      負面提示（排除元素）
                    </label>
                    <textarea
                      value={negativePrompt}
                      onChange={e => setNegativePrompt(e.target.value)}
                      placeholder="例：blurry, watermark, ugly, text, signature…"
                      rows={2}
                      className="w-full rounded-sm border border-border bg-white/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-400 transition-colors resize-none font-mono"
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">填入不希望出現的元素（英文效果較佳）</p>
                  </div>

                  {/* 解析度顯示 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-sm border border-border/50">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">寬度</p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{aspect.w} px</p>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-sm border border-border/50">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">高度</p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{aspect.h} px</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 生成按鈕 */}
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

          {/* ── 右：結果 ── */}
          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">生成結果</p>
                {imgSrc && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-sm border border-border hover:bg-white/80 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
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
                    <p className="text-[10px] text-muted-foreground/60">Steps {steps} · 約需 {steps * 8}–{steps * 10} 秒</p>
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
                    <div className="absolute inset-0 pointer-events-none select-none flex items-end justify-between p-3">
                      <span className="text-[9px] text-white/30 tracking-widest">Seed: {lastSeed}</span>
                      <span className="text-[9px] text-white/30 font-light tracking-widest">Atelier Blanc AI</span>
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
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground/60 line-clamp-2">
                    <span className="font-medium text-muted-foreground">Prompt：</span>{basePrompt}
                  </p>
                  <div className="flex gap-3 text-[9px] text-muted-foreground/50 font-mono">
                    <span>Seed: {lastSeed}</span>
                    <span>·</span>
                    <span>Steps: {steps}</span>
                    <span>·</span>
                    <span>{aspect.w}×{aspect.h}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 歷史記錄 */}
            {history.length > 1 && (
              <div className="bg-white/70 backdrop-blur-md border border-border/60 rounded-sm shadow-sm p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                  本次記錄（{history.length}）
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setImageB64(h.b64)}
                      className="relative h-20 w-20 flex-shrink-0 rounded-sm overflow-hidden border border-border/50 hover:border-indigo-400 opacity-70 hover:opacity-100 transition-all group"
                      title={`Seed: ${h.seed}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${h.b64}`}
                        alt={`歷史 ${i + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[8px] text-white/80 font-mono text-center truncate">
                          {h.seed}
                        </p>
                      </div>
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
