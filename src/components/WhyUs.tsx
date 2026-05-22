import { Award, Truck, ShieldCheck, Gem } from "lucide-react";

const badges = [
  { icon: Gem, title: "Premium Quality", text: "Materials sourced from elite ateliers worldwide." },
  { icon: Truck, title: "Fast Worldwide Shipping", text: "Express 48-hour dispatch with signature delivery." },
  { icon: ShieldCheck, title: "Trusted by 120K+", text: "Buyer protection on every single order." },
  { icon: Award, title: "Award-Winning Design", text: "Recognized by luxury design publications." },
];

const WhyUs = () => (
  <section id="whyus" className="py-32 relative">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-xs uppercase tracking-[0.4em] text-gold">Why Zyvanta</span>
        <h2 className="font-display text-4xl md:text-6xl">Built on <span className="text-gold-gradient">Trust</span>, Delivered with <span className="text-gold-gradient">Power</span></h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((b, i) => (
          <div key={i} className="relative glass rounded-3xl p-8 text-center hover:-translate-y-2 transition-all duration-500 gold-border group">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-gold grid place-items-center shadow-glow group-hover:animate-glow-pulse">
              <b.icon className="w-7 h-7 text-noir" />
            </div>
            <h3 className="font-display text-xl mt-8 mb-3 text-gold-gradient">{b.title}</h3>
            <p className="text-sm text-muted-foreground">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
export default WhyUs;
