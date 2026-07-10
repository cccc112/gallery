import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseCookieOptions } from './cookies';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        },
      },
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error('[Supabase Server Client] setAll error:', error);
            // Server Component 中 setAll 可能報錯，安全忽略
          }
        },
      },
    }
  );
}
