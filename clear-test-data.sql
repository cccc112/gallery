-- 清除所有測試資料（按照外鍵依賴順序刪除）
-- 1. 先刪 orders 和 rentals（因為它們 reference artworks 和 users）
DELETE FROM public.rentals;
DELETE FROM public.orders;

-- 2. 刪除所有藝術品
DELETE FROM public.artworks;

-- 3. 刪除所有 support tickets 與 page views（如果存在）
DELETE FROM public.support_tickets;
DELETE FROM public.page_views;

-- 確認結果
SELECT 'artworks' as table_name, count(*) FROM public.artworks
UNION ALL
SELECT 'orders', count(*) FROM public.orders
UNION ALL
SELECT 'rentals', count(*) FROM public.rentals;
