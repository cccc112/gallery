import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// ── 工具函式 ──────────────────────────────────────────────────────
function snapTo16(n: number): number {
  return Math.round(Math.min(Math.max(n, 256), 1440) / 16) * 16;
}

function widthHeightToAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (ratio >= 1.7) return '16:9';
  if (ratio >= 1.2) return '4:3';
  if (ratio >= 0.9) return '1:1';
  if (ratio >= 0.7) return '3:4';
  return '9:16';
}

// ── Replicate 實作 ────────────────────────────────────────────────
async function generateViaReplicate(params: {
  prompt: string;
  width: number;
  height: number;
  steps: number;
  seed: number;
  negative_prompt?: string;
  apiToken: string;
}): Promise<string> {
  const { prompt, width, height, steps, seed, apiToken } = params;
  const aspectRatio = widthHeightToAspectRatio(width, height);

  // 1. 建立 prediction
  const createRes = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Prefer: 'wait', // 讓 Replicate 同步等待（最長 60s）
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
  console.log('[Replicate] prediction status:', prediction.status, 'id:', prediction.id);

  // 2. 如果尚未完成（Prefer: wait 有時仍需輪詢）
  let attempts = 0;
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 25) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    prediction = await pollRes.json();
    console.log(`[Replicate] poll #${++attempts}: ${prediction.status}`);
  }

  if (prediction.status === 'failed') {
    throw new Error(`生成失敗：${prediction.error || '未知錯誤'}`);
  }

  if (!prediction.output?.[0]) {
    throw new Error('未收到圖片輸出');
  }

  // 3. 下載圖片 URL 並轉成 base64
  const imgRes = await fetch(prediction.output[0]);
  if (!imgRes.ok) throw new Error('無法下載生成結果');
  const arrayBuf = await imgRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString('base64');
  return base64;
}

// ── NVIDIA NIM 實作（fallback）───────────────────────────────────
async function generateViaNvidia(params: {
  prompt: string;
  width: number;
  height: number;
  steps: number;
  seed: number;
  negative_prompt?: string;
  apiKey: string;
}): Promise<string> {
  const { prompt, width, height, steps, seed, negative_prompt, apiKey } = params;

  const body: Record<string, unknown> = {
    prompt,
    width: snapTo16(width),
    height: snapTo16(height),
    steps: Math.min(Math.max(steps, 1), 4),
    seed,
  };
  if (negative_prompt?.trim()) body.negative_prompt = negative_prompt.trim();

  const res = await fetch(
    'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log('[NVIDIA] response keys:', Object.keys(data));

  const b64 =
    data?.artifacts?.[0]?.base64 ||
    data?.artifacts?.[0]?.b64_json ||
    data?.data?.[0]?.b64_json;

  if (!b64) {
    // async polling
    if (data?.id) {
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const pollRes = await fetch(
          `https://api.nvidia.com/v1/genai/status/${data.id}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        if (!pollRes.ok) break;
        const pd = await pollRes.json();
        const polledB64 = pd?.artifacts?.[0]?.base64 || pd?.artifacts?.[0]?.b64_json;
        if (polledB64) return polledB64;
        if (pd?.status === 'failed') throw new Error('NVIDIA 生成失敗');
      }
    }
    throw new Error(`未收到圖片（NVIDIA 回傳：${Object.keys(data).join(', ')}）`);
  }

  return b64;
}

// ── 主 handler ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { prompt, width = 1024, height = 1024, steps = 4, seed, negative_prompt } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: '請輸入描述文字' }, { status: 400 });

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  if (!replicateToken && !nvidiaKey) {
    return NextResponse.json({ error: '尚未設定 AI 生成 API Key' }, { status: 500 });
  }

  const useSeed = (Number.isInteger(seed) && seed >= 0) ? seed : Math.floor(Math.random() * 2147483647);

  try {
    let base64: string;

    if (replicateToken) {
      // 優先使用 Replicate（穩定）
      base64 = await generateViaReplicate({
        prompt: prompt.trim(),
        width, height, steps,
        seed: useSeed,
        negative_prompt,
        apiToken: replicateToken,
      });
    } else {
      // fallback NVIDIA
      base64 = await generateViaNvidia({
        prompt: prompt.trim(),
        width, height, steps,
        seed: useSeed,
        negative_prompt,
        apiKey: nvidiaKey!,
      });
    }

    return NextResponse.json({ image: base64 });
  } catch (err: any) {
    console.error('[generate-image] error:', err.message);
    return NextResponse.json({ error: err.message || '生成失敗，請稍後再試' }, { status: 500 });
  }
}
