-- 1. 啟用資料表的 RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- 2. Users (用戶與藝術家資料) 政策
-- 任何人都可以讀取公開的藝術家資料
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
-- 只有自己可以更新自己的資料
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Artworks (藝術品) 政策
-- 任何人都可以瀏覽藝術品
DROP POLICY IF EXISTS "Artworks are viewable by everyone." ON public.artworks;
CREATE POLICY "Artworks are viewable by everyone." ON public.artworks FOR SELECT USING (true);
-- 藝術家可以新增自己的作品
DROP POLICY IF EXISTS "Artists can insert their own artworks." ON public.artworks;
CREATE POLICY "Artists can insert their own artworks." ON public.artworks FOR INSERT WITH CHECK (auth.uid() = artist_id);
-- 藝術家可以修改自己的作品
DROP POLICY IF EXISTS "Artists can update their own artworks." ON public.artworks;
CREATE POLICY "Artists can update their own artworks." ON public.artworks FOR UPDATE USING (auth.uid() = artist_id);
-- 藝術家可以刪除自己的作品
DROP POLICY IF EXISTS "Artists can delete their own artworks." ON public.artworks;
CREATE POLICY "Artists can delete their own artworks." ON public.artworks FOR DELETE USING (auth.uid() = artist_id);

-- 4. Orders (買斷訂單) 政策
-- 買家只能看到自己的購買紀錄，藝術家只能看到賣出自己作品的紀錄
DROP POLICY IF EXISTS "Users can view their own orders or sales." ON public.orders;
CREATE POLICY "Users can view their own orders or sales." ON public.orders FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() IN (SELECT artist_id FROM public.artworks WHERE id = public.orders.artwork_id)
);

-- 5. Rentals (租賃紀錄) 政策
-- 租客只能看到自己的租賃，藝術家只能看到自己的出租紀錄
DROP POLICY IF EXISTS "Users can view their own rentals or leased artworks." ON public.rentals;
CREATE POLICY "Users can view their own rentals or leased artworks." ON public.rentals FOR SELECT USING (
  auth.uid() = tenant_id OR auth.uid() IN (SELECT artist_id FROM public.artworks WHERE id = public.rentals.artwork_id)
);
