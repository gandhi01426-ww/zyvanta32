import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { ProductReview, fallbackReviews } from "@/data/catalog";
import { getFeaturedReviews } from "@/services/api";

const Reviews = () => {
  const [i, setI] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>(fallbackReviews);

  useEffect(() => {
    getFeaturedReviews().then(setReviews);
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [reviews.length]);

  const activeReview = reviews[i] || fallbackReviews[0];

  return (
    <section id="reviews" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-gold opacity-30 blur-3xl" />
      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.4em] text-gold">Voices of the Crown</span>
          <h2 className="font-display text-4xl md:text-6xl">Loved by the <span className="text-gold-gradient">Elite</span></h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="glass gold-border rounded-3xl p-10 md:p-14 shadow-elite relative overflow-hidden">
            <Quote className="absolute -top-2 -left-2 w-32 h-32 text-gold/10" />
            <div key={i} className="animate-fade-up relative">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: activeReview.rating || 5 }).map((_, k) => (
                  <Star key={k} className="w-5 h-5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-xl md:text-2xl font-display leading-relaxed mb-8">
                "{activeReview.comment}"
              </p>
              <div className="flex items-center gap-4">
                <img src={activeReview.avatar} alt={activeReview.name} loading="lazy" width={56} height={56}
                  className="w-14 h-14 rounded-full border-2 border-gold object-cover" />
                <div>
                  <div className="font-bold text-gold-gradient">{activeReview.name}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">{activeReview.role}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`Review ${k + 1}`}
                className={`h-1.5 rounded-full transition-all ${k === i ? "w-10 bg-gradient-gold" : "w-4 bg-gold/30"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default Reviews;
