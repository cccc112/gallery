export const PLATFORM_WALLET = '0x1234567890123456789012345678901234567890'; // 平台收款錢包（正式環境請換成真實地址）

export const USDT_CONTRACTS: Record<number, `0x${string}`> = {
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet
  8453: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
  11155111: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia (Mock USDT for testing)
};

export const WBTC_CONTRACTS: Record<number, `0x${string}`> = {
  1: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Mainnet WBTC
  8453: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', // Base cbBTC or WBTC (using cbBTC for Base usually, but we'll use a placeholder or official if exists)
  137: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // Polygon WBTC
  11155111: '0x29f2D40B0605204364af54EC677bD022dA425d03', // Sepolia Mock WBTC
};

// ERC20 ABI（只需要 transfer 函式）
export const ERC20_ABI = [
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
