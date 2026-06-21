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
  const bio = (formData.get('bio') as string)?.trim();
  const experience = (formData.get('experience') as string)?.trim();
  const story = (formData.get('story') as string)?.trim();
  const website = (formData.get('website') as string)?.trim();
  const instagram = (formData.get('instagram') as string)?.trim().replace(/^@/, '');
  const twitter = (formData.get('twitter') as string)?.trim().replace(/^@/, '');

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('users').update({
      display_name: display_name || undefined,
      bio: bio || null,
      experience: experience || null,
      story: story || null,
      website: website || null,
      instagram: instagram || null,
      twitter: twitter || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      console.error('updateProfile error:', error.message);
      return redirect(`/profile/edit?error=${encodeURIComponent(error.message)}`);
    }
  } catch (e: any) {
    return redirect(`/profile/edit?error=${encodeURIComponent(e.message)}`);
  }

  revalidatePath('/profile');
  revalidatePath(`/artist/${user.id}`);
  redirect('/profile?updated=1');
}
