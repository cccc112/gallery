import { sql } from './src/lib/db';

async function main() {
  try {
    console.log('Creating admin tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS public.page_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS public.support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open', -- open, pending, resolved
        ai_response TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create some mock data if empty
    const ticketsCount = await sql`SELECT count(*) FROM public.support_tickets`;
    if (ticketsCount[0].count === '0') {
      console.log('Inserting mock ticket...');
      const users = await sql`SELECT id FROM public.users LIMIT 1`;
      if (users.length > 0) {
        await sql`
          INSERT INTO public.support_tickets (user_id, subject, message, status)
          VALUES (${users[0].id}, '如何使用 PayPal 結帳？', '你好，我想請問目前是否支援 PayPal？', 'open')
        `;
      }
    }

    console.log('Admin tables created successfully.');
  } catch (e: any) {
    console.error('Error creating admin tables:', e.message);
  }
  process.exit(0);
}

main();
