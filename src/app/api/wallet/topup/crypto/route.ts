export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { mainnet, base, polygon } from 'viem/chains';
import { USDC_CONTRACTS, PLATFORM_WALLET } from '@/lib/wagmi';

const chains = {
  1: mainnet,
  8453: base,
  137: polygon
} as Record<number, any>;

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
      // Check if mock hash already used
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

    // --- Real Blockchain Verification ---
    const chain = chains[chainId];
    const usdcAddress = USDC_CONTRACTS[chainId];
    if (!chain || !usdcAddress) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    const publicClient = createPublicClient({
      chain,
      transport: http()
    });

    // 1. Wait for tx receipt to ensure it's mined and successful
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
    
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed on chain' }, { status: 400 });
    }

    // 2. Parse ERC20 Transfer events from the receipt
    const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
    
    let isValidTransfer = false;
    let transferValue = BigInt(0);

    for (const log of receipt.logs) {
      // Check if the log is from the USDC contract
      if (log.address.toLowerCase() === usdcAddress.toLowerCase()) {
        try {
          const { args } = decodeEventLog({
            abi: [transferEventAbi],
            data: log.data,
            topics: log.topics,
          });

          // Check if sender and receiver match
          if (
            args.from?.toLowerCase() === walletAddress.toLowerCase() &&
            args.to?.toLowerCase() === PLATFORM_WALLET.toLowerCase()
          ) {
            isValidTransfer = true;
            transferValue = args.value as bigint;
            break;
          }
        } catch (e) {
          // Ignore logs that don't match our ABI
        }
      }
    }

    if (!isValidTransfer) {
      return NextResponse.json({ error: 'Valid USDC transfer to platform not found in transaction' }, { status: 400 });
    }

    // 3. Verify amount (1 NTD = 1 Point = 0.031 USDC. USDC has 6 decimals)
    const expectedUsdcRaw = BigInt(Math.round(Number(amount) * 0.031 * 1_000_000));
    
    // We allow a tiny margin of error (1 cent) due to JS float rounding
    const difference = transferValue > expectedUsdcRaw ? transferValue - expectedUsdcRaw : expectedUsdcRaw - transferValue;
    if (difference > BigInt(10000)) { // > 0.01 USDC difference
      return NextResponse.json({ error: `Amount mismatch. Expected ${expectedUsdcRaw}, got ${transferValue}` }, { status: 400 });
    }

    // 4. Double check database for replay attacks
    const adminClient = createAdminClient();
    const { data: existingTx } = await adminClient
      .from('wallet_transactions')
      .select('id')
      .eq('metadata->txHash', txHash)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 5. Grant Points!
    await grantPoints(adminClient, user.id, amount, txHash, chainId);

    return NextResponse.json({ success: true, message: 'Points granted successfully' });

  } catch (error: any) {
    console.error('Crypto Topup Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function grantPoints(adminClient: any, userId: string, amount: number, txHash: string, chainId: string | number) {
  // Insert transaction record
  const { error: insertError } = await adminClient
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'topup_crypto',
      status: 'completed',
      metadata: { txHash, chainId }
    });

  if (insertError) throw insertError;

  // Update user balance
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
