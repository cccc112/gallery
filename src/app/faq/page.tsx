import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '常見問題 FAQ — Atelier Blanc',
  description: 'Atelier Blanc 常見問題解答，包含購買、租賃、數位作品、付款、運送等問題。',
};

const faqs: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: '帳號與加入',
    items: [
      {
        q: '如何成為 Atelier Blanc 的藝術家？',
        a: '註冊帳號後即可上傳作品。我們歡迎所有媒材的藝術家，包含油畫、數位藝術、攝影等。作品上傳後經平台審核（約 1–3 個工作天）即可上架。',
      },
      {
        q: '可以同時是買家也是賣家嗎？',
        a: '可以。同一帳號可以上傳自己的作品，同時也能購買或租賃其他藝術家的作品。',
      },
    ],
  },
  {
    category: '購買與付款',
    items: [
      {
        q: '支援哪些付款方式？',
        a: '目前支援信用卡（Visa、MasterCard）、Google Pay、Apple Pay（透過 Stripe 安全結帳），以及 Web3 加密貨幣（USDC，支援 Ethereum、Base、Polygon 網路）。',
      },
      {
        q: '付款安全嗎？',
        a: '信用卡付款全程由 Stripe 處理，我們的網站不會儲存任何卡號資料。Stripe 符合 PCI DSS Level 1 最高安全標準。',
      },
      {
        q: '購買後可以退款嗎？',
        a: '實體作品若於 7 天內退貨（非損壞原因），退款扣除運費後原路退回。數位作品因下載後無法收回，恕不退款。如作品有損壞請於 48 小時內聯絡我們。',
      },
      {
        q: '平台收取手續費嗎？',
        a: '買家結帳時將加收 10% 平台服務費，用於平台維運、版權保護及安全交易保障。',
      },
    ],
  },
  {
    category: '數位作品',
    items: [
      {
        q: '購買數位作品後如何下載？',
        a: '付款成功後，在結帳成功頁面可直接點擊「下載高畫質原檔」，或前往個人後台「我的收藏」重新下載。下載連結每次有效期 15 分鐘，可無限次重新產生。',
      },
      {
        q: '數位作品有版權保護嗎？',
        a: '所有數位作品均帶有作者版權，購買授權限個人欣賞與非商業用途展示。未經授權的商業使用、再販售或廣泛傳播均屬侵權。',
      },
      {
        q: 'AI 生成的作品可以販售嗎？',
        a: '可以。透過平台 AI 工作室生成的作品，使用者擁有個人使用授權，可在平台上架販售，平台抽取標準佣金。',
      },
    ],
  },
  {
    category: '租賃服務',
    items: [
      {
        q: '租賃作品的流程是什麼？',
        a: '選擇租賃方案後，系統將預授權押金（不立即扣款），並扣除首月租金。作品配送後開始計算租賃期。租期結束前 7 天我們將聯繫安排歸還。',
      },
      {
        q: '押金什麼時候會退回？',
        a: '作品完整無損歸還後，押金將於 5–7 個工作天退回至原付款方式。',
      },
      {
        q: '可以提前退租嗎？',
        a: '可以，請至少提前 7 天通知我們。已付的租金依實際使用比例計算，押金扣除安排費用後退回。',
      },
    ],
  },
  {
    category: '運送',
    items: [
      {
        q: '台灣境內運送需要多久？',
        a: '台灣本島約 3–5 個工作天，離島約 5–7 個工作天。所有實體作品均含運輸保險，保額為作品售價 100%。',
      },
      {
        q: '有提供國際配送嗎？',
        a: '目前提供香港、澳門、日本、新加坡、美國等地配送，時程約 7–14 個工作天。國際運費依目的地和作品重量另行計算。',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Support</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">常見問題 FAQ</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto">
            找不到答案？歡迎<Link href="/contact" className="underline hover:text-foreground transition-colors">聯絡我們</Link>，我們將盡快回覆。
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map(({ category, items }) => (
            <div key={category}>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-3">
                <span className="flex-1 h-px bg-border" />
                {category}
                <span className="flex-1 h-px bg-border" />
              </h2>
              <div className="space-y-3">
                {items.map(({ q, a }) => (
                  <details key={q} className="group bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-stone-50/50 transition-colors">
                      <span className="text-sm font-medium text-foreground pr-4">{q}</span>
                      <span className="text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-muted-foreground font-light leading-relaxed border-t border-border/40 pt-3">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-8 bg-white/60 backdrop-blur-sm border border-border/60 rounded-sm">
          <p className="text-sm font-medium text-foreground mb-2">仍有疑問？</p>
          <p className="text-xs text-muted-foreground mb-4">我們的客服團隊週一至週五 10:00–18:00 線上服務</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors">
            聯絡客服團隊
          </Link>
        </div>
      </div>
    </div>
  );
}
