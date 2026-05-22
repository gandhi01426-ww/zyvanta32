import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, ChevronRight, Home, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const OrderResult = ({ status }: { status: "success" | "failure" }) => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const orderCode = params.get("code") || (orderId ? orderId.slice(0, 10).toUpperCase() : "");
  const reason = params.get("reason");
  const method = params.get("method");
  const success = status === "success";
  const successMessage =
    method === "cod"
      ? "Thank you. Your Cash on Delivery order is confirmed. Please pay when your order reaches you."
      : "Thank you. Your payment is complete and your order is confirmed.";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative min-h-screen pt-28 grid place-items-center overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gold opacity-40 blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="glass gold-border rounded-3xl p-8 md:p-12 shadow-elite text-center max-w-2xl mx-auto">
            <div className={`w-20 h-20 rounded-full mx-auto grid place-items-center shadow-glow ${success ? "bg-gradient-gold animate-glow-pulse" : "bg-destructive/10"}`}>
              {success ? <Check className="w-10 h-10 text-noir" strokeWidth={3} /> : <AlertTriangle className="w-10 h-10 text-destructive" />}
            </div>
            <h1 className="font-display text-3xl md:text-5xl mt-6 inline-flex items-center justify-center gap-2">
              {success && <Sparkles className="w-6 h-6 text-gold" />}
              {success ? "Order Confirmed" : "Payment Failed"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {success
                ? successMessage
                : reason || "No order was created. Please try again or choose Cash on Delivery."}
            </p>
            {success && orderCode && (
              <div className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Confirmation Code <span className="font-mono text-gold">{orderCode}</span>
              </div>
            )}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/" className="bg-gradient-gold text-noir rounded-full px-8 py-3 text-xs uppercase tracking-widest font-bold shadow-gold inline-flex items-center justify-center gap-2">
                {success ? "Visit Again" : "Shop Now"} {success ? <Home className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Link>
              {!success && (
                <Link to="/checkout" className="glass gold-border text-gold rounded-full px-8 py-3 text-xs uppercase tracking-widest">
                  Try Again
                </Link>
              )}
            </div>
            {success && (
              <p className="mt-5 text-sm text-muted-foreground">
                You can track your order in WhatsApp and email, and we will reach out shortly.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrderResult;
