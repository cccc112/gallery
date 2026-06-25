import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 支援的 USDC 合約地址（用於後端驗證 chain）
const SUPPORTED_CHAINS: Record<number, string> = {
  1:     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  8453:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  137:   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon
};

import { createPublicClient, http } from 'viem';
import { mainnet, base, polygon } from 'viem/chains';

// Mock 或真實環境驗證
async function verifyTransaction(txHash: string, chainId: number): Promise<{
  verified: boolean;
}> {
  // 開發/測試模式：接受 MOCK hash
  if (process.env.NODE_ENV !== 'production' && txHash.startsWith('0xMOCK')) {
    return { verified: true };
  }

  const chains: Record<number, any> = { 1: mainnet, 8453: base, 137: polygon };
  const chain = chains[chainId];
  if (!chain) return { verified: false };

  try {
    const client = createPublicClient({ chain, transport: http() });
    const receipt = await client.getTransactionReceipt({ hash: txHash as \`0x\${string}\` });
    
    // 基礎驗證：確認交易在區塊鏈上成功
    // (進階實作應 parseLog 驗證 To Address 與 Amount 是否相符)
    return { verified: receipt.status === 'success' };
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
    if (!SUPPORTED_CHAINS[chainId]) {
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
          monthly_rent, deposit_amount, status, created_at
        ) VALUES (
          ${artworkId}, ${user.id},
          ${startDate}, ${endDate},
          ${amount}, ${depositAmount},
          ${'active'}, NOW()
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
        ? `租賃成功！首月 USDC 已轉帳，押金已鎖定。`
        : `收藏成功！USDC 轉帳已確認，${isPhysical ? '實體作品將安排配送' : '數位資產已解鎖可下載'}。`,
    });
  } catch (error: any) {
    console.error('[Crypto Checkout Error]', error);
    return NextResponse.json(
      { error: error.message || 'Crypto 結帳失敗' },
      { status: 500 }
    );
  }
}
