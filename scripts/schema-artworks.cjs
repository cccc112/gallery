const p = require('postgres');
const s = p(process.env.DATABASE_URL, { ssl: 'require' });
s`SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'artworks'
  ORDER BY ordinal_position`
  .then(r => { r.forEach(c => console.log(c.column_name, ':', c.data_type)); s.end(); })
  .catch(e => { console.error(e.message); s.end(); });
