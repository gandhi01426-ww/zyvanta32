import { Flame, Search, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fallbackCrownWants, fallbackProducts, Product } from "@/data/catalog";
import { getHomepageSections, getProducts } from "@/services/api";
import { inr } from "@/lib/currency";

const FeaturedSlideshow = ({ products }: { products: Product[] }) => {
  const [i, setI] = useState(0);
  const slides = products.filter((product) => product.is_featured).slice(0, 6);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  const visible = [0, 1, 2].map((k) => slides[(i + k) % slides.length]).filter(Boolean);

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Featured Now
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-2">
            Royal <span className="text-gold-gradient">picks</span>, on rotation
          </h2>
        </div>
        <div className="inline-flex gap-2">
          <button onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)} className="w-10 h-10 rounded-full glass gold-border grid place-items-center text-gold">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setI((x) => (x + 1) % slides.length)} className="w-10 h-10 rounded-full glass gold-border grid place-items-center text-gold">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((product, k) => (
          <a key={`${product.id}-${k}-${i}`} href="#shop" className="glass gold-border rounded-3xl overflow-hidden block animate-fade-up">
            <div className="relative aspect-[4/3] bg-noir-soft overflow-hidden">
              <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.25em] bg-gradient-gold text-noir px-2.5 py-1 rounded-full font-bold">{product.tag}</span>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-base truncate">{product.name}</h3>
              <span className="text-gold-gradient font-bold text-sm shrink-0">{inr(product.price)}</span>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {slides.map((_, k) => (
          <button key={k} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? "bg-gold w-6" : "bg-gold/30 w-2"}`} aria-label={`Slide ${k + 1}`} />
        ))}
      </div>
    </div>
  );
};

const Discover = () => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [mostSearched, setMostSearched] = useState(fallbackCrownWants);

  useEffect(() => {
    getProducts().then(setProducts);
    getHomepageSections().then((sections) => setMostSearched(sections.crownWants));
  }, []);

  const categories = useMemo(() => {
    const byCategory = new Map<string, { name: string; img?: string; models: string[] }>();
    products.forEach((product) => {
      const category = byCategory.get(product.category) || { name: product.category, img: product.image, models: [] };
      if (category.models.length < 4) category.models.push(product.name);
      byCategory.set(product.category, category);
    });
    return Array.from(byCategory.values());
  }, [products]);

  const topStories = products.slice(0, 4).map((product) => ({
    title: `${product.name}: ${product.tagline}`,
    tag: product.category,
    img: product.gallery?.[1] || product.image,
  }));

  return (
    <section id="discover" className="relative py-24">
      <div className="container space-y-20">
        <FeaturedSlideshow products={products} />

        <div>
          <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
                <Flame className="w-3.5 h-3.5" /> Top Stories
              </span>
              <h2 className="font-display text-3xl md:text-5xl mt-2">
                <span className="text-gold-gradient">Trending</span> on Zyvanta
              </h2>
            </div>
            <a href="#shop" className="text-xs uppercase tracking-[0.3em] text-gold inline-flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topStories.map((story) => (
              <a key={story.title} href="#shop" className="group glass gold-border rounded-3xl overflow-hidden block">
                <div className="relative aspect-[4/3] bg-noir-soft overflow-hidden">
                  <img src={story.img} alt={story.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.25em] bg-gradient-gold text-noir px-2.5 py-1 rounded-full font-bold">{story.tag}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base leading-snug group-hover:text-gold transition-colors">{story.title}</h3>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-2 inline-flex items-center gap-1">
                    Shop now <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> Most Searched on Zyvanta
            </span>
            <h2 className="font-display text-3xl md:text-5xl mt-2">
              What the <span className="text-gold-gradient">crown</span> wants
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {mostSearched.map((q) => (
              <a key={q} href="#shop" className="glass gold-border rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-gold hover:shadow-gold transition-all">
                {q}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> All Categories
            </span>
            <h2 className="font-display text-3xl md:text-5xl mt-2">
              Explore every <span className="text-gold-gradient">model</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((category) => (
              <div key={category.name} className="glass gold-border rounded-3xl p-5">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-noir-soft mb-4">
                  <img src={category.img} alt={category.name} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-display text-xl text-white">{category.name}</h3>
                </div>
                <ul className="space-y-1.5">
                  {category.models.map((model) => (
                    <li key={model}>
                      <a href="#shop" className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center justify-between gap-2">
                        <span>{model}</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Discover;
