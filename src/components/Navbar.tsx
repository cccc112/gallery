import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';
import NavbarClient from './NavbarClient';

interface UserProfile {
  display_name: string;
  avatar_url?: string;
  role: string;
  [key: string]: unknown;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const users = await sql`SELECT * FROM public.users WHERE id = ${userId} LIMIT 1`;
    return (users[0] as UserProfile) || null;
  } catch {
    return null;
  }
}

export default async function Navbar() {
  let user = null;
  let profile = null;

  // Only attempt Supabase auth if env vars are configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
      if (user) {
        profile = await getUserProfile(user.id);
      }
    } catch {
      // Supabase not configured, continue as guest
    }
  }

  const navLinks = [
    { href: '/', label: '首頁', icon: 'Home' },
    { href: '/gallery', label: '探索藝廊', icon: 'Compass' },
    ...(profile?.role === 'artist' ? [{ href: '/admin', label: '管理後台', icon: 'LayoutDashboard' }] : []),
  ];

  return (
    <NavbarClient
      user={user ? { id: user.id, email: user.email! } : null}
      profile={profile}
      navLinks={navLinks}
    />
  );
}
