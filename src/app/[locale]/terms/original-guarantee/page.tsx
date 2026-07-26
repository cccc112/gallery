import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '原創者責任條款 | Atelier Blanc',
};

export default function OriginalGuaranteeTermsPage() {
  return (
    <div className="min-h-screen marble-bg py-16 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-md rounded-sm border border-border shadow-lg p-8 md:p-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首頁
        </Link>
        
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">原創者責任條款</h1>
        
        <div className="space-y-6 text-foreground/80 leading-relaxed font-light">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. 條款宗旨</h2>
            <p>
              本「原創者責任條款」（下稱本條款）旨在確保 Atelier Blanc (乙太線上藝廊) 上所發布之實體與數位藝術作品皆為創作者本人之原創心血。為保障買家、藏家與平台之權益，凡於本平台上傳、發布非 AI 生成之藝術作品，創作者必須無條件同意並遵守本條款。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. 原創性保證</h2>
            <p>
              創作者茲聲明並保證，其所上傳並標示為非 AI 生成之作品（下稱「該作品」）：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>為創作者親自構思、創作，並非直接複製、抄襲、剽竊或未經授權重製他人之既有作品。</li>
              <li>不包含未經授權使用之第三方版權素材、商標或專利。</li>
              <li>確實由人類創作者獨立完成，並未完全依賴生成式人工智慧（Generative AI）技術產出。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. 侵權責任與賠償</h2>
            <p>
              若該作品經檢舉或發現涉嫌侵害他人著作權、智慧財產權，或違反本條款之原創性保證：
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>平台有權立即下架該作品，並凍結創作者帳號進行調查。</li>
              <li>若經確認侵權屬實，創作者須自行承擔所有法律責任，並全額退還買家或租賃者已支付之款項。</li>
              <li>創作者須賠償平台因此所受之一切損害（包含但不限於商譽損失、訴訟費用、律師費用及對第三方之賠償）。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. 真實性與資料正確性</h2>
            <p>
              創作者於發布作品時，必須確保作品名稱、介紹、尺寸、媒材及年份等資訊之真實性與準確性。實體作品之寄送必須與平台展示之內容完全一致。若因描述不實導致交易糾紛，創作者須負完全責任。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. 條款修改與解釋</h2>
            <p>
              Atelier Blanc 保留隨時修改本條款之權利。條款修改後將於平台公告，創作者繼續使用平台服務即視為同意修改後之條款。本條款之解釋與適用，以中華民國法律為準據法。
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            最後更新日期：2026 年 7 月 11 日
          </p>
        </div>
      </div>
    </div>
  );
}
