import { createClient } from '@supabase/supabase-js';

// 使用 service_role key，完全繞過 RLS
// 僅限 Server Actions / API Routes 使用，絕不暴露給瀏覽器
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service_role configuration');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
