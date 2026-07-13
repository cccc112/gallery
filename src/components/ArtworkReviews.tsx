import { Star, MessageCircle } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function ArtworkReviews({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <section className="py-12 border-t border-border/40 mt-12 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-8 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            藏家評價
          </h3>
          <p className="text-sm text-muted-foreground bg-white p-6 rounded-lg border border-border/50 text-center">
            目前尚無評價。當有藏家收藏此作品並留下評價後，將會顯示於此。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t border-border/40 mt-12 bg-stone-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-8 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          藏家評價
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => {
            const name = review.display_name || review.email?.split('@')[0] || '匿名藏家';
            const avatar = review.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
            
            return (
              <div key={review.id} className="bg-white p-5 rounded-lg border border-border/50 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full border border-border overflow-hidden bg-stone-100 flex-shrink-0">
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('zh-TW')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-200'}`}
                    />
                  ))}
                </div>
                
                <p className="text-sm text-foreground/80 leading-relaxed italic flex-1">
                  &quot;{review.comment}&quot;
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
