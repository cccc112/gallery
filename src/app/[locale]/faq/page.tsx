import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'FAQ' });
  return {
    title: `${t('title')} — Atelier Blanc`,
    description: t('title'),
  };
}

const faqs: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: '帳號與加入',
    items: [
      {
        q: '如何成為 Atelier Blanc 的藝術家？',
        a: '註冊帳號後即可上傳作品。我們歡迎所有媒材的藝術家，包含油畫、數位藝術、攝影等。作品上傳後即可即時上架展示，無需等待人工審核。',
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
        a: '目前平台為 Beta 測試階段，所有的支付流程（包含信用卡、ECPay、PayPal 及 Web3 加密貨幣）皆為沙盒測試模式 (Test Mode)。目前不處理任何真實交易與扣款。',
      },
      {
        q: '付款安全嗎？',
        a: '由於目前為測試階段，請勿輸入任何真實的信用卡號或機敏資訊。',
      },
      {
        q: '購買後可以退款嗎？',
        a: '實體作品享有收到商品後 7 天的鑑賞期，若於期間內發現運送損毀或與描述不符，可聯繫平台與藝術家申請退款。數位作品因下載後無法收回，售出後恕不退款。',
      },
      {
        q: '藝術家何時能收到販售所得？',
        a: '當買家收到實體畫作，並經過 7 天鑑賞期無爭議後，訂單即自動標示為「已完成」。平台將於訂單完成後，將扣除手續費的款項自動匯入藝術家設定的 PayPal 帳戶或加密貨幣錢包。',
      },
      {
        q: '平台會收取手續費嗎？',
        a: '目前平台為推廣期，買賣交易相關手續費皆依各金流服務商（如 Stripe、ECPay、PayPal 或區塊鏈網路）之規定收取，平台方暫不額外抽成。',
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
        a: '可以。本平台使用的 AI 生成模型產出之圖像屬於公有領域 (Public Domain) 或允許商業使用。您透過平台 AI 工作室生成的作品，可以自由上架販售。',
      },
    ],
  },
  {
    category: '租賃服務',
    items: [
      {
        q: '租賃作品的流程是什麼？',
        a: '選擇租賃方案並完成付款後，平台將保留您的押金。實體作品寄達並確認無損（3-7天確認期）後，租約正式開始，平台才會將首期租金撥付給藝術家。',
      },
      {
        q: '租賃押金什麼時候會退回？',
        a: '租約到期且作品完整無損歸還給藝術家後，平台會從系統後台將保管的押金原路退回您的信用卡或 Web3 錢包。若使用法幣支付，押金保管於平台 PayPal 餘額中；若使用加密貨幣，押金則安全鎖定於智能合約中。',
      },
    ],
  },
  {
    category: '運送',
    items: [
      {
        q: '平台有提供運送服務嗎？',
        a: '目前平台尚未提供官方運送服務。實體作品的運送方式、運費以及國際配送等細節，需由買家與藝術家（賣家）自行討論與安排。',
      },
    ],
  },
];

export default async function FAQPage() {
  const t = await getTranslations('FAQ');
  // Need to type cast or handle the JSON structure from next-intl
  // faqs is an array of objects
  const faqsData = t.raw('faqs') as { category: string; items: { q: string; a: string }[] }[];

  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{t('support')}</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">{t('title')}</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto">
            {t('subtitlePre')}<Link href="/contact" className="underline hover:text-foreground transition-colors">{t('subtitleLink')}</Link>{t('subtitlePost')}
          </p>
        </div>

        <div className="space-y-8">
          {faqsData.map(({ category, items }) => (
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
          <p className="text-sm font-medium text-foreground mb-2">{t('stillHaveQuestions')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('serviceHours')}</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors">
            {t('contactSupportBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
