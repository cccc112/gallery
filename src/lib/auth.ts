import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'artist';
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export async function getCurrentUser(): Promise<User> {
  const cookieStore = cookies();
  const role = cookieStore.get('user_role')?.value || 'buyer';
  const userId = role === 'artist' 
    ? '94c64b59-994c-41c3-882d-127e9086e927' 
    : '54d64b59-994c-41c3-882d-127e9086e928';
  
  try {
    const users = await sql<User[]>`SELECT * FROM public.users WHERE id = ${userId}`;
    if (users && users.length > 0) {
      return users[0];
    }
  } catch (e) {
    console.error('Failed to fetch user from DB:', e);
  }

  // Fallback if DB is empty or connection fails
  return {
    id: userId,
    email: role === 'artist' ? 'artist@example.com' : 'buyer@example.com',
    role: role as 'buyer' | 'artist',
    display_name: role === 'artist' ? '陳畫家 (Artist)' : '林買家 (Buyer)',
    avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${role}`,
    created_at: new Date().toISOString()
  };
}
