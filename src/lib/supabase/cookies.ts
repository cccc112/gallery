export const supabaseCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
};
