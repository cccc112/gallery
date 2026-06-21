'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ImageIcon, ZoomIn, X } from 'lucide-react';
import { ProtectedImage } from '@/components/protected-image';

interface Artwork {
  id: string;
  title: string;
  artist_name: string;
  price: number | null;
  is_rentable: boolean;
  monthly_rent_price: number | null;
  preview_file_url: string;
  art_type: 'physical' | 'digital' | 'photography';
  is_new?: boolean;
}

interface ArtworkGridProps {
  artworks: Artwork[];
  title: string;
  viewAllLink?: string;
}

// ── Lightbox ──────────────────────────────────────────────
interface LightboxProps {
  artwork: Artwork;
  onClose: () => void;
}

function Lightbox({ artwork, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* 深色背景 */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
        aria-label="關閉"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 圖片容器 */}
      <div
        className="relative z-10 max-w-4xl max-h-[85vh] w-full mx-4 flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 標題 */}
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-widest font-medium">{artwork.artist_name}</p>
          <h2 className="text-xl font-serif font-semibold text-white mt-1">{artwork.title}</h2>
        </div>

        {/* 防護圖片 */}
        <div
          className="relative w-full rounded-sm overflow-hidden shadow-2xl flex items-center justify-center"
          style={{ height: 'calc(85vh - 100px)' }}
        >
          <div className="relative aspect-square w-full h-full max-w-3xl">
            <ProtectedImage
              src={artwork.preview_file_url}
              alt={artwork.title}
              fill
              sizes="(max-width: 768px) 90vw, 70vw"
              className="object-contain"
              showWatermark={true}
              watermarkSize="lg"
              priority
            />
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-[10px] text-white/30 tracking-widest">
          按 ESC 或點擊空白處關閉 · © Atelier Blanc · Preview Only
        </p>
      </div>
    </div>
  );
}

// ── 單張卡片 ──────────────────────────────────────────────
interface ArtworkCardProps {
  artwork: Artwork;
  gridClass: string;
  aspectClass: string;
  formatPrice: (price: number | null) => string;
  onZoom: (artwork: Artwork) => void;
}

function ArtworkCard({ artwork, gridClass, aspectClass, formatPrice, onZoom }: ArtworkCardProps) {
  const [imageError, setImageError] = useState(false);

  const badgeStyle =
    artwork.art_type === 'digital'
      ? 'bg-blue-50/90 text-blue-700 border-blue-200'
      : artwork.art_type === 'photography'
      ? 'bg-violet-50/90 text-violet-700 border-violet-200'
      : 'bg-amber-50/90 text-amber-700 border-amber-200';

  const badgeLabel =
    artwork.art_type === 'digital' ? 'Digital'
    : artwork.art_type === 'photography' ? 'Photography'
    : 'Physical';

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  return (
    <motion.article variants={itemVariants} className={`group relative ${gridClass}`}>
      <div
        className={`relative ${aspectClass} bg-card rounded-sm overflow-hidden shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 border border-border/20`}
      >
        {imageError || !artwork.preview_file_url ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <ImageIcon className="h-10 w-10 text-stone-400 mb-2" />
            <span className="text-[10px] font-medium tracking-wider text-stone-500 uppercase">Artwork Placement</span>
          </div>
        ) : (
          <ProtectedImage
            src={artwork.preview_file_url}
            alt={artwork.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            showWatermark={true}
            watermarkSize="sm"
            onError={() => setImageError(true)}
          />
        )}

        {/* Hover 漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-30">
          {artwork.is_new && (
            <Badge className="bg-foreground text-background text-[10px] font-medium tracking-wider px-2 py-0.5">
              NEW
            </Badge>
          )}
          <Badge variant="secondary" className={`text-[10px] font-medium tracking-wider px-2 py-0.5 border ${badgeStyle}`}>
            {badgeLabel}
          </Badge>
          {artwork.is_rentable && (
            <Badge className="bg-emerald-600/90 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 border-transparent">
              可租賃
            </Badge>
          )}
        </div>

        {/* 右上角放大按鈕 */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onZoom(artwork);
          }}
          className="absolute top-3 right-3 z-40 h-8 w-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          aria-label={`放大預覽：${artwork.title}`}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        {/* Hover 資訊 */}
        <Link href={`/artwork/${artwork.id}`} className="absolute inset-0 z-30">
          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <p className="text-[10px] font-medium tracking-widest text-white/80 uppercase">
              {artwork.artist_name}
            </p>
            <h3 className="text-lg font-serif font-medium text-white mt-1 line-clamp-1">
              {artwork.title}
            </h3>
            <p className="text-sm font-semibold text-white/95 mt-1 font-mono">
              {artwork.price !== null
                ? formatPrice(Number(artwork.price))
                : `月租金 ${formatPrice(Number(artwork.monthly_rent_price))}`}
            </p>
          </div>
        </Link>
      </div>
    </motion.article>
  );
}

// ── 主元件 ────────────────────────────────────────────────
const GRID_CLASSES = [
  'lg:col-span-5 lg:row-span-2',
  'lg:col-span-4',
  'lg:col-span-3',
  'lg:col-span-4',
  'lg:col-span-3',
];
const ASPECT_CLASSES = [
  'aspect-[3/4]',
  'aspect-[4/3]',
  'aspect-square',
  'aspect-[4/3]',
  'aspect-square',
];

export function ArtworkGrid({ artworks, title, viewAllLink }: ArtworkGridProps) {
  const [lightboxArtwork, setLightboxArtwork] = useState<Artwork | null>(null);

  const closeLightbox = useCallback(() => setLightboxArtwork(null), []);

  const formatPrice = (price: number | null) => {
    if (price === null) return '僅供租賃';
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="hidden sm:flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors group"
            >
              瀏覽全部
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Asymmetric Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8"
        >
          {artworks.map((artwork, index) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              gridClass={GRID_CLASSES[index % 5]}
              aspectClass={ASPECT_CLASSES[index % 5]}
              formatPrice={formatPrice}
              onZoom={setLightboxArtwork}
            />
          ))}
        </motion.div>

        {viewAllLink && (
          <div className="sm:hidden mt-8 text-center">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              瀏覽全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Portal */}
      {lightboxArtwork && (
        <Lightbox artwork={lightboxArtwork} onClose={closeLightbox} />
      )}
    </section>
  );
}
