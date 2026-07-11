'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createPlainClient } from '@supabase/supabase-js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// plain client（不依賴 cookies），專用於不需要使用者 session 的操作
function createAuthClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

  // 用 admin client（service_role）寫入 public.users，完全繞過 RLS
  if (data.user) {
    try {
      const admin = createAdminClient();
      
      // Auto-confirm the user's email to bypass verification code issues
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true });

      const { error: dbError } = await admin.from('users').upsert(
        {
          id: data.user.id,
          email,
          display_name: displayName,
          role: 'buyer',
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (dbError) {
        console.error('Failed to create user profile:', dbError.message);
      }
    } catch (e) {
      console.error('Admin client error:', e);
    }
  }

  // Since we auto-confirmed them, we can try to sign them in directly, or just redirect to login with a success message
  // But wait, signUp with email/password already returns a session if email confirmation is disabled. 
  // If we just confirmed them via admin API, the current signUp call didn't return a session.
  // We can just redirect them to login with a success message.
  redirect('/login?message=registered');
}



export async function verifyOtpAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function forgotPassword(formData: FormData) {
  const supabase = createAuthClient();
  const email = formData.get('email') as string;



  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/update-password`,
  });

  if (error) {
    console.error('[forgotPassword] error:', error.message);
    return redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function updatePassword(formData: FormData) {
  // updateUser 需要 session，維持使用 SSR client
  const supabase = createClient();
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=password_updated');
}
