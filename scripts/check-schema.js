require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
sql`SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artworks'
    ORDER BY ordinal_position`
  .then(r => { console.log(JSON.stringify(r, null, 2)); sql.end(); })
  .catch(e => { console.error(e); sql.end(); });
