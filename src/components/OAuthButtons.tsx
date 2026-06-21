'use client';

import { createClient } from '@/lib/supabase/client';

interface OAuthButtonsProps {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo = '/' }: OAuthButtonsProps) {
  const supabase = createClient();

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    // 直接用當下的 origin，避免 NEXT_PUBLIC_SITE_URL 指向 localhost 導致 Vercel 上 redirect 失敗
    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(redirectTo)}`,
        scopes: provider === 'facebook' ? 'email,public_profile' : undefined,
      },
    });
    if (error) console.error(`[${provider} OAuth]`, error.message);
  };

  return (
    <div className="space-y-3">
      {/* 分隔線 */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          或使用社群帳號
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        className="w-full flex items-center justify-center gap-3 rounded-sm border border-border bg-white/80 hover:bg-white hover:border-stone-300 hover:shadow-sm px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 group"
      >
        {/* Google SVG Icon */}
        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        使用 Google 帳號登入
        <span className="ml-auto text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          推薦
        </span>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={() => handleOAuth('facebook')}
        className="w-full flex items-center justify-center gap-3 rounded-sm border border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] px-4 py-3 text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {/* Facebook SVG Icon */}
        <svg className="h-4 w-4 flex-shrink-0 fill-white" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        使用 Facebook 帳號登入
      </button>
    </div>
  );
}
