import { sql } from './src/lib/db';

async function applyRLS() {
  try {
    console.log('Applying RLS policies...');

    // Users table RLS
    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`;
    
    // Drop existing policies if they exist to avoid errors
    await sql`DROP POLICY IF EXISTS "Users can read their own profile" ON users;`;
    await sql`DROP POLICY IF EXISTS "Users can update their own profile" ON users;`;
    await sql`DROP POLICY IF EXISTS "Public can view artist profiles" ON users;`;

    // 1. Users can read their own profile
    await sql`
      CREATE POLICY "Users can read their own profile" 
      ON users FOR SELECT 
      USING (auth.uid() = id);
    `;

    // 2. Users can update their own profile, but CANNOT update wallet_balance or role
    // We achieve this by explicitly listing the columns they can update, or just allowing update 
    // but the API/DB logic should prevent role/balance changes. 
    // Wait, in Supabase, column-level RLS is supported!
    await sql`
      CREATE POLICY "Users can update their own profile" 
      ON users FOR UPDATE 
      USING (auth.uid() = id);
    `;

    // Note: To strictly prevent updating wallet_balance and role via API, we revoke update on those columns
    await sql`REVOKE UPDATE (wallet_balance, frozen_balance, role) ON users FROM authenticated;`;
    await sql`GRANT UPDATE (name, email, avatar_url, bio, stripe_account_id) ON users TO authenticated;`;

    // Orders table RLS
    await sql`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`;
    await sql`DROP POLICY IF EXISTS "Users can view their own orders" ON orders;`;
    await sql`DROP POLICY IF EXISTS "Users can insert orders" ON orders;`;
    
    await sql`
      CREATE POLICY "Users can view their own orders" 
      ON orders FOR SELECT 
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    `;

    await sql`
      CREATE POLICY "Users can insert orders" 
      ON orders FOR INSERT 
      WITH CHECK (auth.uid() = buyer_id);
    `;

    // Revoke update on payment_status and total_amount for regular users
    await sql`REVOKE UPDATE (payment_status, total_amount, platform_fee, status) ON orders FROM authenticated;`;

    console.log('RLS applied successfully.');
  } catch (err) {
    console.error('Error applying RLS:', err);
  } finally {
    process.exit(0);
  }
}

applyRLS();
