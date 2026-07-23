const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(line => line.startsWith('DATABASE_URL='));
const dbUrl = env.split('DATABASE_URL=')[1].trim().replace(/^"|"$/g, '');

const postgres = require('postgres');
const sql = postgres(dbUrl, {ssl: 'require'});

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.artist_series (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Table artist_series created');
    
    await sql`ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.artist_series(id) ON DELETE SET NULL;`;
    console.log('Column series_id added to artworks');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
