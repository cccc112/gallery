import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_RATE = 0.031; // 1 TWD ≈ 0.031 USDC (fallback when API fails)

export async function GET() {
  try {
    // CoinGecko free tier: USDC price in TWD
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=twd',
      { next: { revalidate: 60 } } // cache 60s server-side
    );

    if (!res.ok) throw new Error('CoinGecko API error');

    const data = await res.json();
    const usdcInTwd: number = data['usd-coin']?.twd;

    if (!usdcInTwd || usdcInTwd <= 0) throw new Error('Invalid rate');

    // 1 TWD = (1 / usdcInTwd) USDC
    const rate = 1 / usdcInTwd;

    return NextResponse.json({ rate, usdcInTwd }, { 
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' }
    });
  } catch (err) {
    console.error('USDC rate fetch failed:', err);
    return NextResponse.json(
      { rate: FALLBACK_RATE, usdcInTwd: 1 / FALLBACK_RATE, fallback: true },
      { status: 200 }
    );
  }
}
