import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/contracts/sign?orderId=xxx&role=buyer|seller
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { orderId, role } = await req.json();
  if (!orderId || !['buyer', 'seller'].includes(role)) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const signedAtField = role === 'buyer' ? 'contract_signed_buyer_at' : 'contract_signed_seller_at';

  // 取得訂單資料確認身份
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, contract_status, contract_signed_buyer_at, contract_signed_seller_at')
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: '找不到訂單' }, { status: 404 });

  // 驗證身份
  const expectedId = role === 'buyer' ? order.buyer_id : order.seller_id;
  if (user.id !== expectedId) {
    return NextResponse.json({ error: '您沒有權限簽署此合約' }, { status: 403 });
  }

  // 更新簽署時間
  const { error: updateError } = await supabase
    .from('orders')
    .update({ [signedAtField]: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 檢查雙方是否都已簽署
  const buyerSigned = role === 'buyer' ? true : !!order.contract_signed_buyer_at;
  const sellerSigned = role === 'seller' ? true : !!order.contract_signed_seller_at;

  if (buyerSigned && sellerSigned) {
    // 雙方都簽了，更新合約狀態為 signed
    await supabase
      .from('orders')
      .update({ contract_status: 'signed' })
      .eq('id', orderId);

    return NextResponse.json({ status: 'signed', message: '合約已生效！雙方均已確認。' });
  }

  return NextResponse.json({ 
    status: 'partial', 
    message: role === 'buyer' 
      ? '您已確認合約，等待藝術家確認中...' 
      : '您已確認合約，等待看展人確認中...' 
  });
}
