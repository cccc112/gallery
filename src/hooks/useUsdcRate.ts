import { useState, useEffect } from 'react';

const FALLBACK_RATE = 0.031;

/** Hook to fetch live TWD→USDC rate. Returns rate (1 TWD = X USDC). */
export function useUsdcRate() {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [usdcInTwd, setUsdcInTwd] = useState<number>(1 / FALLBACK_RATE);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRate = async () => {
      try {
        const res = await fetch('/api/exchange-rate');
        const data = await res.json();
        if (!cancelled) {
          setRate(data.rate);
          setUsdcInTwd(data.usdcInTwd);
          setIsFallback(!!data.fallback);
        }
      } catch {
        if (!cancelled) setIsFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRate();
    // Refresh every 60 seconds
    const interval = setInterval(fetchRate, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { rate, usdcInTwd, loading, isFallback };
}
