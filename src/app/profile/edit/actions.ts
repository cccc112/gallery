'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const display_name = (formData.get('display_name') as string)?.trim();
  const avatar_url = formData.get('avatar_url') as string;
  const bio = (formData.get('bio') as string)?.trim();
  const experience = (formData.get('experience') as string)?.trim();
  const story = (formData.get('story') as string)?.trim();
  const website = (formData.get('website') as string)?.trim();
  const instagram = (formData.get('instagram') as string)?.trim().replace(/^@/, '');
  const twitter = (formData.get('twitter') as string)?.trim().replace(/^@/, '');
  const bank_account = (formData.get('bank_account') as string)?.trim();

  let errorMessage = '';

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('users').update({
      display_name: display_name || undefined,
      avatar_url: avatar_url || undefined,
      bio: bio || null,
      experience: experience || null,
      story: story || null,
      website: website || null,
      instagram: instagram || null,
      twitter: twitter || null,
      bank_account: bank_account || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      console.error('updateProfile error:', error.message);
      errorMessage = error.message;
    }
  } catch (e: any) {
    console.error('updateProfile exception:', e.message);
    errorMessage = e.message;
  }

  if (errorMessage) {
    redirect(`/profile/edit?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath('/profile');
  revalidatePath(`/artist/${user.id}`);
  redirect('/profile?updated=1');
}
