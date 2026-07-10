import { createBrowserClient } from '@supabase/ssr';
import { supabaseCookieOptions } from './cookies';

let client: ReturnType<typeof createBrowserClient>;

export function createClient() {
  if (client) return client;
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
    }
  );
  
  return client;
}
