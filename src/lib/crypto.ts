export const PLATFORM_WALLET = '0x1234567890123456789012345678901234567890'; // 平台收款錢包（正式環境請換成真實地址）

// USDC 合約地址
export const USDC_CONTRACTS: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
};

// USDC ABI（只需要 transfer 函式）
export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
