import { sql } from './src/lib/db';

async function main() {
  try {
    console.log('Running RLS migration in a single batch...');
    await sql`
      -- Enable RLS
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

      -- Users policies
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
      CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
      CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

      -- Artworks policies
      DROP POLICY IF EXISTS "Artworks are viewable by everyone." ON public.artworks;
      CREATE POLICY "Artworks are viewable by everyone." ON public.artworks FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Artists can insert their own artworks." ON public.artworks;
      CREATE POLICY "Artists can insert their own artworks." ON public.artworks FOR INSERT WITH CHECK (auth.uid() = artist_id);
      DROP POLICY IF EXISTS "Artists can update their own artworks." ON public.artworks;
      CREATE POLICY "Artists can update their own artworks." ON public.artworks FOR UPDATE USING (auth.uid() = artist_id);
      DROP POLICY IF EXISTS "Artists can delete their own artworks." ON public.artworks;
      CREATE POLICY "Artists can delete their own artworks." ON public.artworks FOR DELETE USING (auth.uid() = artist_id);

      -- Orders policies
      DROP POLICY IF EXISTS "Users can view their own orders or sales." ON public.orders;
      CREATE POLICY "Users can view their own orders or sales." ON public.orders FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() IN (SELECT artist_id FROM public.artworks WHERE id = public.orders.artwork_id)
      );

      -- Rentals policies
      DROP POLICY IF EXISTS "Users can view their own rentals or leased artworks." ON public.rentals;
      CREATE POLICY "Users can view their own rentals or leased artworks." ON public.rentals FOR SELECT USING (
        auth.uid() = tenant_id OR auth.uid() IN (SELECT artist_id FROM public.artworks WHERE id = public.rentals.artwork_id)
      );
    `;
    console.log('RLS Policies applied successfully!');
  } catch (e: any) {
    console.error('Error applying RLS:', e.message);
  }
  process.exit(0);
}

main();
