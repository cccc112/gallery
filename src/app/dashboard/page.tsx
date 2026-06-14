import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, User } from 'lucide-react';
import { DashboardTabs } from '@/components/DashboardTabs';

export const revalidate = 0;

export default async function DashboardPage() {
  // 1. 驗證登入
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard');

  // 2. 取 profile
  let profile: any = null;
  try {
    const profiles = await sql`SELECT * FROM public.users WHERE id = ${user.id} LIMIT 1`;
    profile = profiles[0] || null;
  } catch { }

  const displayName = profile?.display_name || user.email?.split('@')[0] || '使用者';
  const avatarUrl = profile?.avatar_url
    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || '')}`;

  // 3. 【我的收藏】撈 orders JOIN artworks
  let orders: any[] = [];
  try {
    orders = await sql`
      SELECT
        o.id, o.artwork_id, o.amount, o.payment_status,
        o.stripe_payment_intent_id, o.created_at,
        a.title, a.art_type, a.preview_file_url, a.high_res_file_url
      FROM public.orders o
      JOIN public.artworks a ON o.artwork_id = a.id
      WHERE o.buyer_id = ${user.id}
      ORDER BY o.created_at DESC
    `;
  } catch (e: any) {
    console.error('Orders fetch error:', e.message);
  }

  // 4. 【租賃中】撈 rentals JOIN artworks
  let rentals: any[] = [];
  try {
    rentals = await sql`
      SELECT
        r.id, r.artwork_id, r.monthly_rent, r.deposit_amount,
        r.start_date, r.end_date, r.status, r.created_at,
        a.title, a.art_type, a.preview_file_url
      FROM public.rentals r
      JOIN public.artworks a ON r.artwork_id = a.id
      WHERE r.tenant_id = ${user.id}
      ORDER BY r.created_at DESC
    `;
  } catch (e: any) {
    console.error('Rentals fetch error:', e.message);
  }

  // 5. 【創作者中心】撈 artworks + 銷售統計
  let artworks: any[] = [];
  try {
    artworks = await sql`
      SELECT
        a.*,
        COALESCE(oc.order_count, 0) AS order_count,
        COALESCE(oc.order_revenue, 0) AS order_revenue,
        COALESCE(rc.rental_count, 0) AS rental_count,
        COALESCE(rc.rental_revenue, 0) AS rental_revenue,
        COALESCE(oc.order_revenue, 0) + COALESCE(rc.rental_revenue, 0) AS total_revenue
      FROM public.artworks a
      LEFT JOIN (
        SELECT artwork_id,
          COUNT(*) AS order_count,
          SUM(amount) AS order_revenue
        FROM public.orders
        WHERE payment_status = 'paid'
        GROUP BY artwork_id
      ) oc ON oc.artwork_id = a.id
      LEFT JOIN (
        SELECT artwork_id,
          COUNT(*) AS rental_count,
          SUM(monthly_rent) AS rental_revenue
        FROM public.rentals
        WHERE status = 'active'
        GROUP BY artwork_id
      ) rc ON rc.artwork_id = a.id
      WHERE a.artist_id = ${user.id}
      ORDER BY a.created_at DESC
    `;
  } catch (e: any) {
    console.error('Artworks fetch error:', e.message);
  }

  // 6. 收入分類（法幣 vs USDC）
  let totalFiatRevenue = 0;
  let totalCryptoRevenue = 0;
  try {
    const revRows = await sql`
      SELECT amount, stripe_payment_intent_id
      FROM public.orders o
      JOIN public.artworks a ON o.artwork_id = a.id
      WHERE a.artist_id = ${user.id} AND o.payment_status = 'paid'
    `;
    for (const row of revRows) {
      const txId = row.stripe_payment_intent_id || '';
      const amt = Number(row.amount);
      if (txId.startsWith('0x') || txId.startsWith('0xMOCK')) {
        totalCryptoRevenue += amt;
      } else {
        totalFiatRevenue += amt;
      }
    }
    // 租賃收入計入法幣（目前租賃走 fiat）
    const rentRevRows = await sql`
      SELECT r.monthly_rent
      FROM public.rentals r
      JOIN public.artworks a ON r.artwork_id = a.id
      WHERE a.artist_id = ${user.id} AND r.status = 'active'
    `;
    for (const row of rentRevRows) {
      totalFiatRevenue += Number(row.monthly_rent);
    }
  } catch (e: any) {
    console.error('Revenue fetch error:', e.message);
  }

  return (
    <div className="marble-bg min-h-screen py-10 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/70 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-amber-50/50 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">

        {/* ── 頁首 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full border-2 border-border shadow-sm bg-stone-100 overflow-hidden flex-shrink-0">
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  資產管理後台
                </p>
              </div>
              <h1 className="font-serif text-2xl font-semibold text-foreground mt-0.5">
                歡迎回來，{displayName}
              </h1>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2.5 bg-white/60 border border-border/50 rounded-sm">
              <p className="text-lg font-serif font-semibold text-foreground">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">收藏</p>
            </div>
            <div className="text-center px-4 py-2.5 bg-white/60 border border-border/50 rounded-sm">
              <p className="text-lg font-serif font-semibold text-foreground">{rentals.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">租賃中</p>
            </div>
            <div className="text-center px-4 py-2.5 bg-white/60 border border-border/50 rounded-sm">
              <p className="text-lg font-serif font-semibold text-foreground">{artworks.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">作品</p>
            </div>
          </div>
        </div>

        {/* ── 主要內容區 ── */}
        <div className="bg-white/50 backdrop-blur-sm border border-border/50 rounded-sm shadow-sm p-6 lg:p-8">
          <DashboardTabs
            orders={orders}
            rentals={rentals}
            artworks={artworks}
            totalFiatRevenue={totalFiatRevenue}
            totalCryptoRevenue={totalCryptoRevenue}
          />
        </div>

        {/* ── 底部導覽 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {[
            { href: '/profile', icon: User, label: '個人資訊', sub: '編輯頭像、顯示名稱' },
            { href: '/profile/upload', icon: LayoutDashboard, label: '上傳新作品', sub: '發布至藝廊販售' },
            { href: '/gallery', icon: LayoutDashboard, label: '探索藝廊', sub: '瀏覽所有作品' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-4 bg-white/50 border border-border/40 rounded-sm hover:bg-white/70 hover:shadow-sm transition-all"
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground font-light">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* AI 生成工作室入口 */}
        <Link
          href="/generate"
          className="mt-3 flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-sm hover:from-indigo-100 hover:to-purple-100 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">✦ AI 藝術生成工作室</p>
              <p className="text-[10px] text-indigo-600/70">由 NVIDIA FLUX.1 驅動 · 輸入描述，秒出精緻畫作</p>
            </div>
          </div>
          <svg className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  );
}
