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
            我們致力於讓每件藝術品安全抵達您手中，並提供透明的退還保障。
          </p>
        </div>

        <div className="space-y-5">
          <Section icon={Truck} title="實體作品運送">
            <p>所有實體藝術品均採用專業藝術品級包裝，包含防震泡棉、木箱或硬質紙板，並附帶運輸保險。</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: '台灣本島', value: '3–5 個工作天' },
                { label: '台灣離島', value: '5–7 個工作天' },
                { label: '香港 / 澳門', value: '7–10 個工作天' },
                { label: '日本 / 新加坡', value: '10–14 個工作天' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-stone-50 rounded-sm p-3 border border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">* 大型或特殊作品（超過 100×100 cm 或 20 kg）需另行報價運費</p>
          </Section>

          <Section icon={Package} title="數位作品交付">
            <p>付款完成後，您可立即在「我的收藏」頁面下載高解析度原檔（PNG / TIFF）。</p>
            <p>下載連結有效期為 <strong>15 分鐘</strong>，可無限次重新產生（登入後前往訂單頁面）。</p>
            <p>數位作品隨附授權證書，說明個人使用範疇及版權歸屬。</p>
          </Section>

          <Section icon={Clock} title="租賃作品配送">
            <p>租賃實體作品配送時程與買斷相同，於押金預授權成功後的 2 個工作天內寄出。</p>
            <p>租賃期滿前 7 天，我們將聯絡您安排歸還事宜，並提供免費收件服務（台灣本島）。</p>
          </Section>

          <Section icon={RotateCcw} title="退換貨政策">
            <p><strong>實體作品</strong>：若作品抵達時有明顯損壞（須於收件 48 小時內回報並附照片），我們將安排免費退換或全額退款。</p>
            <p><strong>非損壞退貨</strong>：因個人喜好退貨，請於收件 7 天內聯絡我們，運費由買家自行負擔，作品須完整未損。</p>
            <p><strong>數位作品</strong>：因數位商品特性，下載後恕不退款。</p>
            <p><strong>租賃押金</strong>：作品無損歸還後 5–7 個工作天退回押金。</p>
          </Section>

          <Section icon={ShieldCheck} title="運輸保險">
            <p>所有實體作品均含「門到門」運輸保險，保額為作品售價 100%。</p>
            <p>如運輸途中發生損壞，請保留原包裝並於 48 小時內聯絡我們，我們將協助處理保險理賠。</p>
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
