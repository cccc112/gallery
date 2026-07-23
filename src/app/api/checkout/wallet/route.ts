import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function generateTradeNo() {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AB${timestamp}${random}`;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入才能結帳' }, { status: 401 });
    }

    const { artworkId, actionType } = await request.json();

    if (!artworkId || !actionType) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // Use admin client for atomic wallet operations to bypass RLS issues during complex transactions
    const adminClient = createAdminClient();

    // 1. Get artwork details
    const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
    if (artworks.length === 0) {
      return NextResponse.json({ error: '找不到該作品' }, { status: 404 });
    }
    const artwork = artworks[0];
    const isRental = actionType === 'rent';

    // 2. Calculate required amounts
    const rentAmount = Math.round(Number(artwork.monthly_rent_price)) || 0;
    const depositAmount = Math.round(Number(artwork.deposit_amount)) || 0;
    const purchaseAmount = Math.round(Number(artwork.price)) || 0;

    const totalRequired = isRental ? (rentAmount + depositAmount) : purchaseAmount;

    if (totalRequired <= 0) {
      return NextResponse.json({ error: '商品金額設定有誤' }, { status: 400 });
    }

    // 3. Check user wallet balance
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('wallet_balance, frozen_balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: '無法讀取您的錢包資訊' }, { status: 500 });
    }

    const currentBalance = Number(userData.wallet_balance || 0);
    const currentFrozen = Number(userData.frozen_balance || 0);

    if (currentBalance < totalRequired) {
      return NextResponse.json({ error: '點數餘額不足，請先儲值' }, { status: 400 });
    }

    const tradeNo = generateTradeNo();

    // 4. Process payment via wallet
    if (isRental) {
      // Rental logic
      const rentalMonths = 1;
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + rentalMonths * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // Deduct balance, add to frozen for deposit
      const newBalance = currentBalance - rentAmount - depositAmount;
      const newFrozen = currentFrozen + depositAmount;

      await adminClient.from('users').update({ wallet_balance: newBalance, frozen_balance: newFrozen }).eq('id', user.id);

      // Record transactions
      await adminClient.from('wallet_transactions').insert([
        { user_id: user.id, amount: -rentAmount, type: 'rent_payment', status: 'completed', reference_id: artworkId },
        { user_id: user.id, amount: -depositAmount, type: 'rent_deposit_freeze', status: 'completed', reference_id: artworkId }
      ]);

      // Create rental record
      await sql`
        INSERT INTO public.rentals (
          artwork_id, tenant_id, start_date, end_date,
          monthly_rent, deposit_amount, status, created_at, payment_transaction_id
        ) VALUES (
          ${artworkId}, ${user.id},
          ${startDate}, ${endDate},
          ${rentAmount}, ${depositAmount},
          ${'active'}, NOW(), ${tradeNo}
        )
      `;

      // Update artwork status
      await sql`UPDATE public.artworks SET is_rented = true WHERE id = ${artworkId}`;
    } else {
      // Purchase logic
      const newBalance = currentBalance - purchaseAmount;
      
      await adminClient.from('users').update({ wallet_balance: newBalance }).eq('id', user.id);
      
      await adminClient.from('wallet_transactions').insert([
        { user_id: user.id, amount: -purchaseAmount, type: 'purchase', status: 'completed', reference_id: artworkId }
      ]);

      await sql`
        INSERT INTO public.orders (
          artwork_id, buyer_id, amount,
          payment_status, payment_transaction_id, created_at
        ) VALUES (
          ${artworkId}, ${user.id}, ${purchaseAmount},
          ${'completed'}, ${tradeNo}, NOW()
        )
      `;

      // Assign ownership if digital, or just mark sold
      await sql`UPDATE public.artworks SET owner_id = ${user.id}, is_for_sale = false WHERE id = ${artworkId}`;
    }

    return NextResponse.json({ success: true, url: `/profile` }); // Redirect to profile after successful payment
  } catch (error: any) {
    console.error('[Wallet Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || '結帳處理失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
