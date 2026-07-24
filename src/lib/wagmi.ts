import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, polygon } from 'viem/chains';

export * from './crypto';

export const wagmiConfig = getDefaultConfig({
  appName: 'Atelier Blanc',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [mainnet, base, polygon],
  ssr: true,
});
