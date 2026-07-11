const postgres = require('postgres');
const sql = postgres('postgresql://postgres.akabubzxgpbiemcgpzuf:Richhcir0122@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function test() {
  try {
    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS story TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS instagram TEXT,
      ADD COLUMN IF NOT EXISTS twitter TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS bank_account TEXT;
    `;
    console.log('Columns added to users table');
  } catch (err) {
    console.error(err);
  }
  sql.end();
}
test();
