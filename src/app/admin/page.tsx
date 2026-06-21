import Link from 'next/link';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Plus, ShoppingCart, Layers, Calendar, User, ShieldAlert, BadgeCheck
} from 'lucide-react';

export const revalidate = 0; // 停用快取以呈現最新管理數據

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/admin');

  // 從 DB 取得 role
  let userRole = 'buyer';
  try {
    const rows = await sql`SELECT role FROM public.users WHERE id = ${user.id} LIMIT 1`;
    userRole = rows[0]?.role || 'buyer';
  } catch {}

  let artworks: any[] = [];
  let orders: any[] = [];
  let rentals: any[] = [];
  let hasError = false;

  try {
    artworks = await sql`
      SELECT a.*, u.display_name as artist_name 
      FROM public.artworks a
      JOIN public.users u ON a.artist_id = u.id
      ORDER BY a.created_at DESC
    `;

    orders = await sql`
      SELECT o.*, a.title as artwork_title, u.display_name as buyer_name
      FROM public.orders o
      JOIN public.artworks a ON o.artwork_id = a.id
      JOIN public.users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
    `;

    rentals = await sql`
      SELECT r.*, a.title as artwork_title, u.display_name as tenant_name
      FROM public.rentals r
      JOIN public.artworks a ON r.artwork_id = a.id
      JOIN public.users u ON r.tenant_id = u.id
      ORDER BY r.created_at DESC
    `;
  } catch (err: any) {
    console.error('Failed to load admin dashboard data:', err);
    hasError = true;
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="marble-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {/* Role Notice */}
        <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 text-sm shadow-sm ${
          userRole === 'artist'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {userRole === 'artist' ? (
            <>
              <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-950">藝術家帳號</p>
                <p className="text-xs text-emerald-800/90 mt-0.5">您已具備完整管理權限，包括上架藝術品、查看交易/租用合約狀態。</p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-950">買家帳號</p>
                <p className="text-xs text-amber-800/90 mt-0.5">您目前是買家身分，僅供查閱。上架作品請聯絡管理員開通藝術家權限。</p>
              </div>
            </>
          )}
        </div>

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">藝廊控制台</h1>
            <p className="mt-2 text-sm text-muted-foreground font-light">管理所有的藝術品上架、純買賣訂單與短期租賃合約。</p>
          </div>
          {userRole === 'artist' && (
            <Link
              href="/admin/new"
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 px-5 py-2.5 text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 self-start"
            >
              <Plus className="h-4 w-4" />
              上架新藝術品
            </Link>
          )}
        </div>

        {hasError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 mb-8">
            資料載入失敗，請稍後再試或聯絡管理員。
          </div>
        )}

        {/* Tables list */}
        <div className="space-y-12">
          {/* Table 1: Artworks */}
          <section className="bg-card rounded-xl border border-border/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-serif font-semibold text-foreground">上架畫作管理 ({artworks.length})</h2>
            </div>
            
            {artworks.length === 0 ? (
              <p className="text-muted-foreground text-xs py-6 text-center">目前尚無上架作品。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground pb-3 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">預覽</th>
                      <th className="py-3 px-2">作品名稱</th>
                      <th className="py-3 px-2">藝術家</th>
                      <th className="py-3 px-2">類型</th>
                      <th className="py-3 px-2">買斷售價</th>
                      <th className="py-3 px-2">可租賃</th>
                      <th className="py-3 px-2">租金/押金</th>
                      <th className="py-3 px-2">庫存狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-foreground font-light">
                    {artworks.map((art: any) => (
                      <tr key={art.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-2">
                          <img src={art.preview_file_url} alt="" className="h-10 w-12 object-cover rounded border border-border bg-stone-50" />
                        </td>
                        <td className="py-3 px-2 font-bold text-foreground font-serif text-sm">{art.title}</td>
                        <td className="py-3 px-2 text-muted-foreground">{art.artist_name}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${art.art_type === 'physical' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {art.art_type === 'physical' ? '實體' : '數位'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono font-medium">
                          {art.price ? formatPrice(Number(art.price)) : '非賣品'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${art.is_rentable ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                            {art.is_rentable ? '是' : '否'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-muted-foreground">
                          {art.is_rentable 
                            ? `${formatPrice(Number(art.monthly_rent_price))} / ${formatPrice(Number(art.deposit_amount))}` 
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {art.art_type === 'physical' ? `庫存 ${art.stock} 件` : '雲端安全存儲'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Table 2: Orders */}
            <section className="bg-card rounded-xl border border-border/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-serif font-semibold text-foreground">買斷交易紀錄 ({orders.length})</h2>
              </div>
              
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-xs py-6 text-center">目前尚無成交紀錄。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="pb-3 px-2">收藏買家</th>
                        <th className="pb-3 px-2">購買畫作</th>
                        <th className="pb-3 px-2">成交金額</th>
                        <th className="pb-3 px-2">付款狀態</th>
                        <th className="pb-3 px-2">成交日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-foreground font-light">
                      {orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-2 flex items-center gap-1.5 font-medium">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {order.buyer_name}
                          </td>
                          <td className="py-3 px-2 text-foreground font-serif">{order.artwork_title}</td>
                          <td className="py-3 px-2 font-mono font-bold text-foreground">{formatPrice(Number(order.amount))}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : order.payment_status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              {order.payment_status === 'paid' ? '已付款' : order.payment_status === 'pending' ? '待付款' : order.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('zh-TW')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Table 3: Rentals */}
            <section className="bg-card rounded-xl border border-border/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-serif font-semibold text-foreground">短期租賃合約 ({rentals.length})</h2>
              </div>
              
              {rentals.length === 0 ? (
                <p className="text-muted-foreground text-xs py-6 text-center">目前尚無租賃合約。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="pb-3 px-2">承租客</th>
                        <th className="pb-3 px-2">租用作品</th>
                        <th className="pb-3 px-2">月租/押金</th>
                        <th className="pb-3 px-2">租期合約起訖</th>
                        <th className="pb-3 px-2">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-foreground font-light">
                      {rentals.map((rental: any) => (
                        <tr key={rental.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-2 flex items-center gap-1.5 font-medium">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {rental.tenant_name}
                          </td>
                          <td className="py-3 px-2 text-foreground font-serif">{rental.artwork_title}</td>
                          <td className="py-3 px-2 font-mono text-muted-foreground">
                            {formatPrice(Number(rental.monthly_rent))} / {formatPrice(Number(rental.deposit_amount))}
                          </td>
                          <td className="py-3 px-2 text-[10px] text-muted-foreground">
                            {rental.start_date} ~ {rental.end_date}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rental.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              {rental.status === 'active' ? '租借中' : '已歸還'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
