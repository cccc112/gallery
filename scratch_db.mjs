import fs from 'fs';
import postgres from 'postgres';

const env = fs.readFileSync('.env.local', 'utf-8');
const dbUrl = env.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].trim().replace(/"/g, '');

const db = postgres(dbUrl, { ssl: 'require' });

async function run() {
  try {
    await db`ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS original_guaranteed boolean DEFAULT false;`;
    console.log('Added original_guaranteed to artworks');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
