import { sql } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShieldCheck, Gift, HelpCircle, Eye, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  let artworks: any[] = [];
  let totalCount = 0;
  let physicalCount = 0;
  let rentableCount = 0;

  try {
    artworks = await sql`
      SELECT a.*, u.display_name as artist_name
      FROM public.artworks a
      JOIN public.users u ON a.artist_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `;
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE art_type = 'physical') as physical,
        COUNT(*) FILTER (WHERE is_rentable = true) as rentable
      FROM public.artworks
    `;
    totalCount = Number(stats[0]?.total || 0);
    physicalCount = Number(stats[0]?.physical || 0);
    rentableCount = Number(stats[0]?.rentable || 0);
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="marble-bg min-h-screen">

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36">
        {/* Decorative background veins */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-50/60 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-medium tracking-widest uppercase border-border text-muted-foreground bg-white/60 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-1.5 inline" />
              雙軌制 · 買賣 & 短期租賃
            </Badge>

            <h1 className="font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance leading-[1.1]">
              Atelier Blanc
            </h1>
            <p className="mt-4 text-base lg:text-lg font-light text-muted-foreground tracking-wider">
              乙太線上藝廊
            </p>
            <p className="mt-8 text-base lg:text-lg text-foreground/70 font-light leading-relaxed max-w-xl mx-auto">
              精選頂尖當代藝術品，支援安全買斷收藏與靈活短期租賃。
              讓藝術走入每一個生活空間，無論實體或數位。
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 group"
              >
                探索全部作品
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/gallery?rentable=true"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-white/70 backdrop-blur-sm px-8 py-3.5 text-sm font-semibold tracking-wide text-foreground hover:bg-white transition-all duration-300"
              >
                瀏覽可租賃作品
              </Link>
            </div>
          </div>

          {/* Stats row */}
          {totalCount > 0 && (
            <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { label: '典藏作品', value: totalCount },
                { label: '實體畫作', value: physicalCount },
                { label: '支援租賃', value: rentableCount },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-serif font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-xs font-medium tracking-widest uppercase text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Artworks ── */}
      {artworks.length > 0 && (
        <section className="py-16 lg:py-24 border-t border-border/40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">精選典藏</p>
                <h2 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-foreground">
                  本季主打作品
                </h2>
              </div>
              <Link
                href="/gallery"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                瀏覽全部
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {artworks.map((artwork) => (
                <article
                  key={artwork.id}
                  className="group relative flex flex-col bg-card rounded-sm overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/30"
                >
                  <Link href={`/artwork/${artwork.id}`} className="block">
                    {/* Image */}
                    <div className="aspect-[4/5] bg-stone-50 overflow-hidden relative">
                      <div className="absolute inset-0 p-4 flex items-center justify-center">
                        <div className="relative w-full h-full border border-stone-200/60 shadow-sm bg-white overflow-hidden">
                          {artwork.preview_file_url ? (
                            <Image
                              src={artwork.preview_file_url}
                              alt={artwork.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                              <span className="text-xs text-stone-400 tracking-widest uppercase">Artwork</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-5 left-5 flex gap-1.5 z-10">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 border ${
                            artwork.art_type === 'physical'
                              ? 'bg-amber-50/90 text-amber-700 border-amber-200'
                              : 'bg-blue-50/90 text-blue-700 border-blue-200'
                          }`}
                        >
                          {artwork.art_type === 'physical' ? '實體' : '數位'}
                        </Badge>
                        {artwork.is_rentable && (
                          <Badge className="bg-emerald-600/90 text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 border-transparent">
                            可租用
                          </Badge>
                        )}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
                        <span className="flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Eye className="h-3.5 w-3.5" />
                          查看詳情
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
                        {artwork.artist_name}
                      </p>
                      <h3 className="mt-1.5 text-base font-serif font-semibold text-foreground leading-tight line-clamp-1">
                        {artwork.title}
                      </h3>
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-end justify-between">
                        <div>
                          {artwork.price && (
                            <p className="text-xs text-muted-foreground">
                              買斷{' '}
                              <span className="text-sm font-bold text-foreground font-mono">
                                {formatPrice(Number(artwork.price))}
                              </span>
                            </p>
                          )}
                          {artwork.is_rentable && artwork.monthly_rent_price && (
                            <p className="text-xs text-indigo-700 font-medium mt-0.5 font-mono">
                              月租 {formatPrice(Number(artwork.monthly_rent_price))}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <div className="sm:hidden mt-8 text-center">
              <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                瀏覽全部作品
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {artworks.length === 0 && (
        <section className="py-24 border-t border-border/40">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-muted-foreground font-light mb-4">藝廊目前尚無典藏作品</p>
            <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
              前往管理後台新增作品 →
            </Link>
          </div>
        </section>
      )}

      {/* ── Brand Values ── */}
      <section className="py-16 lg:py-24 border-t border-border/40 bg-stone-50/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">為何選擇 Atelier Blanc</p>
            <h2 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-foreground">
              極致尊榮的藝術雙軌體驗
            </h2>
            <p className="mt-4 text-sm text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
              結合頂級藝廊品味與靈活金融授權，讓藝術收藏不再遙不可及。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Stripe 預授權押金保障',
                desc: '租賃期間只凍結押金額度不扣款，歸還藝術品後額度立即釋放，零財務風險。',
              },
              {
                icon: Gift,
                title: '實體與數位雙軌典藏',
                desc: '實體作品享專人運送與安裝保險；數位作品獲加密私有連結，可串流展示於高解析螢幕。',
              },
              {
                icon: HelpCircle,
                title: '藝術顧問專屬諮詢',
                desc: '資深藝術顧問團隊提供線上評估，為您的空間量身打造客製化布置方案。',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-8 bg-white/60 backdrop-blur-sm rounded-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border mb-5">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-3">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-light">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 lg:py-24 border-t border-border/40">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-foreground mb-4">
            準備好開啟您的收藏之旅？
          </h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
            無論是買斷永久珍藏，還是短期租用點綴空間，Atelier Blanc 都能滿足您的需求。
          </p>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-10 py-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 group"
          >
            立即探索典藏作品
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

    </div>
  );
}
