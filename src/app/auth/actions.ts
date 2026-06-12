'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  // 用 admin client（service_role）寫入 public.users，完全繞過 RLS
  if (data.user) {
    try {
      const admin = createAdminClient();
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

export async function forgotPassword(formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/update-password`,
  });

  if (error) {
    return redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=password_updated');
}
