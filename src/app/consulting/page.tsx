import type { Metadata } from 'next';
import Link from 'next/link';
import { Palette, Home, Building2, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '藝術諮詢服務 — Atelier Blanc',
  description: '提供個人收藏規劃、企業空間布置、藝術投資顧問等專業藝術諮詢服務。',
};

const services = [
  {
    icon: Home,
    title: '居家收藏規劃',
    description: '根據您的居家空間風格、色調與預算，由我們的策展顧問為您挑選最合適的作品組合，打造獨一無二的生活藝術空間。',
    items: ['空間風格分析', '作品搭配建議', '預算規劃', '安裝擺設指導'],
  },
  {
    icon: Building2,
    title: '企業空間藝術布置',
    description: '辦公室、飯店大廳、商業空間的藝術品規劃與租賃，提升品牌形象，同時享有靈活的租賃換件彈性。',
    items: ['企業品牌調性分析', '大型作品租賃', '定期換件服務', '藝術品管理維護'],
  },
  {
    icon: GraduationCap,
    title: '藝術投資諮詢',
    description: '提供新興藝術家市場趨勢分析、作品價值評估及收藏組合建議，協助您做出有根據的藝術投資決策。',
    items: ['藝術市場趨勢報告', '作品真偽鑑定協助', '收藏組合分析', '轉售規劃建議'],
  },
  {
    icon: Sparkles,
    title: 'AI 藝術創作協作',
    description: '與平台 AI 生成工具結合，提供客製化 AI 藝術作品創作服務，適合企業禮品、活動限定版或個人紀念作品。',
    items: ['客製化 AI 作品生成', '多種風格選擇', '高解析度輸出', '版權完整移轉'],
  },
];

export default function ConsultingPage() {
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Support</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">藝術諮詢服務</h1>
          <p className="text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
            無論您是初次接觸藝術收藏，還是正在擴展企業藝術布置，我們的專業顧問團隊都能為您量身規劃。
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {services.map(({ icon: Icon, title, description, items }) => (
            <div key={title} className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="font-serif text-base font-semibold text-foreground">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">{description}</p>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-primary text-primary-foreground rounded-sm p-8 text-center">
          <Palette className="h-8 w-8 mx-auto mb-4 opacity-80" />
          <h2 className="font-serif text-xl font-semibold mb-2">預約免費初步諮詢</h2>
          <p className="text-sm text-primary-foreground/70 font-light mb-6 max-w-md mx-auto">
            首次諮詢免費，我們的顧問將於 2 個工作天內與您聯繫，了解您的需求並提供初步建議。
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-foreground text-sm font-semibold rounded-sm hover:bg-stone-50 transition-colors shadow-sm">
            立即預約諮詢
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
