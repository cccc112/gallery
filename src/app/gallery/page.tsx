import Link from 'next/link';
import { sql } from '@/lib/db';
import { Search, Eye, Tag, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export const revalidate = 0;

interface GalleryPageProps {
  searchParams: {
    search?: string;
    type?: string;
    rentable?: string;
  };
}

const TYPE_TABS = [
  { value: 'all',         label: '全部' },
  { value: 'physical',    label: '實體' },
  { value: 'digital',     label: '數位' },
  { value: 'photography', label: '攝影' },
];

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const search = searchParams.search || '';
  const type = searchParams.type || 'all';
  const rentable = searchParams.rentable === 'true';

  let artworks: any[] = [];
  try {
    artworks = await sql`
      SELECT a.*, u.display_name as artist_name 
      FROM public.artworks a
      JOIN public.users u ON a.artist_id = u.id
      WHERE 
        (a.title ILIKE ${'%' + search + '%'} OR a.description ILIKE ${'%' + search + '%'})
        AND (${type} = 'all' OR a.art_type = ${type})
        AND (${rentable} = false OR a.is_rentable = true)
      ORDER BY a.created_at DESC
    `;
  } catch (error) {
    console.error('Failed to query artworks:', error);
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '僅供租賃';
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // 建構帶 type 的搜尋 URL（保留其他 params）
  function typeUrl(t: string) {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (t !== 'all') p.set('type', t);
    if (rentable) p.set('rentable', 'true');
    const qs = p.toString();
    return `/gallery${qs ? `?${qs}` : ''}`;
  }

  const badgeStyle = (artType: string) => {
    if (artType === 'physical') return 'bg-amber-50/90 text-amber-700 border-amber-200';
    if (artType === 'photography') return 'bg-violet-50/90 text-violet-700 border-violet-200';
    return 'bg-blue-50/90 text-blue-700 border-blue-200';
  };
  const badgeLabel = (artType: string) => {
    if (artType === 'physical') return '實體';
    if (artType === 'photography') return '攝影';
    return '數位';
  };

  return (
    <div className="marble-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground sm:text-4xl animate-fade-in">
            探索典藏作品
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-light">
            尋覓、收藏與短期租賃當代畫作，體驗實體與數位的極致之美。
          </p>
        </div>

        {/* ── 篩選區塊 ── */}
        <div className="bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-border/80 mb-10 shadow-sm space-y-3">
          {/* Type Tab Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mr-1">類型</span>
            {TYPE_TABS.map(tab => {
              const isActive = type === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={typeUrl(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${
                    isActive
                      ? 'bg-foreground text-background border-foreground shadow-sm'
                      : 'bg-white/70 text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {isActive && type !== 'all' && (
                    <span className="ml-1.5 opacity-60 text-[9px]">✓</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search + 租賃 + 送出 */}
          <form method="GET" action="/gallery" className="flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="type" value={type} />
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="搜尋作品名稱、藝術家..."
                className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer self-center">
              <input
                type="checkbox"
                name="rentable"
                value="true"
                defaultChecked={rentable}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              僅顯示可租賃
            </label>
            <button
              type="submit"
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <SlidersHorizontal className="h-4 w-4" />
              搜尋
            </button>
          </form>

          {/* 當前篩選標示 */}
          {(type !== 'all' || rentable || search) && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground">目前篩選：</span>
              {type !== 'all' && (
                <span className="text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-medium">
                  {TYPE_TABS.find(t => t.value === type)?.label}
                </span>
              )}
              {rentable && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  可租賃
                </span>
              )}
              {search && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  「{search}」
                </span>
              )}
              <Link href="/gallery" className="text-[10px] text-muted-foreground hover:text-rose-500 underline ml-auto transition-colors">
                清除全部
              </Link>
            </div>
          )}
        </div>

        {/* Grid */}
        {artworks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border bg-card/25 rounded-xl">
            <Tag className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">沒有找到符合條件的藝術品</p>
            <Link href="/gallery" className="text-primary hover:underline text-sm mt-2 inline-block font-medium">
              重設篩選條件
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artworks.map((artwork: any, i: number) => (
              <div
                key={artwork.id}
                className="group relative flex flex-col overflow-hidden bg-card rounded-sm shadow-md hover:shadow-xl transition-all duration-300 border border-border/40"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animation: 'fadeInUp 0.5s ease both',
                }}
              >
                {/* Image */}
                <div className="aspect-[4/5] w-full bg-stone-50 overflow-hidden relative">
                  <div className="absolute inset-0 p-3 flex items-center justify-center">
                    <div className="relative w-full h-full border border-stone-200/60 shadow-md bg-white overflow-hidden">
                      <Image
                        src={artwork.preview_file_url}
                        alt={artwork.title}
                        fill
                        sizes="(max-w-xs) 100vw, 30vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="absolute top-5 left-5 flex gap-2 z-10">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 border ${badgeStyle(artwork.art_type)}`}
                    >
                      {badgeLabel(artwork.art_type)}
                    </Badge>
                    {artwork.is_rentable && (
                      <Badge className="bg-emerald-600/90 text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 border-transparent">
                        可租用
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-5 bg-card border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
                    {artwork.artist_name}
                  </p>
                  <h3 className="mt-1.5 text-base font-serif font-semibold text-foreground leading-tight line-clamp-1">
                    {artwork.title}
                  </h3>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-end justify-between">
                    <div>
                      {artwork.price ? (
                        <p className="text-xs text-muted-foreground">
                          買斷: <span className="text-sm font-bold text-foreground font-mono">{formatPrice(Number(artwork.price))}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">非賣品</p>
                      )}
                      {artwork.is_rentable && (
                        <p className="text-xs text-indigo-900 font-medium mt-0.5 font-mono">
                          月租: {formatPrice(Number(artwork.monthly_rent_price))}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/artwork/${artwork.id}`}
                      className="rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground border border-border p-2.5 text-foreground transition-all shadow-xs"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 入場動畫 keyframe */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.6s ease both; }
      `}</style>
    </div>
  );
}
