'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ImageIcon, ArrowRight, Trash2 } from 'lucide-react';

interface FavoriteArtwork {
  artwork_id: string;
  artworks: {
    id: string;
    title: string;
    preview_file_url: string;
    price: number | null;
    is_rentable: boolean;
    monthly_rent_price: number | null;
    art_type: string;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/favorites')
      .then(r => r.json())
      .then(d => {
        if (d.favorites) setFavorites(d.favorites);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(artworkId: string) {
    setRemoving(artworkId);
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artwork_id: artworkId }),
    });
    setFavorites(prev => prev.filter(f => f.artwork_id !== artworkId));
    setRemoving(null);
  }

  return (
    <div className="marble-bg min-h-screen py-10 px-4 md:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-rose-50/50 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-50/40 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
            ← 返回後台
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-10 w-10 rounded-sm bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">我的最愛</h1>
              <p className="text-xs text-muted-foreground mt-0.5">收藏喜愛的作品，隨時回來購買或租賃</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-sm bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 bg-white/50 border border-border/40 rounded-sm">
            <Heart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-2">還沒有收藏任何作品</p>
            <p className="text-xs text-muted-foreground/60 mb-6">在藝廊瀏覽時點擊愛心即可收藏</p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              探索藝廊 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-5">共 {favorites.length} 件收藏</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map(({ artwork_id, artworks: a }) => (
                <div key={artwork_id} className="group relative">
                  <Link href={`/artwork/${artwork_id}`}>
                    <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-stone-100 border border-border/30 shadow-sm hover:shadow-md transition-all duration-300">
                      {a.preview_file_url ? (
                        <Image
                          src={a.preview_file_url}
                          alt={a.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                          draggable={false}
                          onContextMenu={e => e.preventDefault()}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-stone-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white text-xs font-serif font-medium line-clamp-1">{a.title}</p>
                        <p className="text-white/80 text-[10px] mt-0.5">
                          {a.price !== null ? fmt(Number(a.price)) : `月租 ${fmt(Number(a.monthly_rent_price))}`}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(artwork_id)}
                    disabled={removing === artwork_id}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 border border-border/40 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:border-rose-200 disabled:opacity-50"
                    title="移除收藏"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </button>

                  <div className="mt-2 px-0.5">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.art_type === 'digital' ? '數位' : '實體'} ·{' '}
                      {a.price !== null ? fmt(Number(a.price)) : `月租 ${fmt(Number(a.monthly_rent_price))}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
