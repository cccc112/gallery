'use client';

import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

export default function GalleryForm({ search, type, rentable, tags = [] }: { search: string, type: string, rentable: boolean, tags?: string[] }) {
  const t = useTranslations('Gallery');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('search') as string;
    const newRentable = formData.get('rentable') === 'true';

    const p = new URLSearchParams();
    if (newSearch) p.set('search', newSearch);
    if (type !== 'all') p.set('type', type);
    if (newRentable) p.set('rentable', 'true');
    tags.forEach(t => p.append('tag', t));
    
    startTransition(() => {
      router.push(`/gallery${p.toString() ? `?${p.toString()}` : ''}`);
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 勾選/取消勾選時，立刻觸發查詢
    const form = e.target.form;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input type="hidden" name="type" value={type} />
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer self-center hover:text-foreground transition-colors">
        <input
          type="checkbox"
          name="rentable"
          value="true"
          defaultChecked={rentable}
          onChange={handleCheckboxChange}
          disabled={isPending}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
        />
        {t('showRentableOnly')}
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
        {isPending ? tCommon('loading') : t('searchBtn')}
      </button>
    </form>
  );
}
