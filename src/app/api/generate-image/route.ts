import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // FLUX 生圖需要較長時間

export async function POST(req: NextRequest) {
  // 驗證登入
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  const { prompt, width = 1024, height = 1024, steps = 4 } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: '請輸入描述文字' }, { status: 400 });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NVIDIA API 未設定' }, { status: 500 });
  }

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
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: Math.min(Math.max(width, 256), 1440),
          height: Math.min(Math.max(height, 256), 1440),
          num_inference_steps: Math.min(Math.max(steps, 1), 50),
          guidance: 3.5,
          seed: Math.floor(Math.random() * 2147483647),
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('[NVIDIA] Error:', errText);
      return NextResponse.json(
        { error: `生成失敗：${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const b64 = data?.artifacts?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json({ error: '未收到圖片資料' }, { status: 500 });
    }

    return NextResponse.json({ image: b64 });
  } catch (err: any) {
    console.error('[NVIDIA] fetch error:', err.message);
    return NextResponse.json({ error: '連線失敗：' + err.message }, { status: 500 });
  }
}
