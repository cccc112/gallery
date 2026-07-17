const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(line => line.startsWith('DATABASE_URL='));
const dbUrl = env.split('DATABASE_URL=')[1].trim().replace(/^"|"$/g, '');

const postgres = require('postgres');
const sql = postgres(dbUrl, {ssl: 'require'});

async function run() {
  try {
    await sql`ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS theme text;`;
    console.log('Column theme added');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
