import { useState, useEffect } from 'react';

const FALLBACK_USDT_RATE = 0.031;
const FALLBACK_ETH_RATE = 0.0000095;

export function useExchangeRate() {
  const [rates, setRates] = useState({
    usdtRate: FALLBACK_USDT_RATE,
    ethRate: FALLBACK_ETH_RATE,
    usdtInTwd: 1 / FALLBACK_USDT_RATE,
    ethInTwd: 1 / FALLBACK_ETH_RATE,
  });
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRate = async () => {
      try {
        const res = await fetch('/api/exchange-rate');
        const data = await res.json();
        if (!cancelled) {
          setRates({
            usdtRate: data.usdtRate,
            ethRate: data.ethRate,
            usdtInTwd: data.usdtInTwd,
            ethInTwd: data.ethInTwd,
          });
          setIsFallback(!!data.fallback);
        }
      } catch {
        if (!cancelled) setIsFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { ...rates, loading, isFallback };
}
