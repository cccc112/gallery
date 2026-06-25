import { sql } from './src/lib/db';

async function main() {
  try {
    await sql`ALTER TABLE public.orders RENAME COLUMN stripe_payment_intent_id TO payment_transaction_id;`;
    console.log('Orders table altered successfully.');
  } catch (e: any) {
    if (e.message.includes('does not exist')) {
       console.log('Column stripe_payment_intent_id might not exist in orders, skipping.');
    } else {
       console.error('Orders table error:', e.message);
    }
  }

  try {
    await sql`ALTER TABLE public.rentals RENAME COLUMN stripe_payment_intent_id TO payment_transaction_id;`;
    console.log('Rentals table altered successfully.');
  } catch (e: any) {
    if (e.message.includes('does not exist')) {
       console.log('Column stripe_payment_intent_id might not exist in rentals, skipping.');
    } else {
       console.error('Rentals table error:', e.message);
    }
  }
  process.exit(0);
}

main();
