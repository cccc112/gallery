import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_USDT_RATE = 0.031; // 1 TWD ≈ 0.031 USDT
const FALLBACK_ETH_RATE = 0.0000095; // 1 TWD ≈ 0.0000095 ETH

export async function GET() {
  try {
    // CoinGecko free tier: tether and ethereum price in TWD
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,ethereum&vs_currencies=twd',
      { next: { revalidate: 60 } } // cache 60s server-side
    );

    if (!res.ok) throw new Error('CoinGecko API error');

    const data = await res.json();
    const usdtInTwd: number = data['tether']?.twd;
    const ethInTwd: number = data['ethereum']?.twd;

    if (!usdtInTwd || usdtInTwd <= 0) throw new Error('Invalid USDT rate');
    if (!ethInTwd || ethInTwd <= 0) throw new Error('Invalid ETH rate');

    // 1 TWD = (1 / fiatPrice) Crypto
    const usdtRate = 1 / usdtInTwd;
    const ethRate = 1 / ethInTwd;

    return NextResponse.json({ usdtRate, ethRate, usdtInTwd, ethInTwd }, { 
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' }
    });
  } catch (err) {
    console.error('Exchange rate fetch failed:', err);
    return NextResponse.json(
      { 
        usdtRate: FALLBACK_USDT_RATE, 
        ethRate: FALLBACK_ETH_RATE,
        usdtInTwd: 1 / FALLBACK_USDT_RATE,
        ethInTwd: 1 / FALLBACK_ETH_RATE,
        fallback: true 
      },
      { status: 200 }
    );
  }
}
