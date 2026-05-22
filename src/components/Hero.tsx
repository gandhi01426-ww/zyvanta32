import { useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import heroProduct from "@/assets/hero-product.webp";
import { ZyvantaLogo } from "./ZyvantaLogo";

const Hero = () => {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      lastY = window.scrollY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!imgRef.current) return;
        imgRef.current.style.transform = `translateY(${lastY * 0.25}px) rotate(${lastY * 0.02}deg)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-radial-gold blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-radial-gold blur-3xl pointer-events-none opacity-60" />

      <div className="container grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs uppercase tracking-[0.3em] text-gold">
            <Sparkles className="w-3 h-3" /> Royal Edition · 2026
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] font-black">
            Experience the<br />
            Power of <ZyvantaLogo className="text-5xl md:text-7xl" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Futuristic luxury essentials engineered for those who command attention. Crafted in obsidian. Finished in gold.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#shop" className="group relative inline-flex items-center gap-3 bg-gradient-gold text-noir font-bold px-8 py-4 rounded-full shadow-gold animate-glow-pulse hover:scale-105 transition-transform">
              Shop Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <span className="absolute inset-0 shimmer" />
              </span>
            </a>
            <a href="#whyus" className="px-8 py-4 rounded-full glass gold-border text-gold uppercase tracking-widest text-sm hover:shadow-gold transition-all">
              Discover
            </a>
          </div>
          <div className="flex gap-8 pt-8 border-t border-gold/20">
            {[
              { v: "120K+", l: "Customers" },
              { v: "4.9★", l: "Rating" },
              { v: "48H", l: "Shipping" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl text-gold-gradient font-bold">{s.v}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div ref={imgRef} className="relative animate-float">
          <div className="absolute inset-0 bg-radial-gold blur-3xl scale-110" />
          <div className="absolute inset-10 rounded-full border border-gold/30 animate-spin-slow" />
          <div className="absolute inset-20 rounded-full border border-gold/20 animate-spin-slow" style={{ animationDirection: "reverse" }} />
          <img
            src={heroProduct}
            alt="Zyvanta luxury smartwatch in black and gold"
            width={1024} height={1024}
            loading="eager"
            decoding="async"
            className="relative w-full max-w-lg mx-auto drop-shadow-[0_30px_60px_hsl(43_86%_58%/0.4)]"
          />
        </div>
      </div>
    </section>
  );
};
export default Hero;
