import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

function widthHeightToAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (ratio >= 1.7) return '16:9';
  if (ratio >= 1.2) return '4:3';
  if (ratio >= 0.9) return '1:1';
  if (ratio >= 0.7) return '3:4';
  return '9:16';
}

// ── 將遠端圖片 URL 下載並轉成 base64 ─────────────────────────────
async function urlToBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`下載圖片失敗: ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Pollinations.ai (免費、無需 API Key、使用 FLUX.1) ─────────────
async function generateViaPollinations(params: {
  prompt: string;
  width: number;
  height: number;
  seed: number;
}): Promise<string> {
  const { prompt, width, height, seed } = params;
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&enhance=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AtelierBlanc/1.0' },
    });
    if (!res.ok) throw new Error(`Pollinations API 錯誤 ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength < 1000) throw new Error('回傳圖片過小，可能生成失敗');
    const bytes = new Uint8Array(arrayBuf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Replicate (NVIDIA FLUX.1 schnell，需 API Token) ───────────────
async function generateViaReplicate(params: {
  prompt: string;
  width: number;
  height: number;
  steps: number;
  seed: number;
  apiToken: string;
}): Promise<string> {
  const { prompt, width, height, steps, seed, apiToken } = params;
  const aspectRatio = widthHeightToAspectRatio(width, height);

  const createRes = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          seed,
          aspect_ratio: aspectRatio,
          num_inference_steps: Math.min(Math.max(steps, 1), 4),
          output_format: 'png',
          output_quality: 90,
          disable_safety_checker: false,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate API 錯誤 ${createRes.status}: ${err.slice(0, 200)}`);
  }

  let prediction = await createRes.json();

  let attempts = 0;
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 25) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    prediction = await pollRes.json();
    attempts++;
  }

  if (prediction.status === 'failed') {
    throw new Error(`生成失敗：${prediction.error || '未知錯誤'}`);
  }
  if (!prediction.output?.[0]) {
    throw new Error('未收到圖片輸出');
  }

  return urlToBase64(prediction.output[0]);
}

// ── 主 handler ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const {
    prompt, width = 1024, height = 1024, steps = 4, seed, customApiKey,
  } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: '請輸入描述文字' }, { status: 400 });

  const useSeed = (Number.isInteger(seed) && seed >= 0) ? seed : Math.floor(Math.random() * 2147483647);

  // 判斷使用哪個引擎
  let engine: 'replicate' | 'pollinations' = 'pollinations'; // 預設免費引擎
  let replicateToken: string | undefined;

  if (customApiKey?.trim()) {
    const key = customApiKey.trim();
    if (!key.startsWith('hf_')) {
      // 視為 Replicate token
      replicateToken = key;
      engine = 'replicate';
    }
    // hf_ 開頭的自訂 key 已棄用，改用 Pollinations
  } else if (process.env.REPLICATE_API_TOKEN) {
    replicateToken = process.env.REPLICATE_API_TOKEN;
    engine = 'replicate';
  }
  // 否則 engine 維持 pollinations（免費）

  try {
    // 檢查每日額度（使用免費引擎時才限制）
    if (engine === 'pollinations') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count, error: countError } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', yesterday.toISOString());

      if (countError) throw countError;

      if (count !== null && count >= 5) {
        return NextResponse.json(
          { error: '今日免費 AI 生成額度已用盡 (5/5)，請明日再試，或輸入自訂 Replicate API Key 繼續使用。' },
          { status: 429 }
        );
      }
    }

    let base64: string;

    if (engine === 'replicate' && replicateToken) {
      base64 = await generateViaReplicate({
        prompt: prompt.trim(),
        width, height, steps,
        seed: useSeed,
        apiToken: replicateToken,
      });
    } else {
      // 免費引擎 Pollinations.ai (FLUX.1)
      base64 = await generateViaPollinations({
        prompt: prompt.trim(),
        width, height,
        seed: useSeed,
      });
    }

    // 寫入使用紀錄
    await supabase.from('ai_usage_logs').insert({ user_id: user.id });

    return NextResponse.json({ image: base64, engine });
  } catch (err: any) {
    const msg = err.name === 'AbortError'
      ? '生成逾時（網路或伺服器忙碌），請稍後再試'
      : err.message || '生成失敗，請稍後再試';
    console.error('[generate-image] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
