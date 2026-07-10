const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {ssl:'require'});
sql`ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[]`.then(() => {
  console.log('Added tags to artworks');
  process.exit(0);
}).catch(console.error);
