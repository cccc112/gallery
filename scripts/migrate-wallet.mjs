import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get connection string from .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const match = envFile.match(/DATABASE_URL="([^"]+)"/);
if (!match) throw new Error('DATABASE_URL not found in .env.local');

const sql = postgres(match[1]);

async function migrate() {
  console.log('Running wallet system migration...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260722_wallet_system.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    await sql.unsafe(migrationSql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
