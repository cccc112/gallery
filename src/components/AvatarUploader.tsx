'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarUploaderProps {
  initialUrl: string;
  userId: string;
}

export function AvatarUploader({ initialUrl, userId }: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('圖片大小不能超過 2MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('artworks').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (err: any) {
      setError(err.message || '上傳失敗');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative group">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-20 w-20 rounded-full border-2 border-white shadow-md bg-stone-100 object-cover"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
        </button>
      </div>
      
      {error && <p className="text-[10px] text-rose-500">{error}</p>}
      
      <input
        type="hidden"
        name="avatar_url"
        value={avatarUrl}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
      >
        更換頭像
      </button>
    </div>
  );
}
