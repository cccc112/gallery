import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/app/auth/actions';
import { Upload, Package, ShoppingBag, Edit3, LogOut, ImageIcon, Eye, ExternalLink } from 'lucide-react';

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/profile');

  // 取 profile + 上傳的作品
  let profile: any = null;
  let myArtworks: any[] = [];
  let orderCount = 0;

  try {
    const profiles = await sql`SELECT * FROM public.users WHERE id = ${user.id} LIMIT 1`;
    profile = profiles[0] || null;

    myArtworks = await sql`
      SELECT * FROM public.artworks
      WHERE artist_id = ${user.id}
      ORDER BY created_at DESC
    `;

    const orders = await sql`
      SELECT COUNT(*) as count FROM public.orders WHERE buyer_id = ${user.id}
    `;
    orderCount = Number(orders[0]?.count || 0);
  } catch (e) {
    console.error('Profile fetch error:', e);
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || '使用者';
  const avatarUrl = profile?.avatar_url
    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || '')}`;

  const formatPrice = (p: any) =>
    p == null ? null : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(Number(p));

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl space-y-8">

        {/* ── Profile Card ── */}
        <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm shadow-sm overflow-hidden">
          {/* Cover bar */}
          <div className="h-24 bg-gradient-to-r from-stone-100 via-amber-50/60 to-stone-100" />

          <div className="px-8 pb-8">
            {/* Avatar + name row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 rounded-full border-4 border-white shadow-md bg-stone-100 flex-shrink-0"
                />
                <div className="pb-1">
                  <h1 className="font-serif text-2xl font-semibold text-foreground">{displayName}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pb-1">
                <Link
                  href="/profile/upload"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" />
                  上傳作品
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm border border-border text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    登出
                  </button>
                </form>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
              {[
                { label: '我的作品', value: myArtworks.length, icon: Package },
                { label: '購買紀錄', value: orderCount, icon: ShoppingBag },
                { label: '會員等級', value: 'Standard', icon: Edit3 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="flex justify-center mb-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-serif font-semibold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── My Artworks ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">我的典藏</p>
              <h2 className="font-serif text-xl font-semibold text-foreground">已發布的作品</h2>
            </div>
            <Link
              href="/profile/upload"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              新增作品
            </Link>
          </div>

          {myArtworks.length === 0 ? (
            <div className="border border-dashed border-border/60 rounded-sm p-16 text-center bg-white/40">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm font-medium text-muted-foreground">還沒有發布任何作品</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-5">上傳您的創作，讓更多人欣賞</p>
              <Link
                href="/profile/upload"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                立即上傳第一件作品
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="group relative bg-white/70 border border-border/50 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-stone-50 overflow-hidden relative">
                    {artwork.preview_file_url ? (
                      <Image
                        src={artwork.preview_file_url}
                        alt={artwork.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-stone-300" />
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-sm border ${
                        artwork.art_type === 'physical'
                          ? 'bg-amber-50/90 text-amber-700 border-amber-200'
                          : 'bg-blue-50/90 text-blue-700 border-blue-200'
                      }`}>
                        {artwork.art_type === 'physical' ? '實體' : '數位'}
                      </span>
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link
                        href={`/artwork/${artwork.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-sm text-xs font-semibold text-foreground hover:bg-white transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看
                      </Link>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-serif font-semibold text-sm text-foreground line-clamp-1">{artwork.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {artwork.price && (
                          <p className="text-xs text-muted-foreground">
                            買斷 <span className="font-semibold text-foreground">{formatPrice(artwork.price)}</span>
                          </p>
                        )}
                        {artwork.is_rentable && artwork.monthly_rent_price && (
                          <p className="text-xs text-indigo-600 font-medium">月租 {formatPrice(artwork.monthly_rent_price)}</p>
                        )}
                        {!artwork.price && !artwork.is_rentable && (
                          <p className="text-xs text-muted-foreground italic">未定價</p>
                        )}
                      </div>
                      <Link
                        href={`/artwork/${artwork.id}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/gallery"
            className="flex items-center gap-4 p-5 bg-white/60 backdrop-blur-sm border border-border/50 rounded-sm hover:bg-white/80 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border flex-shrink-0">
              <Eye className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">探索藝廊</p>
              <p className="text-xs text-muted-foreground font-light">瀏覽所有作品</p>
            </div>
          </Link>
          <Link
            href="/profile/upload"
            className="flex items-center gap-4 p-5 bg-white/60 backdrop-blur-sm border border-border/50 rounded-sm hover:bg-white/80 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border flex-shrink-0">
              <Upload className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">上傳新作品</p>
              <p className="text-xs text-muted-foreground font-light">發布到藝廊販售</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
