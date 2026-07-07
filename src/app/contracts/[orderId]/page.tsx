'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';

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
  createdAt: string;
  rentMonths?: number;
}

export default function ContractPage({ params }: { params: { orderId: string } }) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [signResult, setSignResult] = useState<{ status: string; message: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${params.orderId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setContract(data.contract);
        setRole(data.role); // 'buyer' | 'seller' | null (如果不是相關人員)
      } catch (e: any) {
        setError(e.message || '無法載入合約');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [params.orderId]);

  const handleSign = async () => {
    if (!role || signing) return;
    setSigning(true);
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.orderId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignResult(data);
      // 重新載入合約狀態
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-900/20 to-amber-600/10 border border-amber-700/20 mb-4">
            <Shield className="h-8 w-8 text-amber-700" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-stone-800">
            {contract.actionType === 'buy' ? '藝術品買賣合約' : '藝術品租用合約'}
          </h1>
          <p className="text-sm text-stone-500 mt-1">訂單編號：{params.orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-6 border ${
          isSigned
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {isSigned ? (
            <>
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">合約已生效</p>
                <p className="text-xs text-emerald-700">雙方均已確認合約，交易正式成立。</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">等待雙方確認</p>
                <div className="flex gap-4 mt-1">
                  <span className={`text-xs ${contract.contractSignedBuyerAt ? 'text-emerald-700 font-semibold' : 'text-amber-600'}`}>
                    {contract.contractSignedBuyerAt ? '✓ 看展人已確認' : '○ 看展人待確認'}
                  </span>
                  <span className={`text-xs ${contract.contractSignedSellerAt ? 'text-emerald-700 font-semibold' : 'text-amber-600'}`}>
                    {contract.contractSignedSellerAt ? '✓ 藝術家已確認' : '○ 藝術家待確認'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <FileText className="h-4 w-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-700">合約條款</h2>
          </div>

          <div className="p-6 space-y-6 text-sm text-stone-700 leading-relaxed">
            <p>
              本合約由以下雙方當事人締結，並以誠信原則履行合約義務：
            </p>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">藝術家（甲方）</p>
                <p className="font-semibold">{contract.artistName}</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">看展人（乙方）</p>
                <p className="font-semibold">{contract.buyerName}</p>
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-800">一、交易標的</h3>
              <p>甲方同意將以下藝術作品依本合約所載條件，{contract.actionType === 'buy' ? '出售予' : '出租予'}乙方：</p>
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">作品名稱</span>
                  <span className="font-semibold">{contract.artworkTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">交易類型</span>
                  <span className="font-semibold">{contract.actionType === 'buy' ? '賣斷收藏' : '短期租用'}</span>
                </div>
                {contract.actionType === 'buy' ? (
                  <div className="flex justify-between">
                    <span className="text-stone-500">成交金額</span>
                    <span className="font-semibold">{formatPrice(contract.amount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">月租金</span>
                      <span className="font-semibold">{formatPrice(contract.monthlyRent || 0)} / 月</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">押金（預授權）</span>
                      <span className="font-semibold">{formatPrice(contract.deposit || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-stone-800">二、交付方式</h3>
              <p>雙方同意以下列方式完成作品交付：</p>
              <div className="bg-stone-50 border border-stone-100 rounded-lg p-4">
                <p className="font-semibold">
                  {contract.deliveryMethod === 'pickup' ? '🤝 面交自取' : '🚚 宅配配送'}
                </p>
                {contract.shippingAddress && (
                  <p className="text-stone-500 text-xs mt-1">配送地址：{contract.shippingAddress}</p>
                )}
                {contract.deliveryMethod === 'shipping' && (
                  <p className="text-xs text-stone-500 mt-2">
                    配送細節將由平台另行通知，運費依實際情況計算。
                  </p>
                )}
              </div>
            </div>

            {contract.actionType === 'buy' ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-stone-800">三、版權聲明</h3>
                <p>
                  乙方取得本作品之實體所有權（或數位授權），但甲方保有作品之著作財產權。
                  乙方不得將作品用於商業複製、公開展覽收費或任何商業用途，違者依著作權法相關規定處理。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-stone-800">三、租用條款</h3>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>乙方應以善良管理人之注意義務妥善保管作品。</li>
                  <li>租用期間如發生損毀，乙方應負賠償責任，賠償金額以作品原始售價為準。</li>
                  <li>租用期滿應將作品以原包裝完好歸還甲方，歸還後押金全額退還。</li>
                  <li>如需延長租期，應提前7日通知平台。</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-stone-800">四、爭議處理</h3>
              <p>
                本合約如發生爭議，雙方同意優先透過平台客服進行調解。若調解不成，以中華民國法律為準據法，
                並以台灣台北地方法院為第一審管轄法院。
              </p>
            </div>

            <div className="text-xs text-stone-400 border-t border-stone-100 pt-4">
              合約建立時間：{formatDate(contract.createdAt)}
            </div>
          </div>
        </div>

        {/* Sign Action */}
        {role && !isSigned && !hasCurrentUserSigned && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-stone-800 mb-2">確認並簽署合約</h3>
            <p className="text-xs text-stone-500 mb-4">
              我已詳細閱讀以上合約條款，並同意履行本合約所載之所有義務。
              點擊「我同意並簽署」即代表您以數位方式確認本合約。
            </p>
            <button
              onClick={handleSign}
              disabled={signing}
              className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
            signResult.status === 'signed'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <CheckCircle className={`h-5 w-5 flex-shrink-0 ${signResult.status === 'signed' ? 'text-emerald-600' : 'text-blue-600'}`} />
            <p className={`text-sm font-medium ${signResult.status === 'signed' ? 'text-emerald-800' : 'text-blue-800'}`}>
              {signResult.message}
            </p>
          </div>
        )}

        {hasCurrentUserSigned && !isSigned && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border bg-blue-50 border-blue-200">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-medium text-blue-800">
              您已簽署，等待對方確認中...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
