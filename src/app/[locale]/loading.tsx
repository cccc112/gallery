import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse tracking-widest">
        LOADING...
      </p>
    </div>
  );
}
