import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Initialize Redis from Upstash environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const apiRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  // 為了開發環境能繼續執行，如果不小心環境變數沒設好，可以在 Catch 裡面放行
});

// Create a stricter ratelimiter for login/auth (5 requests per minute)
export const authRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
});

export async function checkRateLimit(type: 'api' | 'auth' = 'api') {
  if (process.env.NODE_ENV === 'development') {
    // 為了避免開發環境沒設變數壞掉，如果沒 UPSTASH URL 就直接放行
    if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  }

  try {
    const ip = headers().get('x-forwarded-for') || '127.0.0.1';
    const limiter = type === 'auth' ? authRatelimit : apiRatelimit;
    
    const { success, pending, limit, reset, remaining } = await limiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試 (Too Many Requests)' },
        { status: 429, headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }
    
    return null; // OK
  } catch (err) {
    // 若 Redis 服務異常，不阻擋用戶請求 (Fail-open)
    console.error('Rate limit error:', err);
    return null;
  }
}
