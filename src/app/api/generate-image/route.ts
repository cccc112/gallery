import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // 允許 Vercel Serverless Function 執行長達 60 秒

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
  // Edge Runtime 不支援 Buffer，改用 btoa
  const bytes = new Uint8Array(arrayBuf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── Hugging Face 實作 (Tongyi-MAI/Z-Image) ───────────────────────────────────
async function generateViaHuggingFace(params: {
  prompt: string;
  width: number;
  height: number;
  steps: number;
  seed: number;
  negative_prompt?: string;
  apiKey: string;
}): Promise<string> {
  const { prompt, apiKey } = params;

  // Hugging Face Inference API 的標準格式
  const res = await fetch(
    'https://api-inference.huggingface.co/models/Tongyi-MAI/Z-Image',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // HF Inference API 預設只需要 inputs 欄位
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    // 處理 Model Loading 狀態 (通常需要重試)
    if (res.status === 503 && errText.includes('currently loading')) {
      throw new Error(`模型正在喚醒中，請稍等約 30 秒後再試。 (Hugging Face: 503)`);
    }
    throw new Error(`Hugging Face API 錯誤 ${res.status}: ${errText.slice(0, 200)}`);
  }

  // HF Inference API 成功時回傳的是二進位圖檔資料 (Blob)
  const arrayBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── 主 handler ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { prompt, width = 1024, height = 1024, steps = 4, seed, negative_prompt, customApiKey } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: '請輸入描述文字' }, { status: 400 });

  let replicateToken = process.env.REPLICATE_API_TOKEN;
  let huggingFaceKey = process.env.HUGGINGFACE_API_KEY;
  let isUsingCustomKey = false;

  if (customApiKey && customApiKey.trim()) {
    const key = customApiKey.trim();
    if (key.startsWith('hf_')) {
      huggingFaceKey = key;
      replicateToken = undefined; // 強制使用 HF
    } else {
      replicateToken = key;
      huggingFaceKey = undefined; // 強制使用 Replicate
    }
    isUsingCustomKey = true;
  }

  if (!replicateToken && !huggingFaceKey) {
    return NextResponse.json({ error: '尚未設定 AI 生成 API Key' }, { status: 500 });
  }

  const useSeed = (Number.isInteger(seed) && seed >= 0) ? seed : Math.floor(Math.random() * 2147483647);

  try {
    // 檢查每日額度 (如果是使用自訂金鑰則跳過檢查)
    if (!isUsingCustomKey) {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      
      const { count, error: countError } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (countError) throw countError;

      if (count !== null && count >= 5) {
        return NextResponse.json(
          { error: '今日免費 AI 生成額度已用盡 (5/5)，請明日再試。' },
          { status: 429 }
        );
      }
    }

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
      // fallback Hugging Face Z-Image
      base64 = await generateViaHuggingFace({
        prompt: prompt.trim(),
        width, height, steps,
        seed: useSeed,
        negative_prompt,
        apiKey: huggingFaceKey!,
      });
    }

    // 成功生成後，寫入使用紀錄
    await supabase.from('ai_usage_logs').insert({ user_id: user.id });

    return NextResponse.json({ image: base64 });
  } catch (err: any) {
    console.error('[generate-image] error:', err.message);
    return NextResponse.json({ error: err.message || '生成失敗，請稍後再試' }, { status: 500 });
  }
}
