import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Fingerprint, Calendar, User, FileImage, Link as LinkIcon } from 'lucide-react';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { fingerprint: string } }): Promise<Metadata> {
  return {
    title: `數位真品保證書 (CoA) | Atelier Blanc`,
    description: `驗證藝術品的真實性與獨特性`,
  };
}

export default async function CertificatePage({ params }: { params: { fingerprint: string } }) {
  const supabase = createClient();
  
  // 查詢藝術品與創作者資料
  const { data: artwork } = await supabase
    .from('artworks')
    .select(`
      *,
      artist:users!artworks_artist_id_fkey (
        full_name,
        email
      )
    `)
    .eq('fingerprint', params.fingerprint)
    .single();

  if (!artwork) {
    notFound();
  }

  const artTypeMap: Record<string, string> = {
    physical: '實體藝術品 (Physical Art)',
    digital: '數位授權藝術 (Digital Art)',
    photography: '攝影作品 (Photography)'
  };

  const createDate = new Date(artwork.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 py-16 px-6 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-stone-800/30 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href={`/artwork/${artwork.id}`}
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-100 mb-8 transition-colors text-sm uppercase tracking-widest font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          返回作品頁面
        </Link>

        {/* 憑證卡片 */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800/80 rounded-2xl p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* 金色邊框裝飾 */}
          <div className="absolute inset-4 border border-stone-700/30 rounded-xl pointer-events-none" />
          
          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-900/20 border border-yellow-700/30 mb-6 text-yellow-600 shadow-[0_0_30px_rgba(180,83,9,0.2)]">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-stone-100 mb-4 tracking-wide">
              數位真品保證書
            </h1>
            <p className="text-stone-400 text-sm md:text-base font-light tracking-widest uppercase">
              Certificate of Authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 左側：預覽圖與 Hash */}
            <div className="space-y-6">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={artwork.preview_file_url} 
                  alt={artwork.title}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              
              <div className="bg-stone-950 p-5 rounded-xl border border-stone-800 break-all shadow-inner">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <Fingerprint className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">數位指紋 (SHA-256 Hash)</span>
                </div>
                <p className="text-stone-300 font-mono text-sm leading-relaxed">
                  {artwork.fingerprint}
                </p>
              </div>
            </div>

            {/* 右側：詳細資訊 */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-stone-100 mb-2">{artwork.title}</h2>
                <div className="inline-block px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-xs text-stone-300 tracking-wider">
                  {artTypeMap[artwork.art_type] || artwork.art_type}
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4 pb-5 border-b border-stone-800">
                  <User className="w-5 h-5 text-stone-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-1">創作者 / Artist</p>
                    <p className="text-stone-200 text-lg">{artwork.artist?.full_name || 'Anonymous'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-5 border-b border-stone-800">
                  <Calendar className="w-5 h-5 text-stone-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-1">發行時間 / Minted At</p>
                    <p className="text-stone-200">{createDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-5 border-b border-stone-800">
                  <FileImage className="w-5 h-5 text-stone-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-1">作品規格 / Specifications</p>
                    {artwork.art_type === 'physical' && (
                      <p className="text-stone-200">{artwork.width}x{artwork.height}{artwork.depth ? `x${artwork.depth}` : ''} cm, {artwork.weight} kg</p>
                    )}
                    {artwork.art_type === 'photography' && (
                      <p className="text-stone-200">
                        {artwork.width}x{artwork.height} cm
                        {artwork.print_material ? ` (${artwork.print_material})` : ''}
                        {artwork.edition_size ? ` - 限量 ${artwork.edition_size} 版` : ''}
                      </p>
                    )}
                    {artwork.art_type === 'digital' && (
                      <p className="text-stone-200">高解析度數位原始檔 (High-Resolution Digital File)</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  本憑證透過加密演算法產生唯一數位指紋，確保該藝術品的來源與資料真實性。此指紋與 Atelier Blanc 平台資料庫永久連動，任何人皆可透過此頁面驗證真偽。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
