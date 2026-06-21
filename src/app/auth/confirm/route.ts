import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('確認連結無效，請重新登入')}`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth confirm error:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('確認連結已過期，請重新登入或再次註冊')}`
    );
  }

  // ── OAuth 登入後自動補建 public.users ──
  // (email 註冊由 signUp action 處理；這裡負責 Google/Apple 等 OAuth 首次登入)
  if (data?.user) {
    try {
      const admin = createAdminClient();
      const u = data.user;
      const meta = u.user_metadata ?? {};
      const displayName =
        meta.full_name || meta.name || u.email?.split('@')[0] || '使用者';
      const avatarUrl =
        meta.avatar_url ||
        meta.picture ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.email ?? u.id)}`;

      await admin.from('users').upsert(
        {
          id: u.id,
          email: u.email,
          display_name: displayName,
          role: 'buyer',
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    } catch (e) {
      // 非致命錯誤，不阻斷登入流程，只記 log
      console.error('[auth/confirm] upsert public.users failed:', e);
    }
  }

  return response;
}
