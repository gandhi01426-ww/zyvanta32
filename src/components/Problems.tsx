import { Clock, ShieldOff, PackageX, Frown, ArrowRight } from "lucide-react";

const problems = [
  { icon: PackageX, title: "Cheap, generic products", solve: "Premium curation only" },
  { icon: Clock, title: "Endless shipping waits", solve: "48-hour express dispatch" },
  { icon: ShieldOff, title: "Sketchy stores, no trust", solve: "Verified & buyer-protected" },
  { icon: Frown, title: "Underwhelming unboxing", solve: "Royal packaging experience" },
];

const Problems = () => (
  <section className="py-32 relative">
    <div className="absolute inset-0 bg-gradient-noir pointer-events-none" />
    <div className="container relative">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-xs uppercase tracking-[0.4em] text-gold">Why Customers Switch</span>
        <h2 className="font-display text-4xl md:text-6xl">From <span className="text-destructive/80">Frustration</span> to <span className="text-gold-gradient">Royalty</span></h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {problems.map((p, i) => (
          <div key={i} className="glass gold-border rounded-3xl p-8 hover:shadow-gold transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl glass grid place-items-center mb-6 group-hover:bg-gradient-gold transition-all">
              <p.icon className="w-6 h-6 text-gold group-hover:text-noir transition-colors" />
            </div>
            <h3 className="font-display text-lg mb-3 text-foreground/80 line-through decoration-destructive/60">{p.title}</h3>
            <div className="flex items-center gap-2 text-gold">
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-semibold">{p.solve}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
export default Problems;
