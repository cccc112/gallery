export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { USDC_CONTRACTS, PLATFORM_WALLET } from '@/lib/crypto';

// ERC20 Transfer event topic (keccak256 of 'Transfer(address,address,uint256)')
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const RPC_URLS: Record<number, string> = {
  1: 'https://cloudflare-eth.com',
  8453: 'https://mainnet.base.org',
  137: 'https://polygon-rpc.com',
};

/** Decode ABI-encoded address (32 bytes, last 20 bytes) */
function decodeAddress(hex: string): string {
  return ('0x' + hex.slice(-40)).toLowerCase();
}

/** Decode ABI-encoded uint256 */
function decodeBigInt(hex: string): bigint {
  return BigInt('0x' + hex.replace(/^0x/, ''));
}

/** Call eth_getTransactionReceipt via raw JSON-RPC (no viem) */
async function getReceipt(rpcUrl: string, txHash: string) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    }),
  });
  const json = await res.json();
  return json.result as null | {
    status: string; // '0x1' = success
    logs: Array<{
      address: string;
      topics: string[];
      data: string;
    }>;
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, txHash, chainId, walletAddress } = await req.json();

    if (!amount || !txHash || !chainId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- Dev/Mock Handling ---
    if (process.env.NODE_ENV !== 'production' || txHash.startsWith('0xMOCK')) {
      const adminClient = createAdminClient();
      const { data: existingMock } = await adminClient
        .from('wallet_transactions')
        .select('id')
        .eq('metadata->txHash', txHash)
        .maybeSingle();

      if (existingMock) {
        return NextResponse.json({ error: 'Mock transaction already processed' }, { status: 400 });
      }

      await grantPoints(adminClient, user.id, amount, txHash, 'mock');
      return NextResponse.json({ success: true, message: 'Mock points granted' });
    }

    // --- Real Blockchain Verification (pure fetch, no viem) ---
    const rpcUrl = RPC_URLS[chainId as number];
    const usdcAddress = (USDC_CONTRACTS[chainId as number] || '').toLowerCase();
    if (!rpcUrl || !usdcAddress) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    // 1. Get receipt
    const receipt = await getReceipt(rpcUrl, txHash);
    if (!receipt) {
      return NextResponse.json({ error: 'Transaction not found / not yet mined' }, { status: 400 });
    }
    if (receipt.status !== '0x1') {
      return NextResponse.json({ error: 'Transaction failed on chain' }, { status: 400 });
    }

    // 2. Find Transfer log from USDC contract → platform wallet
    let isValidTransfer = false;
    let transferValue = BigInt(0);

    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === usdcAddress &&
        log.topics[0] === TRANSFER_TOPIC &&
        log.topics.length === 3
      ) {
        const from = decodeAddress(log.topics[1]);
        const to = decodeAddress(log.topics[2]);

        if (
          from === walletAddress.toLowerCase() &&
          to === PLATFORM_WALLET.toLowerCase()
        ) {
          isValidTransfer = true;
          transferValue = decodeBigInt(log.data);
          break;
        }
      }
    }

    if (!isValidTransfer) {
      return NextResponse.json(
        { error: 'Valid USDC transfer to platform not found in transaction' },
        { status: 400 }
      );
    }

    // 3. Verify amount (1 NTD = 1 Point = 0.031 USDC, USDC has 6 decimals)
    const expectedUsdcRaw = BigInt(Math.round(Number(amount) * 0.031 * 1_000_000));
    const difference = transferValue > expectedUsdcRaw
      ? transferValue - expectedUsdcRaw
      : expectedUsdcRaw - transferValue;
    if (difference > BigInt(10000)) {
      return NextResponse.json(
        { error: `Amount mismatch. Expected ${expectedUsdcRaw}, got ${transferValue}` },
        { status: 400 }
      );
    }

    // 4. Replay-attack guard
    const adminClient = createAdminClient();
    const { data: existingTx } = await adminClient
      .from('wallet_transactions')
      .select('id')
      .eq('metadata->txHash', txHash)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 5. Grant Points
    await grantPoints(adminClient, user.id, amount, txHash, chainId);
    return NextResponse.json({ success: true, message: 'Points granted successfully' });

  } catch (error: any) {
    console.error('Crypto Topup Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function grantPoints(adminClient: any, userId: string, amount: number, txHash: string, chainId: string | number) {
  const { error: insertError } = await adminClient
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'topup_crypto',
      status: 'completed',
      metadata: { txHash, chainId },
    });

  if (insertError) throw insertError;

  const { data: userData } = await adminClient
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (userData) {
    const { error: updateError } = await adminClient
      .from('users')
      .update({ wallet_balance: Number(userData.wallet_balance || 0) + Number(amount) })
      .eq('id', userId);

    if (updateError) throw updateError;
  }
}
