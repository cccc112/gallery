import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// 允許最長 60 秒的執行時間
export const maxDuration = 60;

export async function POST(req: Request) {
  // 檢查是否為管理員
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== 'richhong0122@gmail.com') {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `您是 Atelier Blanc 藝廊網站的 AI 總管 (Admin Copilot)。
您的職責是協助站長管理網站、查詢營運數據、並提供專業的營運建議。
您可以透過呼叫工具來取得即時的資料庫數據。回答請一律使用繁體中文，態度專業且樂於助人。`,
    messages,
    tools: {
      getGalleryStats: tool({
        description: '取得藝廊目前的營運數據（包含總使用者數、總作品數、總訂單數、總租賃數）',
        parameters: z.object({}),
        execute: async () => {
          const userCount = await sql`SELECT count(*) FROM public.users`;
          const artworkCount = await sql`SELECT count(*) FROM public.artworks`;
          const orderCount = await sql`SELECT count(*) FROM public.orders`;
          const rentalCount = await sql`SELECT count(*) FROM public.rentals`;
          
          return {
            users: Number(userCount[0].count),
            artworks: Number(artworkCount[0].count),
            orders: Number(orderCount[0].count),
            rentals: Number(rentalCount[0].count),
          };
        },
      }),
      searchArtworks: tool({
        description: '根據關鍵字搜尋藝廊中的作品',
        parameters: z.object({
          keyword: z.string().describe('搜尋關鍵字，例如"油畫"或"宇宙"'),
        }),
        execute: async ({ keyword }) => {
          const artworks = await sql`
            SELECT id, title, art_type, price, stock, is_rentable 
            FROM public.artworks 
            WHERE title ILIKE ${'%' + keyword + '%'} OR description ILIKE ${'%' + keyword + '%'}
            LIMIT 5
          `;
          return artworks;
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
