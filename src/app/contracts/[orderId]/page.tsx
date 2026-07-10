'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, FileText, Loader2, Printer } from 'lucide-react';
import { SignatureCanvas } from '@/components/SignatureCanvas';

interface ContractData {
  orderId: string;
  artworkTitle: string;
  artistName: string;
  buyerName: string;
  actionType: 'buy' | 'rent';
  amount: number;
  monthlyRent?: number;
  deposit?: number;
  deliveryMethod: string;
  shippingAddress?: string;
  contractStatus: string;
  contractSignedBuyerAt?: string;
  contractSignedSellerAt?: string;
  buyerSignature?: string;
  sellerSignature?: string;
  createdAt: string;
  rentMonths?: number;
}

const COMMISSION_RATE = 0.10;

export default function ContractPage({ params }: { params: { orderId: string } }) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [signResult, setSignResult] = useState<{ status: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${params.orderId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setContract(data.contract);
        setRole(data.role);
      } catch (e: any) {
        setError(e.message || '無法載入合約');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [params.orderId]);

  const handleSign = async () => {
    if (!role || signing || !signatureUrl) return;
    setSigning(true);
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.orderId, role, signature: signatureUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignResult(data);
      const contractRes = await fetch(`/api/contracts/${params.orderId}`);
      const contractData = await contractRes.json();
      if (contractRes.ok) setContract(contractData.contract);
    } catch (e: any) {
      setError(e.message || '簽署失敗');
    } finally {
      setSigning(false);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-stone-700">{error || '合約不存在'}</p>
        </div>
      </div>
    );
  }

  const isSigned = contract.contractStatus === 'signed';
  const hasCurrentUserSigned = role === 'buyer'
    ? !!contract.contractSignedBuyerAt
    : role === 'seller'
    ? !!contract.contractSignedSellerAt
    : false;

  const isBuy = contract.actionType === 'buy';
  const baseAmount = isBuy ? contract.amount : (contract.monthlyRent || 0);
  const commissionAmount = Math.round(baseAmount * COMMISSION_RATE);
  const artistReceives = baseAmount - commissionAmount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-900/20 to-amber-600/10 border border-amber-700/20 mb-4 print:hidden">
            <Shield className="h-8 w-8 text-amber-700" />
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">Atelier Blanc 乙太藝廊</p>
          <h1 className="text-2xl font-serif font-semibold text-stone-800">
            {isBuy ? '藝術品買賣合約書' : '藝術品租賃合約書'}
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            合約編號：<span className="font-mono">{params.orderId.slice(0, 8).toUpperCase()}</span>
            　　建立日期：{formatDate(contract.createdAt)}
          </p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-6 border ${
          isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        } print:hidden`}>
          {isSigned ? (
            <>
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">合約已生效</p>
                <p className="text-xs text-emerald-700">雙方均已簽署確認，本合約具有完整法律效力。</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">等待雙方簽署</p>
                <div className="flex gap-4 mt-1">
                  <span className={`text-xs ${contract.contractSignedBuyerAt ? 'text-emerald-700 font-semibold' : 'text-amber-600'}`}>
                    {contract.contractSignedBuyerAt ? '✓ 看展人已簽署' : '○ 看展人待簽署'}
                  </span>
                  <span className={`text-xs ${contract.contractSignedSellerAt ? 'text-emerald-700 font-semibold' : 'text-amber-600'}`}>
                    {contract.contractSignedSellerAt ? '✓ 藝術家已簽署' : '○ 藝術家待簽署'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Contract Body */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-stone-500" />
              <h2 className="text-sm font-semibold text-stone-700">合約正文</h2>
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-700 transition-colors print:hidden">
              <Printer className="h-3.5 w-3.5" />
              列印 / 儲存 PDF
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-7 text-sm text-stone-700 leading-relaxed">

            {/* 前言 */}
            <p className="text-stone-500 text-xs leading-loose border-l-2 border-amber-200 pl-3">
              本合約（下稱「本合約」）由下列雙方當事人，以誠信原則，就標的藝術品之
              {isBuy ? '買賣' : '租賃'}事項，自願締結本合約，雙方均應遵守。
            </p>

            {/* 第一條：立約人 */}
            <section>
              <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第一條　立約人</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                    甲方（藝術家・{isBuy ? '賣方' : '出租方'}）
                  </p>
                  <p className="font-semibold text-stone-800">{contract.artistName}</p>
                  <p className="text-xs text-stone-400 mt-1">已於平台完成實名認證</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                    乙方（看展人・{isBuy ? '買方' : '承租方'}）
                  </p>
                  <p className="font-semibold text-stone-800">{contract.buyerName}</p>
                  <p className="text-xs text-stone-400 mt-1">已於平台完成實名認證</p>
                </div>
              </div>
            </section>

            {/* 第二條：標的物 */}
            <section>
              <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第二條　交易標的</h3>
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">作品名稱</span>
                  <span className="font-semibold text-stone-800">《{contract.artworkTitle}》</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">交易類型</span>
                  <span className="font-semibold">{isBuy ? '賣斷收藏' : '短期租用'}</span>
                </div>
                {isBuy ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">成交金額</span>
                      <span className="font-semibold text-stone-800">{formatPrice(contract.amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-100 pt-2 mt-1">
                      <span className="text-stone-400">平台服務費（{Math.round(COMMISSION_RATE * 100)}%）</span>
                      <span className="text-rose-500">- {formatPrice(commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-semibold">藝術家實收</span>
                      <span className="font-semibold text-emerald-700">{formatPrice(artistReceives)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">每月租金</span>
                      <span className="font-semibold">{formatPrice(contract.monthlyRent || 0)} / 月</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">押金（預授權凍結）</span>
                      <span className="font-semibold">{formatPrice(contract.deposit || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-100 pt-2 mt-1">
                      <span className="text-stone-400">平台服務費（{Math.round(COMMISSION_RATE * 100)}%）</span>
                      <span className="text-rose-500">- {formatPrice(commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-semibold">藝術家每月實收</span>
                      <span className="font-semibold text-emerald-700">{formatPrice(artistReceives)}</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 第三條：交付方式 */}
            <section>
              <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第三條　作品交付</h3>
              <div className="bg-stone-50 border border-stone-100 rounded-lg p-4 text-xs space-y-2">
                <p className="font-semibold text-stone-700">
                  {contract.deliveryMethod === 'pickup' ? '🤝 面交自取' : '🚚 宅配配送'}
                </p>
                {contract.shippingAddress && (
                  <p className="text-stone-500">配送地址：{contract.shippingAddress}</p>
                )}
                <p className="text-stone-500 leading-relaxed">
                  {contract.deliveryMethod === 'shipping'
                    ? '甲方應於本合約雙方完成簽署後 5 個工作日內，以妥善包裝完成寄出，並提供物流追蹤號碼予乙方。運費由甲乙雙方協議負擔，或依平台另訂之規則辦理。'
                    : '雙方應透過平台聊天室協議面交之時間與地點，建議選擇有監視器之公共場所進行交付，以保障雙方權益。'}
                </p>
              </div>
            </section>

            {/* 第四條：權利義務（依類型分） */}
            {isBuy ? (
              <section>
                <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第四條　買賣條款</h3>
                <div className="space-y-4 text-xs leading-relaxed text-stone-600">
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.1 所有權移轉</p>
                    <p>甲方應保證其為本作品之合法所有權人或已取得合法授權。付款完成且雙方簽署本合約後，作品之實體所有權（或數位授權）正式移轉予乙方。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.2 著作權聲明</p>
                    <p>作品之著作財產權及著作人格權仍歸甲方所有。乙方僅取得作品之個人非商業使用權，不得進行商業重製、公開展覽收費、出版發行或任何商業用途；如欲授權商業使用，需另行與甲方簽訂書面授權合約。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.3 瑕疵擔保</p>
                    <p>甲方保證作品與描述相符，無重大隱藏瑕疵。乙方收到作品後，應於 24 小時內完成驗收。如有瑕疵，應立即透過平台客服提出，逾期視為驗收無誤。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.4 退換貨政策</p>
                    <p>因作品為藝術創作原作，除有重大瑕疵外，原則上不受理退換。如確認有品質爭議，平台將介入協調，甲方需於收到退貨後 5 個工作日內辦理退款。</p>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第四條　租賃條款</h3>
                <div className="space-y-4 text-xs leading-relaxed text-stone-600">
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.1 保管責任</p>
                    <p>乙方應以善良管理人之注意義務妥善保管作品，將其置於適當環境（避免陽光直射、潮濕、高溫），不得讓第三人使用或轉租。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.2 損害賠償</p>
                    <p>若作品於租賃期間發生毀損、污損、遺失，乙方須負完全賠償責任。輕微毀損依修復費用賠償；嚴重損毀或遺失，依作品原始售價全額賠償，平台有權自押金中直接扣抵。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.3 租金繳付</p>
                    <p>首期租金及押金於結帳時一次繳清。後續月租金於每月屆期前由平台自動扣款；如扣款失敗，平台將通知乙方於 3 個工作日內補繳，逾期視同違約。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.4 歸還與押金退還</p>
                    <p>租期屆滿時，乙方應以原包裝完好歸還作品，並負擔回寄運費。甲方應於收到作品後 3 個工作日內確認狀況。確認無損後，平台將於 3 個工作日內解除押金授權/退還押金。如有損害，將先扣除修復費用後退還餘額。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-700 mb-1">4.5 提前終止</p>
                    <p>乙方如欲提前終止租約，應提前 14 日書面通知平台，已繳租金不予退還，押金依作品狀況檢查後退還。</p>
                  </div>
                </div>
              </section>
            )}

            {/* 第五條：違約 */}
            <section>
              <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第五條　違約責任</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                任一方若違反本合約之約定，他方得定相當期限催告改善；逾期仍未改善者，得解除或終止本合約，
                並依中華民國民法相關規定請求損害賠償。平台保留介入調解及向違約方收取違約金之權利。
              </p>
            </section>

            {/* 第六條：爭議 */}
            <section>
              <h3 className="font-semibold text-stone-900 mb-3 pb-1 border-b border-stone-100">第六條　爭議解決</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                本合約如發生爭議，雙方同意優先透過 Atelier Blanc 平台客服進行線上調解。調解不成時，
                以中華民國法律為準據法，並以台灣台北地方法院為第一審管轄法院。
                本合約未盡事宜，依中華民國法律及平台服務條款辦理。
              </p>
            </section>

            {/* 簽署區 */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone-100">
              <div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-3">甲方（藝術家）數位簽章</p>
                {contract.sellerSignature ? (
                  <div>
                    <div className="border border-stone-200 rounded-lg bg-stone-50 p-2">
                      <img src={contract.sellerSignature} alt="Seller Signature" className="h-16 object-contain mix-blend-darken w-full" />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      簽署時間：{formatDate(contract.contractSignedSellerAt!)}
                    </p>
                  </div>
                ) : (
                  <div className="h-16 border border-dashed border-stone-200 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-stone-300 italic">尚未簽署</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-3">乙方（看展人）數位簽章</p>
                {contract.buyerSignature ? (
                  <div>
                    <div className="border border-stone-200 rounded-lg bg-stone-50 p-2">
                      <img src={contract.buyerSignature} alt="Buyer Signature" className="h-16 object-contain mix-blend-darken w-full" />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      簽署時間：{formatDate(contract.contractSignedBuyerAt!)}
                    </p>
                  </div>
                ) : (
                  <div className="h-16 border border-dashed border-stone-200 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-stone-300 italic">尚未簽署</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-stone-300 border-t border-stone-100 pt-4 flex justify-between">
              <span>合約建立時間：{formatDate(contract.createdAt)}</span>
              <span>平台：Atelier Blanc 乙太藝廊</span>
            </div>
          </div>
        </div>

        {/* Sign Action */}
        {role && !isSigned && !hasCurrentUserSigned && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6 print:hidden">
            <h3 className="text-sm font-semibold text-stone-800 mb-1">確認並電子簽署本合約</h3>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              我已詳細閱讀以上合約全部條款，並自願同意履行本合約所載之所有義務。
              請在下方空白處以滑鼠或觸控筆簽名，點擊「我同意並簽署」即代表您以數位方式確認本合約，
              此數位簽章具有與書面簽名同等之法律效力。
            </p>

            <div className="mb-5">
              <SignatureCanvas onSignature={(url) => setSignatureUrl(url)} />
            </div>

            <button
              onClick={handleSign}
              disabled={signing || !signatureUrl}
              className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {signing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 簽署中...</>
              ) : (
                <><Shield className="h-4 w-4" /> 我同意並簽署</>
              )}
            </button>
          </div>
        )}

        {signResult && (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border mb-4 print:hidden ${
            signResult.status === 'signed' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <CheckCircle className={`h-5 w-5 flex-shrink-0 ${signResult.status === 'signed' ? 'text-emerald-600' : 'text-blue-600'}`} />
            <p className={`text-sm font-medium ${signResult.status === 'signed' ? 'text-emerald-800' : 'text-blue-800'}`}>
              {signResult.message}
            </p>
          </div>
        )}

        {hasCurrentUserSigned && !isSigned && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border bg-blue-50 border-blue-200 print:hidden">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-medium text-blue-800">
              您已完成簽署，等待對方確認中...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-rose-600 mt-4 print:hidden">{error}</div>
        )}
      </div>
    </div>
  );
}
