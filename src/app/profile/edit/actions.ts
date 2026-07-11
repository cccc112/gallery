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

  if (display_name && display_name.length > 15) {
    return redirect(`/profile/edit?error=${encodeURIComponent('顯示名稱不能超過 15 個字')}`);
  }

  try {
    const admin = createAdminClient();
    
    // Check for duplicate display_name
    if (display_name) {
      const { data: existing } = await admin
        .from('users')
        .select('id')
        .eq('display_name', display_name)
        .neq('id', user.id)
        .single();
        
      if (existing) {
        return redirect(`/profile/edit?error=${encodeURIComponent('此帳號名稱已被使用')}`);
      }
    }

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
