import Link from 'next/link';
import { sql } from '@/lib/db';
import { Search, Eye, Tag, SlidersHorizontal, X, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { AnimatedGrid, AnimatedCard } from '@/components/AnimatedGrid';
import { ProtectedImage } from '@/components/protected-image';
import GalleryForm from './GalleryForm';

export const revalidate = 0;

interface GalleryPageProps {
  searchParams: {
    search?: string;
    type?: string;
    theme?: string;
    rentable?: string;
    tag?: string | string[];
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
  const theme = searchParams.theme || 'all';
  const rentable = searchParams.rentable === 'true';
  const tagParam = searchParams.tag;
  const tags: string[] = tagParam ? (Array.isArray(tagParam) ? tagParam : [tagParam]) : [];

  let artworks: any[] = [];
  try {
    if (tags.length > 0) {
      artworks = await sql`
        SELECT a.*, u.display_name as artist_name,
               (SELECT count(*) FROM public.page_views WHERE artwork_id = a.id) as views_count,
               (SELECT count(*) FROM public.favorites WHERE artwork_id = a.id) as likes_count
        FROM public.artworks a
        JOIN public.users u ON a.artist_id = u.id
        WHERE 
          (${search} = '' OR a.title ILIKE ${'%' + search + '%'} OR a.description ILIKE ${'%' + search + '%'})
          AND a.tags @> ${tags}::text[]
          AND (${type} = 'all' OR a.art_type = ${type})
          AND (${theme} = 'all' OR a.theme = ${theme})
          AND (${rentable} = false OR a.is_rentable = true)
        ORDER BY a.created_at DESC
      `;
    } else {
      artworks = await sql`
        SELECT a.*, u.display_name as artist_name,
               (SELECT count(*) FROM public.page_views WHERE artwork_id = a.id) as views_count,
               (SELECT count(*) FROM public.favorites WHERE artwork_id = a.id) as likes_count
        FROM public.artworks a
        JOIN public.users u ON a.artist_id = u.id
        WHERE 
          (${search} = '' OR a.title ILIKE ${'%' + search + '%'} OR a.description ILIKE ${'%' + search + '%'})
          AND (${type} = 'all' OR a.art_type = ${type})
          AND (${rentable} = false OR a.is_rentable = true)
        ORDER BY a.created_at DESC
      `;
    }
  } catch (error) {
    console.error('Failed to query artworks:', error);
  }

  let popularTags: { tag: string, count: number }[] = [];
  try {
    const tagsResult = await sql`
      SELECT tag, count(*) as count
      FROM (
        SELECT unnest(tags) as tag
        FROM public.artworks
      ) t
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `;
    popularTags = tagsResult as any;
  } catch (error) {
    console.error('Failed to query tags:', error);
  }

  // If no tags in DB yet, show some default recommendations
  if (popularTags.length === 0) {
    popularTags = [
      { tag: '油畫', count: 0 },
      { tag: '抽象', count: 0 },
      { tag: '風景', count: 0 },
      { tag: '當代藝術', count: 0 },
      { tag: '賽博龐克', count: 0 },
      { tag: '極簡', count: 0 },
    ];
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
    tags.forEach(tg => p.append('tag', tg));
    const qs = p.toString();
    return `/gallery${qs ? `?${qs}` : ''}`;
  }

  function addTagUrl(newTag: string) {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (type !== 'all') p.set('type', type);
    if (theme !== 'all') p.set('theme', theme);
    if (rentable) p.set('rentable', 'true');
    tags.forEach(tg => p.append('tag', tg));
    if (!tags.includes(newTag)) p.append('tag', newTag);
    const qs = p.toString();
    return `/gallery${qs ? `?${qs}` : ''}`;
  }

  function removeFilterUrl(filterToRemove: 'type' | 'theme' | 'rentable' | 'search' | 'tag', tagValue?: string) {
    const p = new URLSearchParams();
    if (filterToRemove !== 'search' && search) p.set('search', search);
    if (filterToRemove !== 'type' && type !== 'all') p.set('type', type);
    if (filterToRemove !== 'rentable' && rentable) p.set('rentable', 'true');
    
    if (filterToRemove === 'tag' && tagValue) {
      tags.filter(t => t !== tagValue).forEach(t => p.append('tag', t));
    } else {
      tags.forEach(t => p.append('tag', t));
    }
    
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
          <GalleryForm search={search} type={type} rentable={rentable} tags={tags} />

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/40">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Tag className="h-3 w-3" /> 熱門標籤:
              </span>
              {popularTags.map(pt => (
                <Link
                  key={pt.tag}
                  href={addTagUrl(pt.tag)}
                  className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-sm border border-border transition-colors"
                >
                  #{pt.tag}
                </Link>
              ))}
            </div>
          )}

          {/* 當前篩選標示 */}
          {(type !== 'all' || theme !== 'all' || rentable || search || tags.length > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/40 flex-wrap mt-2">
              <span className="text-[10px] text-muted-foreground">目前篩選：</span>
              {type !== 'all' && (
                <Link href={removeFilterUrl('type')} className="group flex items-center gap-1 text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-medium hover:bg-foreground/20 transition-colors" title="移除類型篩選">
                  {TYPE_TABS.find(t => t.value === type)?.label}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </Link>
              )}
              {rentable && (
                <Link href={removeFilterUrl('rentable')} className="group flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium hover:bg-emerald-200 transition-colors" title="移除可租賃篩選">
                  可租賃
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </Link>
              )}
              {search && (
                <Link href={removeFilterUrl('search')} className="group flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium hover:bg-indigo-200 transition-colors" title="移除關鍵字篩選">
                  「{search}」
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </Link>
              )}
              {tags.map(tag => (
                <Link key={tag} href={removeFilterUrl('tag', tag)} className="group flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium hover:bg-rose-200 transition-colors" title={`移除標籤: ${tag}`}>
                  #{tag}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </Link>
              ))}
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
          <AnimatedGrid>
            {artworks.map((artwork: any) => (
              <AnimatedCard
                key={artwork.id}
                className="group relative flex flex-col overflow-hidden bg-card rounded-sm shadow-md hover:shadow-xl transition-all duration-300 border border-border/40"
              >
                {/* Image */}
                <Link href={`/artwork/${artwork.id}`} className="aspect-[4/5] w-full bg-stone-50 overflow-hidden relative block cursor-pointer">
                  <div className="absolute inset-0 p-3 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full border border-stone-200/60 shadow-md bg-white overflow-hidden pointer-events-auto">
                      <ProtectedImage
                        src={artwork.preview_file_url}
                        alt={artwork.title}
                        fill
                        sizes="(max-w-xs) 100vw, 30vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        showWatermark={true}
                        watermarkSize="sm"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="absolute top-5 left-5 flex flex-wrap gap-2 z-10 max-w-[80%]">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 border ${badgeStyle(artwork.art_type)}`}
                    >
                      {badgeLabel(artwork.art_type)}
                    </Badge>
                    {artwork.is_rentable && artwork.art_type === 'physical' && (
                      <Badge className="bg-emerald-600/90 text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 border-transparent">
                        可租用
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Custom Tags Display */}
                {artwork.tags && artwork.tags.length > 0 && (
                  <div className="px-5 pt-4 pb-1 flex flex-wrap gap-1.5 border-t border-border/30 bg-card">
                    {artwork.tags.map((tag: string) => (
                      <Link 
                        key={tag} 
                        href={addTagUrl(tag)}
                        className="text-[9px] bg-secondary/50 text-muted-foreground border border-border/50 px-2 py-0.5 rounded-sm hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

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
                      {artwork.is_rentable && artwork.art_type === 'physical' && (
                        <p className="text-xs text-indigo-900 font-medium mt-0.5 font-mono">
                          月租: {formatPrice(Number(artwork.monthly_rent_price))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2.5 items-center mr-1">
                        <div className="flex items-center gap-1 text-muted-foreground" title="瀏覽人次">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-medium">{artwork.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-500" title="收藏人數">
                          <Heart className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-medium">{artwork.likes_count}</span>
                        </div>
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
              </AnimatedCard>
            ))}
          </AnimatedGrid>
        )}
      </div>

    </div>
  );
}
