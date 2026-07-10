'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Compass, Home, Upload, LogIn, UserPlus,
  Menu, X, LogOut, ChevronDown, User, LayoutDashboard,
  Heart, Sparkles, FileText, Bell
} from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { createClient } from '@/lib/supabase/client';

const IconMap: Record<string, React.ElementType> = {
  Home, Compass, LayoutDashboard, FileText
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url?: string; role: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // 路由切換時關閉選單
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Auth State Listener (100% 依賴 Client Side，不受 SSR 快取影響)
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          
          // Fetch profile data
          const res = await fetch('/api/users/me');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setProfile(data.profile);
            } else {
              setUser(null);
              setProfile(null);
              supabase.auth.signOut();
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('Auth fetch error:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchUserAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          const res = await fetch('/api/users/me');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setProfile(data.profile);
            } else {
              // 伺服器認為 token 無效（例如已被撤銷或過期），強制清理前端狀態
              setUser(null);
              setProfile(null);
              supabase.auth.signOut();
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 取得未讀訊息數量
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 點外部關閉 dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const avatarUrl =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.email || 'guest')}`;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '使用者';

  const navLinks = [
    { href: '/', label: '首頁', icon: 'Home' },
    { href: '/gallery', label: '探索藝廊', icon: 'Compass' },
    { href: '/contract-template', label: '合約預覽', icon: 'FileText' },
    ...(profile?.role === 'artist' ? [{ href: '/admin', label: '管理後台', icon: 'LayoutDashboard' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto flex h-16 lg:h-18 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* ── Logo + Desktop Nav ── */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <span className="text-xl lg:text-2xl font-serif font-semibold tracking-tight text-foreground group-hover:opacity-75 transition-opacity">
              Atelier Blanc
            </span>
            <span className="hidden lg:inline text-[10px] font-semibold text-foreground/60 uppercase tracking-widest border-l border-border pl-2.5">
              乙太藝廊
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map(({ href, label, icon }) => {
              const Icon = IconMap[icon] || Home;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-150 ${
                    isActive(href)
                      ? 'text-foreground bg-secondary font-semibold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2">
          {isLoadingAuth ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2">
              <div className="h-4 w-16 bg-secondary animate-pulse rounded-md"></div>
              <div className="h-4 w-16 bg-secondary animate-pulse rounded-md"></div>
            </div>
          ) : user ? (
            <>
              {/* Upload CTA */}
              <Link
                href="/profile/upload"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold tracking-wide rounded-md border border-border bg-secondary/80 hover:bg-secondary text-foreground transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                上傳作品
              </Link>

              {/* Wallet Button */}
              <ConnectWalletButton />

              {/* Notifications */}
              <Link href="/dashboard/chat" className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all mr-1">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 border border-border/60 hover:border-border hover:bg-secondary/40 transition-all"
                  aria-expanded={dropdownOpen}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-7 w-7 rounded-full border border-border/40 bg-stone-100 object-cover"
                  />
                  <span className="hidden sm:block text-xs font-semibold text-foreground max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border/80 rounded-sm shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User info header */}
                    <div className="px-4 py-3.5 border-b border-border/50 bg-stone-50">
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full border border-border bg-stone-100" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        個人資訊頁面
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                        資產管理後台
                      </Link>
                      <Link
                        href="/profile/upload"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                        上傳新作品
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                        我的最愛
                      </Link>
                      <Link
                        href="/generate"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        AI 藝術生成
                      </Link>
                      <Link
                        href="/gallery"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                        探索藝廊
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border/50 py-1.5">
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          登出帳號
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                登入
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                免費註冊
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-white">
          <nav className="flex flex-col px-5 py-3 gap-1">
            {navLinks.map(({ href, label, icon }) => {
              const Icon = IconMap[icon] || Home;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

            <div className="mt-2 pt-3 border-t border-border/50 flex flex-col gap-1">
              {isLoadingAuth ? (
                <div className="h-8 w-full bg-secondary animate-pulse rounded-md" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-secondary/30">
                    <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full border border-border" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> 個人資訊
                  </Link>
                  <Link href="/favorites" className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                    <Heart className="h-4 w-4 text-muted-foreground" /> 我的最愛
                  </Link>
                  <Link href="/generate" className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> AI 藝術生成
                  </Link>
                  <Link href="/profile/upload" className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" /> 上傳作品
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                      <LogOut className="h-4 w-4" /> 登出
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                    <LogIn className="h-4 w-4" /> 登入
                  </Link>
                  <Link href="/register" className="flex items-center gap-2.5 px-3 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-md">
                    <UserPlus className="h-4 w-4" /> 免費註冊
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
