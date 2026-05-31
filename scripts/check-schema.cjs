require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function main() {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log('=== Tables ===');
  tables.forEach(t => console.log(t.table_name));

  for (const { table_name } of tables) {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table_name}
      ORDER BY ordinal_position
    `;
    console.log(`\n=== ${table_name} ===`);
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'null' : 'not null'})`));
  }
  await sql.end();
}
main().catch(e => { console.error(e); process.exit(1); });
