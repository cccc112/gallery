import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateCheckMacValue } from '@/lib/ecpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 綠界會以 application/x-www-form-urlencoded 格式送來
    const formData = await req.formData();
    const params: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const receivedCheckMacValue = params['CheckMacValue'];
    const rtnCode = params['RtnCode'];
    const tradeNo = params['MerchantTradeNo']; // 我們的交易序號

    // 1. 驗證 CheckMacValue
    const calculatedMac = generateCheckMacValue(params);
    if (calculatedMac !== receivedCheckMacValue) {
      console.error('[ECPay Webhook] CheckMacValue mismatch', { expected: calculatedMac, received: receivedCheckMacValue });
      return new NextResponse('0|ErrorMessage', { status: 400 });
    }

    // 2. 判斷付款結果
    if (rtnCode === '1') {
      // 付款成功，更新資料庫
      
      // 先尋找是否為買斷訂單
      const orders = await sql`SELECT * FROM public.orders WHERE payment_transaction_id = ${tradeNo}`;
      
      if (orders.length > 0) {
        const order = orders[0];
        
        // 更新訂單狀態
        await sql`
          UPDATE public.orders 
          SET payment_status = 'paid' 
          WHERE payment_transaction_id = ${tradeNo}
        `;
        
        // 尋找作品確認是否為實體且有庫存，有的話扣庫存
        const artworks = await sql`SELECT art_type, stock FROM public.artworks WHERE id = ${order.artwork_id}`;
        if (artworks.length > 0 && artworks[0].art_type === 'physical' && artworks[0].stock > 0) {
          await sql`
            UPDATE public.artworks
            SET stock = stock - 1
            WHERE id = ${order.artwork_id} AND stock > 0
          `;
        }
        
      } else {
        // 否則尋找是否為租賃訂單
        const rentals = await sql`SELECT * FROM public.rentals WHERE payment_transaction_id = ${tradeNo}`;
        if (rentals.length > 0) {
          // 更新租賃狀態
          await sql`
            UPDATE public.rentals 
            SET status = 'active' 
            WHERE payment_transaction_id = ${tradeNo}
          `;
        } else {
          console.error('[ECPay Webhook] Order not found for tradeNo:', tradeNo);
        }
      }
    }

    // 3. 回覆綠界成功接收
    return new NextResponse('1|OK', { status: 200 });
    
  } catch (error: any) {
    console.error('[ECPay Webhook Error]', error);
    return new NextResponse('0|ErrorMessage', { status: 500 });
  }
}
