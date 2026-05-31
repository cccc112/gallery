'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function signUp(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = (formData.get('display_name') as string) || email.split('@')[0];

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=/`,
    },
  });

  if (error) {
    return redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // 在 users table 建立 profile（ON CONFLICT 防止重複）
  if (data.user) {
    try {
      await sql`
        INSERT INTO public.users (id, email, display_name, role, avatar_url, created_at)
        VALUES (
          ${data.user.id},
          ${email},
          ${displayName},
          ${'buyer'},
          ${'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(email)},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
    } catch (dbError) {
      console.error('Failed to create user profile:', dbError);
    }
  }

  // 若 Supabase 需要 email 確認，顯示提示頁；否則直接跳首頁
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/');
  } else {
    redirect(`/register/check-email?email=${encodeURIComponent(email)}`);
  }
}

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '/';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
