'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Upload, Loader2, LogOut, Eye, ImageIcon, Camera, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfileHeader({
  user,
  profile,
  displayName,
  avatarUrl,
  myArtworks,
  orderCount
}: {
  user: any;
  profile: any;
  displayName: string;
  avatarUrl: string;
  myArtworks: any[];
  orderCount: number;
}) {
  const router = useRouter();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      if (type === 'avatar') setIsUploadingAvatar(true);
      else setIsUploadingCover(true);

      const res = await fetch('/api/users/me/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '上傳失敗');
      }

      toast.success(type === 'avatar' ? '頭像更新成功' : '封面更新成功');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } catch (e) {
      setIsLoggingOut(false);
    }
  };

  const defaultCover = "linear-gradient(to right, #f5f5f4, #fef3c7, #f5f5f4)"; // stone-100 to amber-50 to stone-100

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm shadow-sm overflow-hidden">
      {/* Hidden Inputs */}
      <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} />

      {/* Cover bar */}
      <div 
        className="group relative h-32 w-full bg-cover bg-center cursor-pointer overflow-hidden transition-all"
        style={{ background: profile?.cover_url ? `url(${profile.cover_url}) center/cover` : defaultCover }}
        onClick={() => !isUploadingCover && coverInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          {isUploadingCover ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-white font-medium text-sm transition-all drop-shadow-md bg-black/40 px-3 py-1.5 rounded-full">
              <Camera className="h-4 w-4" />
              更換封面照片
            </div>
          )}
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Avatar + name row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">
          <div className="flex items-end gap-4">
            <div 
              className="group relative h-24 w-24 rounded-full border-4 border-white shadow-md bg-stone-100 flex-shrink-0 cursor-pointer overflow-hidden"
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                )}
              </div>
            </div>
            <div className="pb-1 max-w-[200px] sm:max-w-[300px]">
              <h1 className="font-serif text-xl font-semibold text-foreground truncate" title={displayName}>{displayName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={user.email}>{user.email}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1 flex-wrap">
            <Link
              href="/profile/upload"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              上傳作品
            </Link>
            <Link
              href="/profile/edit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm border border-border text-foreground hover:bg-secondary/60 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" />
              編輯個人資料
            </Link>
            <Link
              href={`/artist/${user.id}`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              查看公開頁面
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide rounded-sm border border-border text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              登出
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
          {[
            { label: '我的作品', value: myArtworks.length, icon: Package },
            { label: '購買紀錄', value: orderCount, icon: ShoppingBag },
            { label: '會員等級', value: 'Standard', icon: Edit3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-1.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-lg font-serif font-semibold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
