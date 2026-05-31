'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready ? { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } } : {})}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border/70 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/50 transition-all"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">連接錢包</span>
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
              >
                ⚠️ 切換網路
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="hidden lg:inline font-mono">
                  {account.displayName}
                </span>
                <span className="lg:hidden">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
