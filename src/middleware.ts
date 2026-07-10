import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseCookieOptions } from '@/lib/supabase/cookies';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  // Env vars 未設定時直接放行，避免整站崩潰
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.next({ request });
  }

  console.log(`[Middleware] Request URL: ${request.nextUrl.pathname}`);
  const allReqCookies = request.cookies.getAll().map(c => c.name);
  console.log(`[Middleware] Request cookies present: ${JSON.stringify(allReqCookies)}`);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log(`[Middleware] setAll called with cookies: ${JSON.stringify(cookiesToSet.map(c => ({ name: c.name, valueLength: c.value.length })))}`);
          
          // 1. 更新 request 的 parsed cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // 2. 手動更新 request headers，確保 Server Components 讀得到最新 cookie
          const cookieHeader = request.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
          request.headers.set('cookie', cookieHeader);

          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // 3. 設定 response cookies 讓瀏覽器也儲存
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 刷新 session，防止過期
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log(`[Middleware] getUser result: user=${user?.id || 'null'}, error=${userError?.message || 'none'}`);

  // 保護需要登入的路由
  const protectedPaths = ['/admin', '/profile', '/dashboard'];
  const isProtected = protectedPaths.some(p =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    console.log(`[Middleware] Redirecting unprotected access to /login`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(c => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  // 額外保護 /admin：只允許白名單 email 進入
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  if (isAdmin && user) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!adminEmails.includes((user.email || '').toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach(c => {
        redirectResponse.cookies.set(c.name, c.value);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
