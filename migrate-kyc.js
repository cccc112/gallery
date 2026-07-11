const postgres = require('postgres');
const fs = require('fs');

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
      CREATE TABLE IF NOT EXISTS public.artist_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        real_name TEXT NOT NULL,
        id_number TEXT NOT NULL,
        bank_account TEXT NOT NULL,
        portfolio_url TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created artist_applications');

    await sql`
      CREATE TABLE IF NOT EXISTS public.withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        bank_account TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    console.log('Created withdrawals');
  } catch(e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
migrate();
