import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, BookOpen, Briefcase, Globe, AtSign, Hash, ImageIcon } from 'lucide-react';

export const revalidate = 0;

interface ArtistPageProps {
  params: { userId: string };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  let artist: any = null;
  let artworks: any[] = [];

  try {
    const rows = await sql`SELECT * FROM public.users WHERE id = ${params.userId} LIMIT 1`;
    artist = rows[0] || null;

    artworks = await sql`
      SELECT * FROM public.artworks
      WHERE artist_id = ${params.userId}
      ORDER BY created_at DESC
    `;
  } catch (e) {
    console.error('Artist page fetch error:', e);
  }

  if (!artist) {
    return (
      <div className="marble-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">找不到此藝術家</p>
          <Link href="/gallery" className="mt-4 inline-block text-sm text-muted-foreground underline underline-offset-4">
            回藝廊
          </Link>
        </div>
      </div>
    );
  }

  const displayName = artist.display_name || '匿名藝術家';
  const avatarUrl = artist.avatar_url
    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(artist.email || params.userId)}`;

  const formatPrice = (p: any) =>
    p == null ? null : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(Number(p));

  return (
    <div className="marble-bg min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="h-48 lg:h-64 bg-gradient-to-r from-stone-200 via-amber-50 to-stone-100" />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-stone-100/60 to-transparent blur-3xl" />
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8 -mt-20 pb-20">
        {/* ── Profile Card ── */}
        <div className="bg-white/80 backdrop-blur-md border border-border/60 rounded-sm shadow-lg overflow-hidden mb-8">
          <div className="px-8 py-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-28 w-28 rounded-full border-4 border-white shadow-lg bg-stone-100 object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 pt-2">
                <h1 className="font-serif text-3xl font-semibold text-foreground">{displayName}</h1>
                {artist.role === 'artist' && (
                  <span className="inline-block mt-1 text-[10px] font-semibold tracking-widest uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    藝術家
                  </span>
                )}

                {/* Bio */}
                {artist.bio && (
                  <p className="mt-4 text-sm text-foreground/70 leading-relaxed max-w-2xl">
                    {artist.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {artist.website && (
                    <a href={artist.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Globe className="h-3.5 w-3.5" /> 個人網站
                    </a>
                  )}
                  {artist.instagram && (
                    <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <AtSign className="h-3.5 w-3.5" /> Instagram: {artist.instagram}
                    </a>
                  )}
                  {artist.twitter && (
                    <a href={`https://twitter.com/${artist.twitter}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Hash className="h-3.5 w-3.5" /> X: {artist.twitter}
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-5 flex gap-6">
                  <div className="text-center">
                    <p className="text-xl font-serif font-semibold text-foreground">{artworks.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">作品</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience / Story tabs section */}
          {(artist.experience || artist.story) && (
            <div className="border-t border-border/40 px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {artist.experience && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">創作歷程</h2>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">{artist.experience}</p>
                </div>
              )}
              {artist.story && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">創作故事</h2>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">{artist.story}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Artworks Grid ── */}
        <div>
          <div className="mb-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">作品集</p>
            <h2 className="font-serif text-xl font-semibold text-foreground">{displayName} 的創作</h2>
          </div>

          {artworks.length === 0 ? (
            <div className="border border-dashed border-border/60 rounded-sm p-16 text-center bg-white/40">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">尚未發布任何作品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artwork/${artwork.id}`}
                  className="group relative bg-white/70 border border-border/50 rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-[4/5] bg-stone-50 overflow-hidden relative">
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
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Eye className="h-3.5 w-3.5" /> 查看詳情
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-serif font-semibold text-sm text-foreground line-clamp-1">{artwork.title}</h3>
                    {artwork.price && (
                      <p className="text-xs text-muted-foreground mt-1">
                        買斷 <span className="font-semibold text-foreground">{formatPrice(artwork.price)}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
