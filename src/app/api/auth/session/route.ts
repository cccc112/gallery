import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  return NextResponse.json({
    session: session
      ? {
          access_token_preview: session.access_token?.slice(0, 30) + '...',
          expires_at: session.expires_at,
          user_id: session.user?.id,
          user_email: session.user?.email,
        }
      : null,
    user: user ? { id: user.id, email: user.email } : null,
    sessionError: sessionError?.message || null,
    userError: userError?.message || null,
  });
}
