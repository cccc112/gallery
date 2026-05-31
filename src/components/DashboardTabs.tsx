'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package, Palette, ShoppingBag, Clock, Download,
  TrendingUp, ImageIcon, Upload, ExternalLink,
  Coins, CreditCard, RotateCcw, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ── 型別定義 ────────────────────────────────────────────────────
interface OrderRow {
  id: string;
  artwork_id: string;
  amount: number;
  payment_status: string;
  stripe_payment_intent_id: string;
  created_at: string;
  title: string;
  art_type: string;
  preview_file_url: string | null;
  high_res_file_url: string | null;
}

interface RentalRow {
  id: string;
  artwork_id: string;
  monthly_rent: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  title: string;
  art_type: string;
  preview_file_url: string | null;
}

interface ArtworkRow {
  id: string;
  title: string;
  art_type: string;
  price: number | null;
  monthly_rent_price: number | null;
  stock: number;
  preview_file_url: string | null;
  is_rentable: boolean;
  created_at: string;
  order_count: number;
  rental_count: number;
  total_revenue: number;
}

interface DashboardTabsProps {
  orders: OrderRow[];
  rentals: RentalRow[];
  artworks: ArtworkRow[];
  totalFiatRevenue: number;
  totalCryptoRevenue: number;
}

// ── 工具函式 ────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });

const isCrypto = (txId: string | null) =>
  txId?.startsWith('0x') || txId?.startsWith('0xMOCK');

const isExpired = (endDate: string) => new Date(endDate) < new Date();
const daysLeft = (endDate: string) =>
  Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));

// ── 子元件 ──────────────────────────────────────────────────────
function ArtworkThumb({ url, title }: { url: string | null; title: string }) {
  return (
    <div className="h-14 w-14 rounded-sm border border-border/50 bg-stone-100 overflow-hidden flex-shrink-0 relative">
      {url ? (
        <Image src={url} alt={title} fill sizes="56px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-stone-300" />
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded-sm border ${
      type === 'physical'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {type === 'physical' ? '實體' : '數位'}
    </span>
  );
}

function PayBadge({ txId }: { txId: string | null }) {
  const crypto = isCrypto(txId);
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${
      crypto
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }`}>
      {crypto ? <Coins className="h-2.5 w-2.5" /> : <CreditCard className="h-2.5 w-2.5" />}
      {crypto ? 'USDC' : '信用卡'}
    </span>
  );
}

// ── My Collection Tab ────────────────────────────────────────────
function CollectionTab({ orders, rentals }: { orders: OrderRow[]; rentals: RentalRow[] }) {
  const [subTab, setSubTab] = useState<'orders' | 'rentals'>('orders');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {([['orders', `已購作品 (${orders.length})`, ShoppingBag], ['rentals', `租賃中 (${rentals.length})`, RotateCcw]] as const).map(
          ([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                subTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        )}
      </div>

      {/* Orders */}
      {subTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} label="尚無購買紀錄" action={{ href: '/gallery', text: '探索藝廊' }} />
          ) : (
            orders.map(o => (
              <div key={o.id} className="flex items-center gap-4 p-4 bg-white/60 border border-border/50 rounded-sm hover:bg-white/80 transition-colors">
                <ArtworkThumb url={o.preview_file_url} title={o.title} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
                    <TypeBadge type={o.art_type} />
                    <PayBadge txId={o.stripe_payment_intent_id} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtDate(o.created_at)} · {fmt(Number(o.amount))}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {o.art_type === 'digital' && o.high_res_file_url && (
                    <a
                      href={o.high_res_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      下載
                    </a>
                  )}
                  <Link
                    href={`/artwork/${o.artwork_id}`}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rentals */}
      {subTab === 'rentals' && (
        <div className="space-y-3">
          {rentals.length === 0 ? (
            <EmptyState icon={RotateCcw} label="尚無租賃紀錄" action={{ href: '/gallery', text: '探索可租賃作品' }} />
          ) : (
            rentals.map(r => {
              const expired = isExpired(r.end_date);
              const days = daysLeft(r.end_date);
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 bg-white/60 border border-border/50 rounded-sm hover:bg-white/80 transition-colors">
                  <ArtworkThumb url={r.preview_file_url} title={r.title} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                      <TypeBadge type={r.art_type} />
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                        expired
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : days <= 7
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {expired ? '已到期' : `剩 ${days} 天`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                      <span className="mx-1">·</span>月租 {fmt(Number(r.monthly_rent))}
                      <span className="mx-1">·</span>押金 {fmt(Number(r.deposit_amount))}
                    </p>
                  </div>
                  <Link href={`/artwork/${r.artwork_id}`} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Artist Center Tab ────────────────────────────────────────────
function ArtistTab({
  artworks, totalFiatRevenue, totalCryptoRevenue,
}: { artworks: ArtworkRow[]; totalFiatRevenue: number; totalCryptoRevenue: number }) {
  const totalRevenue = totalFiatRevenue + totalCryptoRevenue;
  const totalOrders = artworks.reduce((s, a) => s + Number(a.order_count), 0);
  const totalRentals = artworks.reduce((s, a) => s + Number(a.rental_count), 0);

  return (
    <div className="space-y-6">
      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '總收入', value: fmt(totalRevenue), icon: TrendingUp, color: 'text-emerald-600' },
          { label: '法幣收入', value: fmt(totalFiatRevenue), icon: CreditCard, color: 'text-blue-600', sub: '(信用卡)' },
          { label: 'USDC 收益', value: `≈ ${(totalCryptoRevenue * 0.031).toFixed(0)} USDC`, icon: Coins, color: 'text-purple-600', sub: fmt(totalCryptoRevenue) },
          { label: '訂單總數', value: `${totalOrders} 筆`, icon: Package, color: 'text-amber-600', sub: `租賃 ${totalRentals} 筆` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="p-4 bg-white/60 border border-border/50 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{label}</p>
            </div>
            <p className={`text-base font-serif font-semibold ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Upload CTA */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          已發布作品（{artworks.length}）
        </p>
        <Link
          href="/profile/upload"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Upload className="h-3.5 w-3.5" />
          上傳新作品
        </Link>
      </div>

      {/* Artworks table */}
      {artworks.length === 0 ? (
        <EmptyState icon={Palette} label="還沒發布任何作品" action={{ href: '/profile/upload', text: '立即上傳第一件作品' }} />
      ) : (
        <div className="space-y-3">
          {artworks.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 bg-white/60 border border-border/50 rounded-sm hover:bg-white/80 transition-colors group">
              <ArtworkThumb url={a.preview_file_url} title={a.title} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                  <TypeBadge type={a.art_type} />
                  {a.is_rentable && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border bg-indigo-50 text-indigo-700 border-indigo-200">
                      可租賃
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {a.price && <span>售價 <span className="font-semibold text-foreground">{fmt(Number(a.price))}</span></span>}
                  {a.is_rentable && a.monthly_rent_price && (
                    <span>月租 <span className="font-semibold text-foreground">{fmt(Number(a.monthly_rent_price))}</span></span>
                  )}
                  {a.art_type === 'physical' && (
                    <span className={a.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                      庫存 {a.stock}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-semibold text-emerald-600">
                  {fmt(Number(a.total_revenue))}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {Number(a.order_count)} 筆訂單
                  {Number(a.rental_count) > 0 && ` · ${Number(a.rental_count)} 租賃`}
                </p>
              </div>
              <Link href={`/artwork/${a.id}`} className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────
function EmptyState({
  icon: Icon, label, action,
}: { icon: React.ElementType; label: string; action: { href: string; text: string } }) {
  return (
    <div className="border border-dashed border-border/60 rounded-sm p-12 text-center bg-white/30">
      <Icon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm font-medium text-muted-foreground mb-4">{label}</p>
      <Link href={action.href} className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-secondary border border-border text-xs font-semibold text-foreground hover:bg-white transition-colors">
        {action.text}
      </Link>
    </div>
  );
}

// ── Main DashboardTabs ───────────────────────────────────────────
export function DashboardTabs({ orders, rentals, artworks, totalFiatRevenue, totalCryptoRevenue }: DashboardTabsProps) {
  const [tab, setTab] = useState<'collection' | 'artist'>('collection');

  const tabs = [
    { key: 'collection' as const, label: '我的收藏', icon: ShoppingBag, count: orders.length + rentals.length },
    { key: 'artist' as const, label: '創作者中心', icon: Palette, count: artworks.length },
  ];

  return (
    <div>
      {/* Main Tab Bar */}
      <div className="flex gap-1 mb-8 border-b border-border/50">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              tab === key ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'collection' && <CollectionTab orders={orders} rentals={rentals} />}
      {tab === 'artist' && <ArtistTab artworks={artworks} totalFiatRevenue={totalFiatRevenue} totalCryptoRevenue={totalCryptoRevenue} />}
    </div>
  );
}
