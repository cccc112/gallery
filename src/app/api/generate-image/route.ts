import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// width/height 必須是 16 的倍數，且在 256-1440 之間
function snapTo16(n: number): number {
  return Math.round(Math.min(Math.max(n, 256), 1440) / 16) * 16;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  const { prompt, width = 1024, height = 1024, steps = 2, seed, negative_prompt } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: '請輸入描述文字' }, { status: 400 });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NVIDIA API 未設定' }, { status: 500 });
  }

  const safeWidth = snapTo16(width);
  const safeHeight = snapTo16(height);
  const safeSteps = Math.min(Math.max(Math.floor(steps), 1), 4); // schnell 最多 4 步

  const useSeed = (seed !== undefined && Number.isInteger(seed)) ? seed : Math.floor(Math.random() * 2147483647);

  const body: Record<string, unknown> = {
    prompt: prompt.trim(),
    width: safeWidth,
    height: safeHeight,
    steps: safeSteps,   // NVIDIA FLUX NIM 使用 "steps"，不是 "num_inference_steps"
    seed: useSeed,
  };

  // negative_prompt 僅在非空時才傳（某些模型版本不支援）
  if (negative_prompt?.trim()) {
    body.negative_prompt = negative_prompt.trim();
  }

  console.log('[NVIDIA] request body:', JSON.stringify(body));

  try {
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
      console.error('[NVIDIA] Error:', res.status, errText);
      return NextResponse.json(
        { error: `生成失敗：${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log('[NVIDIA] raw response keys:', Object.keys(data));

    // NVIDIA NIM genai endpoint 回傳 artifacts[].base64
    // OpenAI 相容端點回傳 data[].b64_json，兩種都支援
    const b64 =
      data?.artifacts?.[0]?.base64 ||
      data?.artifacts?.[0]?.b64_json ||
      data?.data?.[0]?.b64_json;

    if (!b64) {
      console.error('[NVIDIA] No b64 in response:', JSON.stringify(data));
      return NextResponse.json({ error: '未收到圖片資料' }, { status: 500 });
    }

    return NextResponse.json({ image: b64 });
  } catch (err: any) {
    console.error('[NVIDIA] fetch error:', err.message);
    return NextResponse.json({ error: '連線失敗：' + err.message }, { status: 500 });
  }
}
