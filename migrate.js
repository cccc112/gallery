const postgres = require('postgres');
const fs = require('fs');

// 讀取 .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/"/g, '').trim();
    break;
  }
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function migrate() {
  try {
    console.log('Creating tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS public.page_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
        viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created page_views');

    await sql`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
        buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created reviews');

    await sql`
      CREATE TABLE IF NOT EXISTS public.chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        artist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        UNIQUE(buyer_id, artist_id, artwork_id)
      );
    `;
    console.log('Created chat_sessions');

    await sql`
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created messages');

    await sql`
      CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created ai_usage_logs');

    // Policies (if needed, though we can use service_role for APIs)
    // For now, we will handle security via Next.js API routes, so RLS on these can be restrictive or disabled.
    // If they are accessed via client, we need RLS. We'll use Server API, so we can ignore RLS for now or just allow it.

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
