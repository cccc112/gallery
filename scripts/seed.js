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
const sql = postgres(databaseUrl, { ssl: 'require' });

async function run() {
  try {
    console.log('Seeding Supabase Database...');

    const artistId = '94c64b59-994c-41c3-882d-127e9086e927';
    const buyerId = '54d64b59-994c-41c3-882d-127e9086e928';

    // A. 寫入 auth.users (以滿足 public.users 的外鍵關聯)
    await sql.unsafe(`
      INSERT INTO auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data)
      VALUES 
        ('${artistId}', 'artist@example.com', 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{}'),
        ('${buyerId}', 'buyer@example.com', 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{}')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('seeded auth.users');

    // B. 寫入 public.users
    await sql.unsafe(`
      INSERT INTO public.users (id, email, role, display_name, avatar_url)
      VALUES 
        ('${artistId}', 'artist@example.com', 'artist', '陳畫家 (Artist)', 'https://api.dicebear.com/7.x/adventurer/svg?seed=artist'),
        ('${buyerId}', 'buyer@example.com', 'buyer', '林買家 (Buyer)', 'https://api.dicebear.com/7.x/adventurer/svg?seed=buyer')
      ON CONFLICT (id) DO UPDATE 
      SET display_name = EXCLUDED.display_name, role = EXCLUDED.role;
    `);
    console.log('seeded public.users');

    // C. 寫入 public.artworks
    await sql.unsafe(`
      -- 清空原有資料以避免重複
      TRUNCATE TABLE public.orders CASCADE;
      TRUNCATE TABLE public.rentals CASCADE;
      TRUNCATE TABLE public.artworks CASCADE;

      -- 插入測試用藝術品
      INSERT INTO public.artworks (
        id, artist_id, title, description, art_type, price, 
        is_rentable, monthly_rent_price, deposit_amount, 
        width, height, depth, weight, stock, 
        high_res_file_url, preview_file_url
      ) VALUES
      (
        'a1111111-1111-1111-1111-111111111111',
        '${artistId}',
        '寂靜的耳語 (Silent Whispers)',
        '這幅實體油畫捕捉了深夜森林的神秘低語，色彩層次豐富，能為空間帶來寧靜祥和的氛圍。提供短期租賃，非常適合樣品屋、藝文展覽或居家短期美化。',
        'physical',
        12000.00,
        true,
        800.00,
        3000.00,
        80.00,
        60.00,
        5.00,
        3.50,
        1,
        NULL,
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600'
      ),
      (
        'a2222222-2222-2222-2222-222222222222',
        '${artistId}',
        '霓虹科幻都市 (Cyberpunk City)',
        '未來主義風格的數位藝術，以賽博龐克城市街景為靈感。購買後即可獲得高解析度無損 TIF 檔案下載連結，可作為商業授權或高階數位螢幕展示。',
        'digital',
        1500.00,
        false,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://example.com/private/neon-city-highres.png',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600'
      ),
      (
        'a3333333-3333-3333-3333-333333333333',
        '${artistId}',
        '流動的乙太 (Ethereal Flow)',
        '動態抽象數位藝術，表現虛擬世界的乙太流動感。本作品同時支援買賣與數位短期展示授權（租賃，提供一個月的私有預覽權限）。',
        'digital',
        2500.00,
        true,
        200.00,
        500.00,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://example.com/private/ethereal-flow-highres.png',
        'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=600'
      ),
      (
        'a4444444-4444-4444-4444-444444444444',
        '${artistId}',
        '大理石冥想者 (Marble Silhouette)',
        '由純白大理石手工雕刻而成的抽象雕塑，展現思想者的沉思線條。此作品僅提供短期租賃（適合豪宅公設展示或特別活動），不提供直接買賣。',
        'physical',
        NULL,
        true,
        2500.00,
        8000.00,
        45.00,
        45.00,
        120.00,
        50.00,
        1,
        NULL,
        'https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=600'
      );
    `);
    console.log('seeded public.artworks');

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error executing database seed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
