import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }

    const users = await sql`SELECT * FROM public.users WHERE id = ${user.id} LIMIT 1`;
    const profile = users[0] || null;

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ user: null, profile: null }, { status: 500 });
  }
}
