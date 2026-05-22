import { ArrowRight } from "lucide-react";

const CTA = () => (
  <section className="py-32 relative">
    <div className="container">
      <div className="relative glass gold-border rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden shadow-elite">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-radial-gold blur-3xl pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="relative space-y-8">
          <span className="text-xs uppercase tracking-[0.4em] text-gold">Limited Royal Drop</span>
          <h2 className="font-display text-4xl md:text-7xl leading-tight">
            Upgrade Your Lifestyle<br />
            with <span className="text-gold-gradient">Zyvanta</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Join the inner circle. Free express shipping on your first order — gold-sealed and signed.
          </p>
          <a href="#shop" className="group inline-flex items-center gap-3 bg-gradient-gold text-noir font-bold px-10 py-5 rounded-full shadow-gold animate-glow-pulse hover:scale-105 transition-transform text-lg">
            Claim Yours Now
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  </section>
);
export default CTA;
