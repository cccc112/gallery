import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { sql } from '@/lib/db';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'),
      messages,
      system: `你是一位藝廊平台的 AI 營運超級助理。你可以協助平台擁有者分析營運數據、解答客戶問題，甚至給出經營建議。
目前平台的資料概況：
- 總註冊用戶：約 150 人
- 本週銷售額：約 84,500 TWD
- 待處理客服表單：3 件（主旨：如何使用 PayPal、退款申請、畫作尺寸詢問）
請用繁體中文，並以專業、友善且精簡的語氣回覆。如果用戶要求你分析銷售狀況，你可以用上方的假資料進行生動的分析。如果用戶要求處理客訴，你可以草擬一段得體的回覆。`,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response('Error', { status: 500 });
  }
}
