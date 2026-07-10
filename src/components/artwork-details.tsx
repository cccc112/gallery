'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Truck, Shield, RotateCcw, Box, Lock, RefreshCw, CreditCard, LogIn, Camera, Trash2, MessageSquare } from "lucide-react"
import { CheckoutModal } from '@/components/CheckoutModal';
import { ArtworkChatModal } from '@/components/ArtworkChatModal';

interface ArtworkDetailsProps {
  artwork: {
    id: string;
    title: string;
    artist_id: string;
    artist_name: string;
    artist_email?: string;
    art_type: 'physical' | 'digital' | 'photography';
    price: number | null;
    is_rentable: boolean;
    monthly_rent_price: number | null;
    deposit_amount: number | null;
    width: number | null;
    height: number | null;
    depth: number | null;
    weight: number | null;
    stock: number | null;
    preview_file_url: string;
    high_res_file_url?: string;
    description: string;
    edition_size?: number | null;
    print_material?: string | null;
    fingerprint?: string | null;
  }
}

export function ArtworkDetails({
  artwork,
  isLoggedIn = false,
  isSold = false,
  isRented = false,
  isOwner = false,
  currentUserId = '',
}: ArtworkDetailsProps & { isLoggedIn?: boolean; isSold?: boolean; isRented?: boolean; isOwner?: boolean; currentUserId?: string }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'buy' | 'rent'>('buy');
  const [deleting, setDeleting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleContactArtist = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/artwork/${artwork.id}`);
      return;
    }
    setChatOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除此作品嗎？此操作無法復原。')) return;
    setDeleting(true);
    const res = await fetch(`/api/artworks/${artwork.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert('作品已刪除');
      router.push('/profile/upload');
      router.refresh();
    } else {
      alert(data.error || '刪除失敗');
      setDeleting(false);
    }
  };

  const openCheckout = (actionType: 'buy' | 'rent') => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/artwork/${artwork.id}`);
      return;
    }
    setModalAction(actionType);
    setModalOpen(true);
  };
  const formatPrice = (price: number | null) => {
    if (price === null) return '';
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isPhysical = artwork.art_type === 'physical';
  const isPhotography = artwork.art_type === 'photography';
  const hasStock = (!isPhysical && !isPhotography) || (artwork.stock !== null && artwork.stock > 0);

  return (
    <div className="space-y-8">
      {/* Artist & Title */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
          {artwork.artist_name}
        </p>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif font-semibold tracking-tight text-foreground text-balance leading-tight">
          {artwork.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isPhysical ? '實體創作品 · 獨一無二' : isPhotography ? '攝影藝術 · 限量沖印版' : '數位授權藝術 · 限量發行'}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className={`px-3 py-1 text-xs font-medium tracking-wide ${
          isPhotography
            ? 'bg-violet-50 text-violet-700 border border-violet-200'
            : isPhysical
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {isPhysical ? 'Physical Canvas' : isPhotography ? 'Photography Print' : 'Digital Release'}
        </Badge>
        {artwork.is_rentable && (
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium tracking-wide border-emerald-300 text-emerald-700 bg-emerald-50/50">
            支援短期租賃
          </Badge>
        )}
        {(isPhysical || isPhotography) && (
          <Badge variant="outline" className={`px-3 py-1 text-xs font-medium tracking-wide ${hasStock ? 'text-emerald-700 border-emerald-200 bg-emerald-50/30' : 'text-rose-700 border-rose-200 bg-rose-50/30'}`}>
            {hasStock ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Available ({artwork.stock} 件)
              </span>
            ) : (
              'Sold Out'
            )}
          </Badge>
        )}
      </div>

      {/* Pricing display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-border">
        {artwork.price !== null && (
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              買斷收藏價
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {formatPrice(Number(artwork.price))}
            </p>
            <p className="text-xs text-muted-foreground">
              一次付款，終身典藏
            </p>
          </div>
        )}
        {artwork.is_rentable && artwork.art_type === 'physical' && artwork.monthly_rent_price !== null && (
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              短期月租金
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground text-indigo-900 dark:text-indigo-200">
              {formatPrice(Number(artwork.monthly_rent_price))} <span className="text-xs font-normal">/ 月</span>
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300">
              押金額度：{formatPrice(Number(artwork.deposit_amount))} (預授權不扣款)
            </p>
          </div>
        )}
      </div>

      {/* Dimensions & Specifications */}
      {isPhysical ? (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Box className="h-4 w-4 text-primary" />
            實體作品規格
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm bg-secondary/30 p-4 rounded-lg border border-border/60">
            <div>
              <dt className="text-xs text-muted-foreground">作品尺寸 (寬 × 高 × 深)</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {Number(artwork.width)} × {Number(artwork.height)} {artwork.depth ? `× ${Number(artwork.depth)}` : ''} cm
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">重量</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.weight ? `${Number(artwork.weight)} kg` : '未載明'}
              </dd>
            </div>
          </dl>
        </div>
      ) : isPhotography ? (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-violet-600" />
            攝影作品規格
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm bg-violet-50/40 p-4 rounded-lg border border-violet-200/50">
            <div>
              <dt className="text-xs text-muted-foreground">沖印尺寸</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.width && artwork.height
                  ? `${Number(artwork.width)} × ${Number(artwork.height)} cm`
                  : '未載明'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">版數 (Edition)</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.edition_size ? `限量 ${artwork.edition_size} 張` : '不限版數'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">沖印材質</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.print_material || '未載明'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">庫存</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.stock !== null ? `${artwork.stock} 張` : '未載明'}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" />
            數位版權與下載保護
          </p>
          <div className="text-sm bg-secondary/30 p-4 rounded-lg border border-border/60 text-muted-foreground leading-relaxed">
            本畫作之高解析度無損原始檔 (.tif) 已加密託管。買斷或租用合約生效後，系統將在結帳成功頁面自動提供您的專屬安全下載連結。
          </div>
        </div>
      )}

      {/* About description */}
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-3">
          作品介紹
        </p>
        <p className="text-base leading-relaxed text-foreground/80 font-light">
          {artwork.description}
        </p>
      </div>

      {/* CoA Badge */}
      {artwork.fingerprint && (
        <a href={`/certificate/${artwork.fingerprint}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-yellow-700/30 bg-gradient-to-r from-yellow-900/10 to-yellow-600/5 hover:from-yellow-900/20 hover:to-yellow-600/10 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-900/20 flex items-center justify-center border border-yellow-700/30 text-yellow-600 shadow-[0_0_15px_rgba(180,83,9,0.15)] group-hover:scale-110 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-500">數位真品保證書 (CoA)</p>
              <p className="text-xs text-yellow-700/70 dark:text-yellow-600/70 font-mono mt-0.5">{artwork.fingerprint.slice(0, 16)}...</p>
            </div>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-yellow-700 dark:text-yellow-600 group-hover:text-yellow-800 dark:group-hover:text-yellow-500 transition-colors">
            驗證真偽 &rarr;
          </span>
        </a>
      )}

      {/* Action Buttons */}
      {(isSold || isRented) ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-lg bg-rose-50 border border-rose-200">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              {isSold ? '此作品已售出，暫停交易' : '此作品租賃中，暫停交易'}
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              {isSold ? '買斷交易已完成，作品已歸藏家收藏。' : '此作品目前租賃中，租期結束後可再次購買或租用。'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {artwork.price !== null && (
            <Button
              onClick={() => openCheckout('buy')}
              disabled={!hasStock}
              size="lg"
              className="flex-1 h-14 text-base font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {!isLoggedIn ? (
                <><LogIn className="h-4 w-4" /> 登入後收藏</>
              ) : (
                <><CreditCard className="h-4 w-4" /> {hasStock ? '立即收藏（買斷）' : '已售罄'}</>
              )}
            </Button>
          )}

          {artwork.is_rentable && artwork.art_type === 'physical' && (
            <Button
              onClick={() => openCheckout('rent')}
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-base font-semibold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center gap-2"
            >
              {!isLoggedIn ? (
                <><LogIn className="h-4 w-4" /> 登入後租用</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> 短期租用（月付方案）</>
              )}
            </Button>
          )}
        </div>
      )}

      {/* 藝術家刪除作品按鈕 */}
      {isOwner ? (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full mt-2 flex items-center justify-center gap-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg py-2.5 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? '刪除中...' : '刪除此作品'}
        </button>
      ) : (
        <button
          onClick={handleContactArtist}
          className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-foreground hover:bg-stone-100 border border-border/60 rounded-lg py-2.5 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          💬 詢問藝術家
        </button>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        artwork={artwork}
        actionType={modalAction}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Artwork Chat Modal */}
      <ArtworkChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        artworkId={artwork.id}
        artworkTitle={artwork.title}
        currentUserId={currentUserId}
      />

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <Truck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">藝術品安全運輸</p>
            <p className="text-[10px] text-muted-foreground">專業保險、全球精細包裝</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">原創保證</p>
            <p className="text-[10px] text-muted-foreground">附藝術家親筆簽名證書</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">14 天退換保證</p>
            <p className="text-[10px] text-muted-foreground">非數位商品享有猶豫期</p>
          </div>
        </div>
      </div>
    </div>
  );
}
