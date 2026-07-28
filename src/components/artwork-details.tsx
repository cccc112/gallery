'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Truck, Shield, RotateCcw, Box, Lock, RefreshCw, CreditCard, LogIn, Camera, Trash2, MessageSquare, Eye, Heart, Share2 } from "lucide-react"
import { CheckoutModal } from '@/components/CheckoutModal';
import { ArtworkChatModal } from '@/components/ArtworkChatModal';
import { useTranslations } from 'next-intl';

interface ArtworkDetailsProps {
  artwork: {
    id: string;
    title: string;
    artist_id: string;
    artist_name: string;
    artist_email?: string;
    art_type: 'physical' | 'digital' | 'photography';
    theme?: string | null;
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
    artist_avatar?: string;
    views_count?: number;
    likes_count?: number;
    is_ai_generated?: boolean;
  }
}

export function ArtworkDetails({
  artwork,
  isLoggedIn = false,
  isSold = false,
  isRented = false,
  isOwner = false,
  isPurchased = false,
  currentUserId = '',
}: ArtworkDetailsProps & { isLoggedIn?: boolean; isSold?: boolean; isRented?: boolean; isOwner?: boolean; isPurchased?: boolean; currentUserId?: string }) {
  const router = useRouter();
  const t = useTranslations('ArtworkDetails');
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: t('shareText', { artistName: artwork.artist_name, title: artwork.title }),
          url: url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(t('copySuccess'));
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/download/${artwork.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('downloadFailed'));
      
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };


  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    const res = await fetch(`/api/artworks/${artwork.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert(t('deleteSuccess'));
      router.push('/profile/upload');
      router.refresh();
    } else {
      alert(data.error || t('deleteFailed'));
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
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
          {artwork.artist_avatar && (
            <img src={artwork.artist_avatar} alt={artwork.artist_name} className="w-6 h-6 rounded-full object-cover border border-border" />
          )}
          {artwork.artist_name}
        </p>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif font-semibold tracking-tight text-foreground text-balance leading-tight">
          {artwork.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{isPhysical ? t('physicalSub') : isPhotography ? t('photographySub') : t('digitalSub')}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {artwork.views_count || 0}</span>
            <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {artwork.likes_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {artwork.theme && (
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium tracking-wide border-primary/30 text-primary bg-primary/5">
            ✨ {artwork.theme}
          </Badge>
        )}
        {artwork.is_ai_generated ? (
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium tracking-wide border-purple-300 text-purple-700 bg-purple-50/50">
            {t('aiArt')}
          </Badge>
        ) : (
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium tracking-wide border-amber-300 text-amber-700 bg-amber-50/50">
            {t('originalArt')}
          </Badge>
        )}
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
            {t('supportRent')}
          </Badge>
        )}
        {(isPhysical || isPhotography) && (
          <Badge variant="outline" className={`px-3 py-1 text-xs font-medium tracking-wide ${hasStock ? 'text-emerald-700 border-emerald-200 bg-emerald-50/30' : 'text-rose-700 border-rose-200 bg-rose-50/30'}`}>
            {hasStock ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {t('available')} ({artwork.stock} {t('pieces')})
              </span>
            ) : (
              t('soldOutBadge')
            )}
          </Badge>
        )}
      </div>

      {/* Pricing display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-border">
        {artwork.price !== null && (
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('buyPrice')}
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {formatPrice(Number(artwork.price))}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('oneTimePayment')}
            </p>
          </div>
        )}
        {artwork.is_rentable && artwork.art_type === 'physical' && artwork.monthly_rent_price !== null && (
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('monthlyRentPrice')}
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground text-indigo-900 dark:text-indigo-200">
              {formatPrice(Number(artwork.monthly_rent_price))} <span className="text-xs font-normal">{t('perMonth')}</span>
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300">
              {t('depositAmount')}{formatPrice(Number(artwork.deposit_amount))} {t('depositNote')}
            </p>
          </div>
        )}
      </div>

      {/* Dimensions & Specifications */}
      {isPhysical ? (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Box className="h-4 w-4 text-primary" />
            {t('physicalSpecs')}
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm bg-secondary/30 p-4 rounded-lg border border-border/60">
            <div>
              <dt className="text-xs text-muted-foreground">{t('dimensions')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {Number(artwork.width)} × {Number(artwork.height)} {artwork.depth ? `× ${Number(artwork.depth)}` : ''} cm
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('weight')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.weight ? `${Number(artwork.weight)} kg` : t('notSpecified')}
              </dd>
            </div>
          </dl>
        </div>
      ) : isPhotography ? (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-violet-600" />
            {t('photographySpecs')}
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm bg-violet-50/40 p-4 rounded-lg border border-violet-200/50">
            <div>
              <dt className="text-xs text-muted-foreground">{t('printSize')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.width && artwork.height
                  ? `${Number(artwork.width)} × ${Number(artwork.height)} cm`
                  : t('notSpecified')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('editionSize')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.edition_size ? t('limitedEdition', { count: artwork.edition_size }) : t('unlimitedEdition')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('printMaterial')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.print_material || t('notSpecified')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('stock')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {artwork.stock !== null ? t('countPieces', { count: artwork.stock }) : t('notSpecified')}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" />
            {t('digitalProtection')}
          </p>
          <div className="text-sm bg-secondary/30 p-4 rounded-lg border border-border/60 text-muted-foreground leading-relaxed">
            {t('digitalProtectionDesc')}
          </div>
        </div>
      )}

      {/* About description */}
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase mb-3">
          {t('artworkIntro')}
        </p>
        <p className="text-base leading-relaxed text-foreground/80 font-light">
          {artwork.description}
        </p>
      </div>



      {/* Action Buttons */}
      {isOwner ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">{t('yourArtwork')}</p>
            <p className="text-xs text-primary/70 mt-0.5">{t('cantBuyOwn')}</p>
          </div>
        </div>
      ) : isPurchased && !isPhysical ? (
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-3 px-5 py-4 rounded-lg bg-green-50 border border-green-200">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">{t('alreadyPurchased')}</p>
              <p className="text-xs text-green-600 mt-0.5">{t('thanksSupportDownload')}</p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full h-14 text-base font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md flex items-center justify-center gap-2"
          >
            <Box className="h-4 w-4" /> {t('downloadHighRes')}
          </Button>
        </div>
      ) : (isSold || isRented) && (!isPhysical || artwork.stock === 0) ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-lg bg-rose-50 border border-rose-200">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              {isSold ? t('soldOutTradeSuspended') : t('rentedTradeSuspended')}
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              {isSold ? t('soldOutDesc') : t('rentedDesc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {artwork.price !== null && (
            <div className="flex-1 flex flex-col gap-2">
              {isPurchased && isPhysical && (
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {t('alreadyPurchasedReminder')}
                </div>
              )}
              <Button
                onClick={() => openCheckout('buy')}
                disabled={!hasStock}
                size="lg"
                className="w-full h-14 text-base font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {!isLoggedIn ? (
                  <><LogIn className="h-4 w-4" /> {t('loginToBuy')}</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> {hasStock ? t('buyNow') : t('outOfStockBtn')}</>
                )}
              </Button>
            </div>
          )}

          {artwork.is_rentable && artwork.art_type === 'physical' && (
            <Button
              onClick={() => openCheckout('rent')}
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-base font-semibold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center gap-2"
            >
              {!isLoggedIn ? (
                <><LogIn className="h-4 w-4" /> {t('loginToRent')}</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> {t('rentNow')}</>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {isOwner ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? t('deleting') : t('deleteArtwork')}
          </button>
        ) : (
          <button
            onClick={handleContactArtist}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-foreground hover:bg-stone-100 border border-border/60 rounded-lg py-2.5 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t('askArtist')}
          </button>
        )}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-foreground hover:bg-stone-100 border border-border/60 rounded-lg py-2.5 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          {t('shareArtwork')}
        </button>
      </div>

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
        artistName={artwork.artist_name || '藝術家'}
        currentUserId={currentUserId}
      />

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <Truck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{t('transportation')}</p>
            <p className="text-[10px] text-muted-foreground">{t('transportationDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{t('originalGuarantee')}</p>
            <p className="text-[10px] text-muted-foreground">{t('originalGuaranteeDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/40">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{t('sevenDays')}</p>
            <p className="text-[10px] text-muted-foreground">{t('sevenDaysDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
