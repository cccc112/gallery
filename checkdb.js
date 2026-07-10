
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {ssl:'require'});
sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cover_url TEXT`.then(res => {
  console.log('Added cover_url');
  process.exit(0);
}).catch(console.error);
