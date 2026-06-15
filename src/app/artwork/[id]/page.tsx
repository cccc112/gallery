import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArtworkGallery } from '@/components/artwork-gallery';
import { ArtworkDetails } from '@/components/artwork-details';
import { ArtistInfo } from '@/components/artist-info';
import { ArtworkGrid } from '@/components/artwork-grid';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 0;

interface ArtworkPageProps {
  params: { id: string };
}

// ── 動態 SEO Metadata ──────────────────────────────────────────
export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  try {
    const rows = await sql`
      SELECT a.title, a.description, a.price, a.art_type, a.preview_file_url,
             u.display_name AS artist_name
      FROM public.artworks a
      JOIN public.users u ON a.artist_id = u.id
      WHERE a.id = ${params.id}
      LIMIT 1
    `;
    if (!rows.length) return { title: '作品不存在' };

    const a = rows[0];
    const title = `${a.title} — ${a.artist_name || '藝術家'}`;
    const description = a.description
      ? `${a.description.slice(0, 120)}…`
      : `${a.artist_name || '藝術家'} 的精選${a.art_type === 'digital' ? '數位' : '實體'}作品。${
          a.price ? `售價 NT$${Number(a.price).toLocaleString()}。` : ''
        }`;
    const image = a.preview_file_url || '/og-default.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: [{ url: image, width: 1200, height: 900, alt: a.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: 'Atelier Blanc' };
  }
}



export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = params;

  // 取得登入狀態
  let isLoggedIn = false;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch { }

  let artwork: any = null;
  let otherArtworks: any[] = [];

  try {
    // 取得當前藝術品
    const results = await sql`
      SELECT a.*, u.display_name as artist_name, u.email as artist_email
      FROM public.artworks a
      JOIN public.users u ON a.artist_id = u.id
      WHERE a.id = ${id}
    `;
    
    if (results.length > 0) {
      artwork = results[0];
      
      // 取得藝術家其他作品
      otherArtworks = await sql`
        SELECT a.*, u.display_name as artist_name
        FROM public.artworks a
        JOIN public.users u ON a.artist_id = u.id
        WHERE a.id != ${id} AND a.artist_id = ${artwork.artist_id}
        LIMIT 4
      `;
    }
  } catch (error) {
    console.error('Failed to fetch artwork page data:', error);
  }

  if (!artwork) {
    return notFound();
  }

  // 模擬藝術家檔案資訊
  const artistInfo = {
    name: artwork.artist_name || "未知藝術家",
    bio: "陳畫家是一位備受矚目的當代藝術創作者，擅長將傳統媒材與現代主義線條相結合。其作品廣受多國私人藏家與美術館青睞。本季他為 Atelier Blanc 精選了這批雙軌制展出畫作。",
    image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${artwork.artist_name || 'artist'}`,
    location: "台灣 台北",
    artworksCount: otherArtworks.length + 1,
  };

  return (
    <div className="marble-bg min-h-screen">
      <section className="pt-10 pb-16 lg:pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/gallery" 
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回探索藝廊
          </Link>

          {/* Breadcrumb */}
          <nav className="mb-8 lg:mb-12">
            <ol className="flex items-center gap-2 text-xs font-light text-muted-foreground uppercase tracking-widest">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">首頁</Link>
              </li>
              <li className="text-muted-foreground/30">/</li>
              <li>
                <Link href="/gallery" className="hover:text-foreground transition-colors">經典收藏</Link>
              </li>
              <li className="text-muted-foreground/30">/</li>
              <li className="text-foreground font-medium">{artwork.title}</li>
            </ol>
          </nav>

          {/* Product Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-20">
            {/* Left: Gallery */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <ArtworkGallery
                images={[artwork.preview_file_url]}
                title={artwork.title}
                artworkId={artwork.id}
              />
            </div>

            {/* Right: Details */}
            <div>
              <ArtworkDetails artwork={artwork} isLoggedIn={isLoggedIn} />
            </div>
          </div>
        </div>
      </section>

      {/* Artist Section */}
      <ArtistInfo artist={artistInfo} />

      {/* Related Artworks */}
      {otherArtworks.length > 0 && (
        <ArtworkGrid 
          artworks={otherArtworks} 
          title="該藝術家的其他創作" 
          viewAllLink="/gallery"
        />
      )}
    </div>
  );
}
