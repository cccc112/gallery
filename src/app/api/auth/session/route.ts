import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  // 1. 列出所有 cookies 名稱（不暴露值）
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll().map(c => ({
    name: c.name,
    valueLength: c.value.length,
    valuePreview: c.value.slice(0, 20) + '...',
  }));

  // 2. 從 request header 直接讀 cookie string
  const rawCookieHeader = request.headers.get('cookie') || '(empty)';

  // 3. 嘗試用 supabase server client 取 session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  return NextResponse.json({
    cookieCount: allCookies.length,
    cookies: allCookies,
    rawCookieHeaderLength: rawCookieHeader.length,
    rawCookieHeaderPreview: rawCookieHeader.slice(0, 200),
    session: session ? { userId: session.user?.id, email: session.user?.email, expiresAt: session.expires_at } : null,
    sessionError: sessionErr?.message || null,
    user: user ? { id: user.id, email: user.email } : null,
    userError: userErr?.message || null,
  });
}
