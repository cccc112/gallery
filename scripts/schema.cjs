const p = require('postgres');
const s = p(process.env.DATABASE_URL, { ssl: 'require' });
s`SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name IN ('orders', 'rentals')
  ORDER BY table_name, ordinal_position`
  .then(r => {
    r.forEach(c => console.log(c.table_name, '|', c.column_name, '|', c.data_type));
    s.end();
  })
  .catch(e => { console.error(e.message); s.end(); });
