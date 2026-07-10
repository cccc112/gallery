const postgres = require('postgres');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/"/g, '').trim();
    break;
  }
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function main() {
  try {
    // Try to add the column if it doesn't exist
    await sql`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;`;
    console.log('Added payment_transaction_id to orders');
  } catch (e) {
    console.error('Error adding to orders:', e.message);
  }

  try {
    await sql`ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;`;
    console.log('Added payment_transaction_id to rentals');
  } catch (e) {
    console.error('Error adding to rentals:', e.message);
  }
  
  await sql.end();
  process.exit(0);
}

main();
