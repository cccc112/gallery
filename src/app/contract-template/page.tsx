'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ContractTemplatePage() {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          返回首頁
        </Link>

        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">智慧合約範本預覽</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
            為了保障藝術家與看展人的雙方權益，每筆交易都會自動生成專屬合約，並採用數位簽章技術確認。
            我們針對「賣斷收藏」與「短期租用」提供不同的標準合約範本。
          </p>
        </div>

        {/* 標籤切換 */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-100/80 p-1.5 rounded-md inline-flex">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2 rounded-sm text-sm font-semibold transition-colors ${
                activeTab === 'buy' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              買賣合約
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-6 py-2 rounded-sm text-sm font-semibold transition-colors ${
                activeTab === 'rent' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              租賃合約
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-border/60 rounded-sm shadow-xl overflow-hidden p-8 lg:p-12 transition-all">
          {/* 合約標頭 */}
          <div className="text-center mb-10 pb-10 border-b border-border/50">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
              {activeTab === 'buy' ? '藝術品賣斷收藏合約書' : '藝術品短期租賃合約書'}
            </h2>
            <p className="text-sm text-muted-foreground">合約編號：<span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">(系統自動生成)</span></p>
          </div>

          <div className="space-y-8 text-sm leading-loose text-foreground/80">
            {/* 交易方 */}
            <section className="bg-stone-50/50 p-6 rounded-sm border border-stone-200/50">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                立約人
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-foreground mb-1">甲方（藝術家/{activeTab === 'buy' ? '賣方' : '出租方'}）：</p>
                  <p className="text-muted-foreground font-mono bg-stone-100/80 p-2 rounded-sm border border-stone-200/50">(自動帶入藝術家姓名)</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">乙方（看展人/{activeTab === 'buy' ? '買方' : '承租方'}）：</p>
                  <p className="text-muted-foreground font-mono bg-stone-100/80 p-2 rounded-sm border border-stone-200/50">(自動帶入看展人姓名)</p>
                </div>
              </div>
            </section>

            {/* 標的物 */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                交易標的物
              </h3>
              <p className="mb-2">雙方同意就以下藝術品進行 <span className="font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm">{activeTab === 'buy' ? '買賣' : '租賃'}</span> 交易：</p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                <li>作品名稱：<span className="font-mono bg-stone-100 px-2 py-0.5 rounded">(作品名稱)</span></li>
                {activeTab === 'buy' ? (
                  <li>交易金額：<span className="font-mono bg-stone-100 px-2 py-0.5 rounded">(買斷金額 TWD/USDC)</span></li>
                ) : (
                  <>
                    <li>每月租金：<span className="font-mono bg-stone-100 px-2 py-0.5 rounded">(月租金額 TWD/USDC)</span></li>
                    <li>押金：<span className="font-mono bg-stone-100 px-2 py-0.5 rounded">(押金金額 TWD/USDC)</span></li>
                  </>
                )}
              </ul>
            </section>

            {/* 權利義務 */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
                雙方權利與義務
              </h3>
              <div className="space-y-4 text-justify">
                {activeTab === 'buy' ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">3.1 交付與驗收</h4>
                      <p>甲方應於合約簽署且乙方付款完成後，依約定之配送方式將作品交付予乙方。乙方應於收到作品後立即檢查，若有毀損應於 24 小時內通知平台客服處理。</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">3.2 版權聲明</h4>
                      <p>乙方取得本作品之實體或數位載體所有權（或個人授權），但甲方保有作品之完整著作財產權與著作人格權。乙方不得將作品進行商業重製、公開播送、發行或用於營利目的，違者依著作權法相關規定處理。</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">3.1 租賃期間與費用</h4>
                      <p>租賃期間自 <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">(起日)</span> 至 <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">(迄日)</span>。乙方同意以信用卡預先授權或凍結押金，並支付首期租金。後續租金按月收取。</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">3.2 保管責任與損害賠償</h4>
                      <p>乙方應善盡善良管理人之保管責任，將作品置於安全且適當之環境。若作品於租賃期間有毀損、污損、遺失或破壞，乙方須負擔賠償責任，甲方有權自押金中直接扣除相應之修復費用。如毀損達無法修復程度，乙方需依作品原始售價賠償。</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">3.3 歸還與押金退還</h4>
                      <p>租期屆滿時，乙方應主動以原包裝完好歸還作品予甲方。經甲方確認作品無損後，平台將於 3 個工作日內解除押金凍結。逾期未歸還者，將按日加收 5% 滯納金。</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 違約處理 */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> 
                爭議處理
              </h3>
              <p>
                本合約未盡事宜，依中華民國法律及 Atelier Blanc 平台服務條款辦理。如有爭議，雙方同意優先透過平台客服進行調解；調解不成時，同意以台灣台北地方法院為第一審管轄法院。
              </p>
            </section>

            {/* 簽名區 */}
            <section className="pt-8 border-t border-border/50">
              <h3 className="text-base font-semibold text-foreground mb-6">電子簽署欄位</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="border border-dashed border-border/80 bg-stone-50 rounded-sm p-6 text-center">
                  <p className="text-sm font-semibold text-foreground mb-4">甲方簽名 (藝術家)</p>
                  <div className="h-16 flex items-center justify-center text-muted-foreground/50 italic text-xs">
                    (交易成立時透過手寫板簽署)
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground">
                    簽署時間：自動記錄
                  </div>
                </div>
                <div className="border border-dashed border-border/80 bg-stone-50 rounded-sm p-6 text-center">
                  <p className="text-sm font-semibold text-foreground mb-4">乙方簽名 (看展人)</p>
                  <div className="h-16 flex items-center justify-center text-muted-foreground/50 italic text-xs">
                    (交易成立時透過手寫板簽署)
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground">
                    簽署時間：自動記錄
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 py-3 rounded-sm border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                <span>簽署完成後，合約具有完整法律效力，雙方均可隨時在訂單頁面下載副本。</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
