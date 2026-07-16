import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 使用 Supabase 連線抓取公開的作品與使用者，以生成動態 Sitemap
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 使用環境變數中的網址，避免 GSC 跨網域錯誤。若未設定則使用預設
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://art-gallery.vercel.app';
  // 建立 Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // 取得公開的藝術品
  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, updated_at')
    .eq('status', 'published');

  // 取得所有有作品的藝術家
  const { data: users } = await supabase
    .from('users')
    .select('id, updated_at')
    .eq('role', 'artist');

  // 靜態頁面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 藝術品動態頁面
  const artworkRoutes: MetadataRoute.Sitemap = (artworks || []).map((artwork) => ({
    url: `${baseUrl}/artwork/${artwork.id}`,
    lastModified: new Date(artwork.updated_at || new Date()),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // 藝術家動態頁面
  const artistRoutes: MetadataRoute.Sitemap = (users || []).map((user) => ({
    url: `${baseUrl}/artist/${user.id}`,
    lastModified: new Date(user.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...artworkRoutes, ...artistRoutes];
}
