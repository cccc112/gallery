import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請輸入電子郵件與密碼' }, { status: 400 });
    }

    // 建立要回傳的 Response 物件，以便在 setAll 中直接操作它的 Cookies
    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // 從 Request 中讀取現有 Cookies
            const cookieHeader = request.headers.get('cookie') || '';
            // 簡單解析 Cookie Header 轉為符合 getAll() 回傳格式的陣列
            return cookieHeader.split(';').map(c => {
              const [name, ...val] = c.trim().split('=');
              return { name, value: val.join('=') };
            });
          },
          setAll(cookiesToSet) {
            // 直接將 Supabase 的 Session Cookies 寫入要回傳的 response 物件中
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 });
  }
}
