
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

import { USDT_CONTRACTS } from '@/lib/crypto';

import { createPublicClient, http } from 'viem';

// Mock 或真實環境驗證
async function verifyTransaction(txHash: string, chainId: number): Promise<{
  verified: boolean;
}> {
  // 開發/測試模式：接受 MOCK hash
  if (process.env.NODE_ENV !== 'production' && txHash.startsWith('0xMOCK')) {
    return { verified: true };
  }

  const RPC_URLS: Record<number, string> = {
    1: 'https://cloudflare-eth.com',
    8453: 'https://mainnet.base.org',
    137: 'https://polygon-rpc.com'
  };
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) return { verified: false };

  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const receipt = await client.getTransactionReceipt({ hash: txHash as any });
    
    // 基礎驗證：確認交易在區塊鏈上成功
    if (receipt.status !== 'success') return { verified: false };

    // 進階實作 TODO:
    // 如果是租賃 (actionType === 'rent')：
    // 1. parseLog 尋找 GalleryEscrow 合約拋出的 `RentalDeposited` 事件
    // 2. 驗證 event.artworkId === artworkId
    // 3. 驗證 event.rentAmount + event.depositAmount 是否正確
    
    // 如果是買斷 (actionType === 'buy')：
    // 1. 驗證 USDT Transfer 事件的 To Address 是否為 PLATFORM_WALLET
    // 2. 驗證金額是否正確

    return { verified: true };
  } catch (error) {
    console.error('[Crypto Verify Error]', error);
    return { verified: false };
  }
}

export async function POST(request: Request) {
  try {
    // 1. 驗證登入
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入才能結帳' }, { status: 401 });
    }

    const body = await request.json();
    const {
      artworkId,
      actionType,     // 'buy' | 'rent'
      txHash,         // 前端送出的交易 hash
      walletAddress,  // 買家錢包地址
      chainId = 1,    // 使用的鏈 (預設 Ethereum)
      rentalMonths = 1,
    } = body;

    if (!artworkId || !actionType || !txHash || !walletAddress) {
      return NextResponse.json({ error: '缺少必要參數 (artworkId/actionType/txHash/walletAddress)' }, { status: 400 });
    }

    // 2. 驗證 chain 支援
    if (!USDT_CONTRACTS[chainId]) {
      return NextResponse.json({ error: `不支援的鏈 ID: ${chainId}，請切換至 Ethereum / Base / Polygon` }, { status: 400 });
    }

    // 3. 取得作品資料
    const artworks = await sql`SELECT * FROM public.artworks WHERE id = ${artworkId}`;
    if (!artworks.length) {
      return NextResponse.json({ error: '找不到該作品' }, { status: 404 });
    }
    const artwork = artworks[0];

    const isRental = actionType === 'rent';
    const isPhysical = artwork.art_type === 'physical';

    // 4. 驗證交易（開發環境 mock）
    const verification = await verifyTransaction(txHash, chainId);
    if (!verification.verified) {
      return NextResponse.json({ error: '交易驗證失敗，請確認 tx hash 正確' }, { status: 402 });
    }

    const amount = isRental ? Number(artwork.monthly_rent_price) : Number(artwork.price);
    const depositAmount = isRental ? Number(artwork.deposit_amount) : 0;

    // 5. 寫入 DB
    if (isRental) {
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + rentalMonths * 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      await sql`
        INSERT INTO public.rentals (
          artwork_id, tenant_id, start_date, end_date,
          monthly_rent, deposit_amount, status, created_at, payment_transaction_id
        ) VALUES (
          ${artworkId}, ${user.id},
          ${startDate}, ${endDate},
          ${amount}, ${depositAmount},
          ${'active'}, NOW(),
          ${txHash}
        )
      `;
    } else {
      await sql`
        INSERT INTO public.orders (
          artwork_id, buyer_id, amount,
          payment_status, payment_transaction_id, created_at
        ) VALUES (
          ${artworkId}, ${user.id}, ${amount},
          ${'paid'}, ${txHash}, NOW()
        )
      `;

      // 數位作品：解鎖下載（實體扣庫存）
      if (isPhysical && artwork.stock > 0) {
        await sql`
          UPDATE public.artworks
          SET stock = stock - 1
          WHERE id = ${artworkId} AND stock > 0
        `;
      }
    }

    return NextResponse.json({
      success: true,
      txHash,
      walletAddress,
      chainId,
      message: isRental
        ? `租賃成功！首月 USDT 已轉帳，押金已鎖定。`
        : `收藏成功！USDT 轉帳已確認，${isPhysical ? '實體作品將安排配送' : '數位資產已解鎖可下載'}。`,
    });
  } catch (error: any) {
    console.error('[Crypto Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || 'Crypto 結帳失敗' },
      { status: 500 }
    );
  }
}
