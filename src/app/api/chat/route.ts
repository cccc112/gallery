import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 30; // max duration for Vercel functions

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth Check
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { messages } = await req.json();

    const result = await streamText({
      model: google('models/gemini-1.5-flash-latest'),
      system: `You are the AI Admin Assistant for 'Atelier Blanc', an art gallery platform.
Your job is to help the platform administrator manage the website, primarily focusing on managing artist applications and withdrawals.
You are equipped with tools to directly read and modify the production database.
Always speak in Traditional Chinese (繁體中文).
Be polite, concise, and professional.
When the user asks you to check something, use the appropriate tool.
When the user asks you to approve or reject something, use the appropriate tool, and report the success back to them.
DO NOT invent data. If a list is empty, tell them it is empty.`,
      messages,
      tools: {
        getPendingWithdrawals: tool({
          description: '取得所有尚未處理（pending）的提領申請清單',
          parameters: z.object({}),
          execute: async (args) => {
            const withdrawals = await sql`
              SELECT w.id, w.amount, w.bank_account, w.created_at, u.display_name as artist_name
              FROM public.withdrawals w
              JOIN public.users u ON w.artist_id = u.id
              WHERE w.status = 'pending'
              ORDER BY w.created_at ASC
            `;
            return Array.from(withdrawals);
          },
        }),
        approveWithdrawal: tool({
          description: '核准並標記一筆提領申請為已匯款 (completed)',
          parameters: z.object({
            id: z.string().describe('提領申請的 ID (UUID)'),
          }),
          execute: async ({ id }) => {
            await sql`
              UPDATE public.withdrawals
              SET status = 'completed', updated_at = NOW()
              WHERE id = ${id}
            `;
            return { success: true, message: `Withdrawal ${id} marked as completed.` };
          },
        }),
        getPendingApplications: tool({
          description: '取得所有尚未處理（pending）的藝術家審核申請清單',
          parameters: z.object({}),
          execute: async (args) => {
            const applications = await sql`
              SELECT id, real_name, portfolio_url, bank_account, created_at
              FROM public.artist_applications
              WHERE status = 'pending'
              ORDER BY created_at ASC
            `;
            return Array.from(applications);
          },
        }),
        approveApplication: tool({
          description: '核准一位藝術家的申請 (approved)',
          parameters: z.object({
            id: z.string().describe('申請單的 ID (UUID)'),
          }),
          execute: async ({ id }) => {
            // Update application status
            const apps = await sql`
              UPDATE public.artist_applications
              SET status = 'approved', updated_at = NOW()
              WHERE id = ${id}
              RETURNING user_id
            `;
            // Also update the user's role to 'artist'
            if (apps.length > 0) {
              const userId = apps[0].user_id;
              await sql`
                UPDATE public.users
                SET role = 'artist'
                WHERE id = ${userId}
              `;
            }
            return { success: true, message: `Application ${id} approved.` };
          },
        }),
        getSalesStats: tool({
          description: '取得平台目前的總營收與已付款訂單數',
          parameters: z.object({}),
          execute: async (args) => {
            const stats = await sql`
              SELECT count(*) as total_orders, sum(amount) as total_revenue
              FROM public.orders
              WHERE payment_status = 'paid'
            `;
            return { 
              totalOrders: Number(stats[0].total_orders || 0), 
              totalRevenue: Number(stats[0].total_revenue || 0) 
            };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
