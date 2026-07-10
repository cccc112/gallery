import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, RotateCcw, Package, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '運送與退還政策 — Atelier Blanc',
  description: 'Atelier Blanc 藝術品運送方式、時程與退還條件完整說明。',
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h2 className="font-serif text-base font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/80 font-light leading-relaxed">
      {children}
    </div>
  </div>
);

export default function ShippingPage() {
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Support</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">運送與退還政策</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto">
            Atelier Blanc 是一個藝術品交易平台。實體作品的運送與退換由買賣雙方自行協議辦理。
          </p>
        </div>

        <div className="space-y-5">
          <Section icon={Truck} title="實體作品運送">
            <p>目前平台尚未提供官方運送服務或運輸保險。實體藝術品的包裝、運費計算與寄送方式，由買家與藝術家（賣家）透過平台訊息功能自行討論與安排。</p>
            <p>建議買賣雙方在交易前明確約定：</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-foreground/80">
              <li>寄送時程與到貨預估</li>
              <li>運費由哪一方負擔</li>
              <li>是否需要額外購買第三方運輸保險</li>
            </ul>
          </Section>

          <Section icon={Package} title="數位作品交付">
            <p>付款完成後，您可立即在「我的收藏」頁面下載高解析度原檔（PNG / TIFF）。</p>
            <p>下載連結有效期為 <strong>15 分鐘</strong>，可無限次重新產生（登入後前往訂單頁面）。</p>
            <p>數位作品隨附授權證書，說明個人使用範疇及版權歸屬。</p>
          </Section>

          <Section icon={Clock} title="租賃作品配送">
            <p>租賃實體作品的寄送與歸還方式同樣由雙方自行協議。租賃期滿前，請提前與對方確認歸還的物流安排。</p>
            <p>平台建議雙方在寄出與收到作品時皆拍照錄影存證，以保障雙方權益。</p>
          </Section>

          <Section icon={RotateCcw} title="退換貨政策">
            <p><strong>實體作品</strong>：退換貨規則（包含非損壞退貨、商品損壞處理）由賣家自行訂定。請買家在下單前務必與藝術家確認其退貨政策。若作品抵達時有損壞，請立即拍照並與藝術家聯絡。</p>
            <p><strong>數位作品</strong>：因數位商品特性，下載後恕不接受退款與退換。</p>
            <p><strong>租賃押金</strong>：作品完整無損歸還給藝術家，且藝術家確認無誤後，押金將退回至原付款方式。</p>
          </Section>

          <Section icon={ShieldCheck} title="交易與保險建議">
            <p>由於平台為居間媒合角色，我們建議買賣雙方在運送高價藝術品時，務必透過第三方物流公司購買全額運輸保險，以避免運送途中的損壞爭議。</p>
          </Section>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">有其他問題？</p>
              <p className="text-xs text-amber-700 mt-0.5">
                歡迎<Link href="/contact" className="underline font-medium">聯絡我們</Link>，團隊將於 1–2 個工作天內回覆。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
