import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please login first' });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await adminClient
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `User ${user.email} is now an admin! Go back to homepage and enter admin dashboard.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
