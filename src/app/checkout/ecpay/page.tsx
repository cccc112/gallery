import { sql } from '@/lib/db';
import { generateCheckMacValue, ECPAY_MERCHANT_ID } from '@/lib/ecpay';
import { notFound } from 'next/navigation';

interface ECPayPageProps {
  searchParams: { tradeNo?: string };
}

export default async function ECPayRedirectPage({ searchParams }: ECPayPageProps) {
  const tradeNo = searchParams.tradeNo;
  if (!tradeNo) return notFound();

  // 取得 pending 的訂單或租賃資料
  let record: any = null;
  let isRental = false;
  
  const orders = await sql`SELECT * FROM public.orders WHERE payment_transaction_id = ${tradeNo}`;
  if (orders.length > 0) {
    record = orders[0];
  } else {
    const rentals = await sql`SELECT * FROM public.rentals WHERE payment_transaction_id = ${tradeNo}`;
    if (rentals.length > 0) {
      record = rentals[0];
      isRental = true;
    }
  }

  if (!record) return notFound();

  // 取得作品名稱
  const artworks = await sql`SELECT title FROM public.artworks WHERE id = ${record.artwork_id}`;
  const title = artworks.length > 0 ? artworks[0].title : 'Atelier Blanc 藝術品';

  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${proto}://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'localhost:3000'}`;
  
  // 綠界所需參數
  const amount = isRental ? Number(record.monthly_rent) + Number(record.deposit_amount) : Number(record.amount);
  const tradeDate = new Date().toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' }).replace(/-/g, '/'); // 格式: yyyy/MM/dd HH:mm:ss

  const params: Record<string, string | number> = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: encodeURIComponent(`Atelier Blanc 結帳 - ${tradeNo}`),
    ItemName: encodeURIComponent(title),
    ReturnURL: `${baseUrl}/api/webhooks/ecpay`,
    ClientBackURL: `${baseUrl}/checkout/success?session_id=${tradeNo}&artworkId=${record.artwork_id}&type=${isRental ? 'rent' : 'buy'}`,
    ChoosePayment: 'Credit', // 預設只開通信用卡
    EncryptType: 1,
  };

  const checkMacValue = generateCheckMacValue(params);
  params['CheckMacValue'] = checkMacValue;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="font-serif text-xl font-semibold text-foreground">正在導向綠界科技安全付款閘道...</h1>
        <p className="text-sm text-muted-foreground">請勿關閉視窗，這可能需要幾秒鐘的時間</p>
      </div>

      <form id="ecpay-form" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5" method="POST" className="hidden">
        {Object.entries(params).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>

      <script dangerouslySetInnerHTML={{
        __html: `document.getElementById('ecpay-form').submit();`
      }} />
    </div>
  );
}
