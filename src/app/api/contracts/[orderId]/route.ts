import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      buyer_id,
      seller_id,
      action_type,
      amount,
      delivery_method,
      shipping_address,
      contract_status,
      contract_signed_buyer_at,
      contract_signed_seller_at,
      buyer_signature,
      seller_signature,
      created_at,
      artworks (title, monthly_rent_price, deposit_amount),
      buyer:buyer_id (raw_user_meta_data),
      seller:seller_id (raw_user_meta_data)
    `)
    .eq('id', params.orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
  }

  // 確認身份
  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: '無權限查看此合約' }, { status: 403 });
  }

  const artwork = order.artworks as any;
  const buyer = order.buyer as any;
  const seller = order.seller as any;

  const contract = {
    orderId: order.id,
    artworkTitle: artwork?.title || '未知作品',
    artistName: seller?.raw_user_meta_data?.full_name || seller?.raw_user_meta_data?.name || '藝術家',
    buyerName: buyer?.raw_user_meta_data?.full_name || buyer?.raw_user_meta_data?.name || '看展人',
    actionType: order.action_type,
    amount: order.amount,
    monthlyRent: artwork?.monthly_rent_price,
    deposit: artwork?.deposit_amount,
    deliveryMethod: order.delivery_method || 'shipping',
    shippingAddress: order.shipping_address,
    contractStatus: order.contract_status,
    contractSignedBuyerAt: order.contract_signed_buyer_at,
    contractSignedSellerAt: order.contract_signed_seller_at,
    buyerSignature: order.buyer_signature,
    sellerSignature: order.seller_signature,
    createdAt: order.created_at,
  };

  return NextResponse.json({
    contract,
    role: isBuyer ? 'buyer' : 'seller',
  });
}
