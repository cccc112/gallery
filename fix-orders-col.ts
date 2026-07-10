import { sql } from './src/lib/db';

async function main() {
  try {
    // Try to add the column if it doesn't exist
    await sql`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;`;
    console.log('Added payment_transaction_id to orders');
  } catch (e: any) {
    console.error('Error adding to orders:', e.message);
  }

  try {
    await sql`ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;`;
    console.log('Added payment_transaction_id to rentals');
  } catch (e: any) {
    console.error('Error adding to rentals:', e.message);
  }
  
  process.exit(0);
}

main();
