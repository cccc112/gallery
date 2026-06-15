'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { ZoomIn, Heart, ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArtworkGalleryProps {
  images: string[];
  title: string;
  artworkId?: string;
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
      <ImageIcon className="h-16 w-16 text-stone-400 mb-4" />
      <span className="text-sm font-medium tracking-wider text-stone-500 uppercase">{label}</span>
    </div>
  );
}

export function ArtworkGallery({ images, title, artworkId }: ArtworkGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imageUrl = images[currentImage] || '';

  // 載入時檢查是否已收藏
  useEffect(() => {
    if (!artworkId) return;
    fetch('/api/favorites')
      .then(r => r.json())
      .then(d => {
        if (d.favorites) {
          setIsLiked(d.favorites.some((f: any) => f.artwork_id === artworkId));
        }
      })
      .catch(() => {});
  }, [artworkId]);

  // 愛心 toggle
  async function handleLike() {
    if (!artworkId || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: artworkId }),
      });
      const d = await res.json();
      if (res.ok) setIsLiked(d.liked);
    } catch {}
    setLikeLoading(false);
  }

  // 燈箱鍵盤控制
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowLeft') setCurrentImage(p => Math.max(0, p - 1));
    if (e.key === 'ArrowRight') setCurrentImage(p => Math.min(images.length - 1, p + 1));
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // 燈箱開啟時鎖定 scroll
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  return (
    <>
      <div className="relative select-none">
        {/* Main Image Frame */}
        <div
          className="relative aspect-[4/5] lg:aspect-[3/4] bg-card rounded-sm overflow-hidden shadow-lg shadow-black/5 border border-border/40"
          onContextMenu={e => e.preventDefault()}
        >
          {!imageUrl || imageError ? (
            <ImagePlaceholder label="Artwork Placement" />
          ) : (
            <div className="relative w-full h-full p-4 sm:p-6 md:p-8 bg-stone-50/50 flex items-center justify-center">
              <div className="relative w-full h-full shadow-2xl shadow-black/10 border border-stone-200 overflow-hidden bg-white">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover transition-all duration-700 hover:scale-105 pointer-events-none"
                  sizes="(max-width: 1280px) 50vw, 640px"
                  priority
                  onError={() => setImageError(true)}
                  draggable={false}
                />
                {/* 浮水印 */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      -45deg,
                      transparent 0px, transparent 60px,
                      rgba(100,80,40,0.055) 60px, rgba(100,80,40,0.055) 61px
                    )`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-serif text-xl text-stone-600/20 tracking-[0.5em] uppercase select-none whitespace-nowrap"
                      style={{ transform: 'rotate(-30deg)' }}
                    >
                      Atelier Blanc · Preview Only
                    </span>
                  </div>
                </div>
                {/* 右鍵防護層 */}
                <div
                  className="absolute inset-0 z-20"
                  onContextMenu={e => e.preventDefault()}
                  onDragStart={e => e.preventDefault()}
                />
              </div>
            </div>
          )}

          {/* Top Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              disabled={likeLoading}
              className={`h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-md border border-border/40 transition-all ${
                isLiked ? 'border-rose-300 bg-rose-50/90' : ''
              }`}
              title={isLiked ? '已加入最愛' : '加入最愛'}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-200 ${
                  isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-foreground'
                }`}
              />
              <span className="sr-only">{isLiked ? '取消最愛' : '加入最愛'}</span>
            </Button>

            {imageUrl && !imageError && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxOpen(true)}
                className="h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-md border border-border/40 text-foreground"
                title="放大檢視"
              >
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">放大檢視</span>
              </Button>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`relative w-16 h-20 flex-shrink-0 rounded-sm overflow-hidden transition-all border ${
                  index === currentImage
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent'
                    : 'opacity-60 hover:opacity-100 border-border'
                }`}
              >
                <Image
                  src={image}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  className="object-cover pointer-events-none"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 燈箱 Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 標題 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest font-serif">
            {title}
          </div>

          {/* 上一張 */}
          {images.length > 1 && currentImage > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setCurrentImage(p => p - 1); }}
              className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* 圖片 */}
          <div
            className="relative max-w-[90vw] max-h-[88vh] w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.preventDefault()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[88vh] object-contain select-none pointer-events-none rounded-sm shadow-2xl"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
            {/* 燈箱內浮水印 */}
            <div
              className="absolute inset-0 pointer-events-none select-none flex items-end justify-end p-4"
            >
              <span className="text-white/20 text-xs font-serif tracking-widest">
                Atelier Blanc · Preview Only
              </span>
            </div>
          </div>

          {/* 下一張 */}
          {images.length > 1 && currentImage < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setCurrentImage(p => p + 1); }}
              className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* 指示點 */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setCurrentImage(i); }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentImage ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
