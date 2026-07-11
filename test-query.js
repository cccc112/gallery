const postgres = require('postgres');
const sql = postgres('postgresql://postgres.akabubzxgpbiemcgpzuf:Richhcir0122@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function test() {
  try {
    const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'artworks'`;
    console.log(res);
  } catch (e) {
    console.error("Query Error:", e.message);
  } finally {
    await sql.end();
  }
}
test();
