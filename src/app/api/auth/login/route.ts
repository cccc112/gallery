import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseCookieOptions } from '@/lib/supabase/cookies';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請輸入電子郵件與密碼' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: supabaseCookieOptions,
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            console.log('[API Login] setAll called with:', cookiesToSet.map(c => c.name));
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error && error.message.includes('Email not confirmed')) {
      // 如果用戶卡在未驗證狀態，直接使用 admin client 幫他驗證
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data: usersData } = await admin.auth.admin.listUsers();
      const unconfirmedUser = usersData?.users.find(u => u.email === email);
      
      if (unconfirmedUser) {
        await admin.auth.admin.updateUserById(unconfirmedUser.id, { email_confirm: true });
        
        // 重新嘗試登入
        const retryRes = await supabase.auth.signInWithPassword({ email, password });
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session) {
      return NextResponse.json({ error: '無法建立登入工作階段，請重新嘗試。' }, { status: 400 });
    }

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 });
  }
}
