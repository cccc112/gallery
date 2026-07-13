import { sql } from './src/lib/db';

async function check() {
  const res = await sql`SELECT definition FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'`;
  console.log(res);
}

check().catch(console.error);
