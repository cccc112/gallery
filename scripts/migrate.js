const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// 1. 讀取並解析 .env.local 中的 DATABASE_URL
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!match) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const databaseUrl = match[1];

// 2. 初始化 PostgreSQL 連線
const sql = postgres(databaseUrl, {
  ssl: 'require' // Supabase 通常需要 SSL 連線
});

async function run() {
  try {
    console.log('Connecting to Supabase Database...');
    
    // 3. 執行 DDL 建立資料表與約束
    await sql.unsafe(`
      -- 建立 Users 資料表
      CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'buyer' CONSTRAINT chk_user_role CHECK (role IN ('buyer', 'artist')),
          display_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 建立 Artworks 資料表
      CREATE TABLE IF NOT EXISTS public.artworks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          art_type TEXT NOT NULL CONSTRAINT chk_art_type CHECK (art_type IN ('physical', 'digital')),
          price NUMERIC(12, 2),
          
          -- 租賃欄位
          is_rentable BOOLEAN DEFAULT FALSE NOT NULL,
          monthly_rent_price NUMERIC(12, 2),
          deposit_amount NUMERIC(12, 2),
          
          -- 實體專屬欄位
          width NUMERIC(8, 2),
          height NUMERIC(8, 2),
          depth NUMERIC(8, 2),
          weight NUMERIC(8, 2),
          stock INTEGER DEFAULT 0,
          
          -- 數位專屬欄位
          high_res_file_url TEXT,
          preview_file_url TEXT,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          
          -- 租賃約束
          CONSTRAINT chk_rentable_fields CHECK (
              (is_rentable = FALSE) OR 
              (is_rentable = TRUE AND monthly_rent_price IS NOT NULL AND deposit_amount IS NOT NULL)
          ),
          
          -- 實體欄位約束
          CONSTRAINT chk_physical_fields CHECK (
              (art_type = 'digital') OR
              (art_type = 'physical' AND width IS NOT NULL AND height IS NOT NULL AND stock IS NOT NULL AND high_res_file_url IS NULL)
          ),
          
          -- 數位欄位約束
          CONSTRAINT chk_digital_fields CHECK (
              (art_type = 'physical') OR
              (art_type = 'digital' AND high_res_file_url IS NOT NULL AND width IS NULL AND height IS NULL AND depth IS NULL AND weight IS NULL AND stock IS NULL)
          )
      );

      -- 建立 Orders 資料表 (買賣紀錄)
      CREATE TABLE public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
          artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT chk_order_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed')),
          stripe_payment_intent_id TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 建立 Rentals 資料表 (租賃紀錄)
      CREATE TABLE public.rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
          artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          deposit_payment_intent_id TEXT NOT NULL UNIQUE,
          monthly_rent NUMERIC(12, 2) NOT NULL,
          deposit_amount NUMERIC(12, 2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CONSTRAINT chk_rental_status CHECK (status IN ('active', 'pending_return', 'completed', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          
          CONSTRAINT chk_rental_dates CHECK (start_date <= end_date)
      );
    `);

    console.log('✅ Tables and constraints successfully created in Supabase!');
  } catch (error) {
    console.error('❌ Error executing database migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
