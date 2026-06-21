import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateProfile } from './actions';
import { ArrowLeft, Globe, AtSign, Hash, User, BookOpen, Briefcase, Heart } from 'lucide-react';

export const revalidate = 0;

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: { error?: string; updated?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/profile/edit');

  let profile: any = null;
  try {
    const rows = await sql`SELECT * FROM public.users WHERE id = ${user.id} LIMIT 1`;
    profile = rows[0] || null;
  } catch {}

  const displayName = profile?.display_name || user.email?.split('@')[0] || '';
  const avatarUrl = profile?.avatar_url
    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || '')}`;

  return (
    <div className="marble-bg min-h-screen py-12 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-stone-100/80 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Back */}
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          返回個人頁面
        </Link>

        <div className="mb-6">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">設定</p>
          <h1 className="font-serif text-2xl font-semibold text-foreground">編輯個人資料</h1>
          <p className="text-xs text-muted-foreground mt-1">填寫你的故事，讓收藏家和同好更認識你</p>
        </div>

        {searchParams.error && (
          <div className="mb-6 px-4 py-3 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        {searchParams.updated && (
          <div className="mb-6 px-4 py-3 rounded-sm bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
            ✓ 個人資料已成功更新！
          </div>
        )}

        <form action={updateProfile} className="space-y-6">
          {/* Avatar preview */}
          <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full border-2 border-white shadow-md bg-stone-100" />
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">頭像會自動同步 Google/Facebook 大頭貼</p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <User className="h-3.5 w-3.5" /> 顯示名稱
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                defaultValue={profile?.display_name || ''}
                placeholder="你的藝名或本名"
                maxLength={50}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Bio & Story */}
          <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-3">創作者故事</h2>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <Heart className="h-3.5 w-3.5" /> 一句話介紹自己
              </label>
              <input
                id="bio"
                name="bio"
                type="text"
                defaultValue={profile?.bio || ''}
                placeholder="例如：探索光與影的當代攝影師，來自台北"
                maxLength={120}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <Briefcase className="h-3.5 w-3.5" /> 創作歷程 / 學歷 / 展覽經歷
              </label>
              <textarea
                id="experience"
                name="experience"
                rows={5}
                defaultValue={profile?.experience || ''}
                placeholder={"例如：\n2020 — 國立台灣藝術大學 美術系 畢業\n2021 — 首次個展《光的語言》台北當代藝術館\n2023 — 入選 Art Taipei 台北國際藝術博覽會"}
                maxLength={2000}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Story */}
            <div>
              <label htmlFor="story" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <BookOpen className="h-3.5 w-3.5" /> 創作故事 / 理念
              </label>
              <textarea
                id="story"
                name="story"
                rows={6}
                defaultValue={profile?.story || ''}
                placeholder="分享你的創作動力、靈感來源、你希望作品帶給觀者什麼感受..."
                maxLength={3000}
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-3">社群連結</h2>

            <div>
              <label htmlFor="website" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <Globe className="h-3.5 w-3.5" /> 個人網站
              </label>
              <input
                id="website"
                name="website"
                type="url"
                defaultValue={profile?.website || ''}
                placeholder="https://your-website.com"
                className="w-full rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="instagram" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <AtSign className="h-3.5 w-3.5" /> Instagram 帳號
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-3 text-sm text-muted-foreground bg-stone-50 border border-r-0 border-border rounded-l-sm">@</span>
                <input
                  id="instagram"
                  name="instagram"
                  type="text"
                  defaultValue={profile?.instagram || ''}
                  placeholder="your_handle"
                  maxLength={30}
                  className="flex-1 rounded-l-none rounded-r-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="twitter" className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                <Hash className="h-3.5 w-3.5" /> X (Twitter) 帳號
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-3 text-sm text-muted-foreground bg-stone-50 border border-r-0 border-border rounded-l-sm">@</span>
                <input
                  id="twitter"
                  name="twitter"
                  type="text"
                  defaultValue={profile?.twitter || ''}
                  placeholder="your_handle"
                  maxLength={30}
                  className="flex-1 rounded-l-none rounded-r-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-sm bg-primary text-primary-foreground py-3.5 text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md"
            >
              儲存個人資料
            </button>
            <Link
              href="/profile"
              className="px-6 py-3.5 rounded-sm border border-border text-sm font-medium text-muted-foreground hover:bg-secondary/60 transition-all text-center"
            >
              取消
            </Link>
          </div>

          {/* Public profile link */}
          <p className="text-center text-[11px] text-muted-foreground">
            你的公開頁面：{' '}
            <Link href={`/artist/${user.id}`} className="underline underline-offset-4 hover:text-foreground transition-colors">
              /artist/{user.id.substring(0, 8)}...
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
