'use client';

import { useWriteContract, useAccount } from 'wagmi';
import ESCROW_ABI from '@/lib/GalleryEscrowABI.json';

const ESCROW_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Update to real address

export default function EscrowActions({ artworkId }: { artworkId: string }) {
  const { writeContractAsync } = useWriteContract();
  const { isConnected } = useAccount();

  const handleRefund = async () => {
    if (!isConnected) return alert('請先連接 Web3 錢包');
    try {
      await writeContractAsync({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'refundDeposit',
        args: [artworkId],
      });
      alert('已送出退還押金交易！');
    } catch (err: any) {
      alert('交易失敗：' + (err.shortMessage || err.message));
    }
  };

  const handleClaim = async () => {
    if (!isConnected) return alert('請先連接 Web3 錢包');
    try {
      await writeContractAsync({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'claimDeposit',
        args: [artworkId],
      });
      alert('已送出沒收押金交易！');
    } catch (err: any) {
      alert('交易失敗：' + (err.shortMessage || err.message));
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleRefund}
        className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100"
      >
        退還押金給看展人
      </button>
      <button 
        onClick={handleClaim}
        className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs font-semibold hover:bg-rose-100"
      >
        沒收押金
      </button>
    </div>
  );
}
