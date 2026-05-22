import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, ChevronLeft, ChevronRight, Check, LockKeyhole, MapPin, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { inr, inr2, toInrAmount } from "@/lib/currency";
import { openPaymentGateway } from "@/lib/payment-gateway";
import { CheckoutCustomer, createCodOrder, createPaymentOrder, getCheckoutOptions, PaymentAvailability, PaymentSummary, verifyPayment } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { fallbackCourses } from "@/data/catalog";

type Step = "address" | "payment";
type PayMethod = "online" | "cod";

const inputCls = "w-full bg-transparent border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60";
const fallbackCourseIds = new Set(fallbackCourses.map((course) => course.id));

const initialCustomer: CheckoutCustomer = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  pincode: "",
  city: "",
  state: "",
};

const paymentMethodCards = [
  { id: "online" as PayMethod, label: "Pay Now", desc: "UPI, cards, wallets and net banking", icon: LockKeyhole },
  { id: "cod" as PayMethod, label: "Cash on Delivery", desc: "Pay when the order reaches you", icon: Banknote },
];
const noUnavailable = { online: [] as string[], cod: [] as string[] };
const listNames = (names: string[]) => names.slice(0, 3).join(", ") + (names.length > 3 ? ` and ${names.length - 3} more` : "");

const Checkout = () => {
  const { items, clear, openCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("address");
  const [payMethod, setPayMethod] = useState<PayMethod>("online");
  const [customer, setCustomer] = useState<CheckoutCustomer>(initialCustomer);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [paymentAvailability, setPaymentAvailability] = useState<PaymentAvailability | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(noUnavailable);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");

  const localSummary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + toInrAmount(item.price) * item.qty, 0);
    const shipping = subtotal >= 2000 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05);
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  }, [items]);

  const checkoutItems = useMemo(() => items.map((item) => ({ id: item.id, qty: item.qty })), [items]);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const localUnavailable = useMemo(() => {
    const unavailable = { online: [] as string[], cod: [] as string[] };
    items.forEach((item) => {
      const isCourse = item.item_type === "course" || fallbackCourseIds.has(item.id);
      if (item.allow_pay_now === false) unavailable.online.push(item.name);
      if (typeof item.allow_cod === "boolean" ? !item.allow_cod : isCourse) unavailable.cod.push(item.name);
    });
    return unavailable;
  }, [items]);
  const localAvailability = useMemo<PaymentAvailability>(() => ({
    online: localUnavailable.online.length === 0,
    cod: localUnavailable.cod.length === 0,
  }), [localUnavailable.cod.length, localUnavailable.online.length]);
  const availability = useMemo(
    () => paymentAvailability || localAvailability,
    [localAvailability, paymentAvailability],
  );
  const unavailable = paymentAvailability ? paymentUnavailable : localUnavailable;
  const paymentMethods = paymentMethodCards.filter((method) => availability[method.id]);
  const unavailableMessages = [
    unavailable.online.length ? `Pay Now unavailable for ${listNames(unavailable.online)}.` : "",
    unavailable.cod.length ? `Cash on Delivery unavailable for ${listNames(unavailable.cod)}.` : "",
  ].filter(Boolean);

  useEffect(() => {
    setPaymentAvailability(null);
    setPaymentUnavailable(noUnavailable);
    setSummary(null);
    setAppliedCouponCode("");
  }, [items]);

  useEffect(() => {
    if (availability[payMethod]) return;
    const firstAvailable = paymentMethodCards.find((method) => availability[method.id])?.id;
    if (firstAvailable) setPayMethod(firstAvailable);
  }, [availability, payMethod]);

  const validate = () => {
    if (!customer.full_name.trim()) return "Full name is required.";
    if (!/^\d{10}$/.test(customer.phone)) return "Enter a valid 10-digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return "Enter a valid email address.";
    if (!customer.address.trim()) return "Address is required.";
    if (!/^\d{6}$/.test(customer.pincode)) return "Enter a valid 6-digit pincode.";
    if (!customer.city.trim()) return "City is required.";
    if (!customer.state.trim()) return "State is required.";
    return "";
  };

  const continueToPayment = async (event: FormEvent) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast({ title: "Check your details", description: error });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Your bag is empty", description: "Add a product before checkout." });
      navigate("/");
      return;
    }
    setLoading(true);
    try {
      const options = await getCheckoutOptions(checkoutItems, appliedCouponCode);
      setSummary(options.summary);
      setPaymentAvailability(options.payment_methods);
      setPaymentUnavailable(options.unavailable);
      const firstAvailable = paymentMethodCards.find((method) => options.payment_methods[method.id])?.id;
      if (firstAvailable) setPayMethod(firstAvailable);
      setStep("payment");
    } catch (err) {
      toast({ title: "Unable to load payment options", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const successPath = (orderId: string, orderCode: string, method: PayMethod) =>
    `/checkout/success?method=${method}&order=${encodeURIComponent(orderId)}&code=${encodeURIComponent(orderCode)}`;

  const refreshCheckoutSummary = async (code: string) => {
    const options = await getCheckoutOptions(checkoutItems, code);
    setSummary(options.summary);
    setPaymentAvailability(options.payment_methods);
    setPaymentUnavailable(options.unavailable);
    const firstAvailable = paymentMethodCards.find((method) => options.payment_methods[method.id])?.id;
    if (firstAvailable) setPayMethod(firstAvailable);
    return options.summary;
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast({ title: "Enter a coupon code" });
      return;
    }
    setCouponLoading(true);
    try {
      const nextSummary = await refreshCheckoutSummary(code);
      setCouponInput(nextSummary.coupon_code || code);
      setAppliedCouponCode(nextSummary.coupon_code || code);
      toast({ title: "Coupon applied", description: `${nextSummary.coupon_discount_percent || 0}% discount added.` });
    } catch (err) {
      try {
        await refreshCheckoutSummary("");
      } catch {
        setSummary(null);
      }
      setAppliedCouponCode("");
      toast({ title: "Coupon not applied", description: err instanceof Error ? err.message : "Please check the coupon code." });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async () => {
    setCouponLoading(true);
    try {
      await refreshCheckoutSummary("");
      setCouponInput("");
      setAppliedCouponCode("");
      toast({ title: "Coupon removed" });
    } catch (err) {
      toast({ title: "Unable to update coupon", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setCouponLoading(false);
    }
  };

  const placeCodOrder = async () => {
    const order = await createCodOrder(customer, checkoutItems, appliedCouponCode);
    clear();
    navigate(successPath(order.order_id, order.order_code, "cod"), { replace: true });
  };

  const startOnlinePayment = async () => {
    const paymentOrder = await createPaymentOrder(customer, checkoutItems, appliedCouponCode);
    setSummary(paymentOrder.summary);
    await openPaymentGateway({
      key: paymentOrder.key_id,
      orderId: paymentOrder.payment_order_id,
      amount: paymentOrder.amount,
      name: "Zyvanta",
      description: "Secure order payment",
      prefill: { name: customer.full_name, email: customer.email, contact: customer.phone },
      onSuccess: async (payment) => {
        try {
          const order = await verifyPayment(customer, checkoutItems, payment, appliedCouponCode);
          clear();
          navigate(successPath(order.order_id, order.order_code, "online"), { replace: true });
        } catch (err) {
          navigate(`/checkout/failure?reason=${encodeURIComponent(err instanceof Error ? err.message : "Payment verification failed.")}`);
        }
      },
      onDismiss: () => {
        toast({ title: "Payment cancelled", description: "No order was created." });
        setLoading(false);
      },
    });
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      toast({ title: "Your bag is empty", description: "Add a product before checkout." });
      navigate("/");
      return;
    }
    if (!availability[payMethod]) {
      toast({ title: "Payment method unavailable", description: "Choose a payment method available for every item in your bag." });
      return;
    }

    setLoading(true);
    try {
      if (payMethod === "cod") {
        await placeCodOrder();
        return;
      }

      await startOnlinePayment();
    } catch (err) {
      toast({ title: "Unable to place order", description: err instanceof Error ? err.message : "Please try again." });
      setLoading(false);
    }
  };

  const display = summary || { ...localSummary, discount: 0, coupon_code: "", coupon_discount_percent: 0, items: [] };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[520px] h-[520px] bg-radial-gold blur-3xl pointer-events-none" />
        <div className="container relative">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold hover:opacity-80 mb-8">
            <ChevronLeft className="w-4 h-4" /> Continue Shopping
          </button>

          <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
            <div className="glass gold-border rounded-3xl p-6 md:p-9 shadow-elite">
              <div className="flex items-center gap-3 mb-8 text-[10px] uppercase tracking-[0.3em]">
                <span className={step === "address" ? "text-gold" : "text-muted-foreground"}>1 Address</span>
                <ChevronRight className="w-3 h-3 text-gold/40" />
                <span className={step === "payment" ? "text-gold" : "text-muted-foreground"}>2 Payment</span>
                <ChevronRight className="w-3 h-3 text-gold/40" />
                <span className="text-muted-foreground">3 Confirm</span>
              </div>

              {step === "address" && (
                <>
                  <h1 className="font-display text-3xl md:text-5xl inline-flex items-center gap-3">
                    <MapPin className="w-7 h-7 text-gold" /> Checkout
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2">Tell us where your royal package should arrive.</p>
                  <form onSubmit={continueToPayment} className="grid sm:grid-cols-2 gap-3 mt-8">
                    <input className={inputCls} placeholder="Full Name" value={customer.full_name} onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })} maxLength={80} />
                    <input className={inputCls} placeholder="Phone Number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} maxLength={120} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} maxLength={160} />
                    <input className={inputCls} placeholder="Pincode" value={customer.pincode} onChange={(e) => setCustomer({ ...customer, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                    <input className={inputCls} placeholder="City" value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} maxLength={60} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="State" value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} maxLength={60} />
                    <button disabled={loading} className="sm:col-span-2 mt-3 bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2 shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-50">
                      {loading ? "Sending details..." : "Continue"} <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}

              {step === "payment" && (
                <>
                  <h1 className="font-display text-3xl md:text-5xl inline-flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-gold" /> Payment
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    {paymentMethods.length ? "Choose how you would like to complete this order." : "No payment method is available for every item in this bag."}
                  </p>
                  {unavailableMessages.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-gold/20 p-4 text-xs text-muted-foreground space-y-1">
                      {unavailableMessages.map((message) => <div key={message}>{message}</div>)}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-8">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPayMethod(method.id)}
                        className={`text-left p-5 rounded-2xl border transition-all ${payMethod === method.id ? "border-gold bg-gold/5 shadow-gold" : "border-gold/20 hover:border-gold/50"}`}
                      >
                        <method.icon className="w-5 h-5 text-gold" />
                        <div className="font-display mt-3">{method.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{method.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-gold/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gold" /> Coupon
                      </div>
                      {appliedCouponCode && (
                        <button type="button" onClick={removeCoupon} disabled={couponLoading} className="text-[10px] uppercase tracking-widest text-gold inline-flex items-center gap-1 disabled:opacity-50">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        disabled={couponLoading}
                        maxLength={32}
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading} className="bg-gradient-gold text-noir rounded-xl px-5 text-xs uppercase tracking-widest font-bold disabled:opacity-50">
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {appliedCouponCode && display.discount > 0 && (
                      <div className="text-xs text-gold">
                        {appliedCouponCode} applied: {display.coupon_discount_percent}% off saved ₹{display.discount.toLocaleString("en-IN")}.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 glass gold-border rounded-2xl p-4 text-sm text-muted-foreground inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                    {paymentMethods.length === 0 ? "Edit your bag or place separate orders for items with different payment eligibility." : payMethod === "online" ? "Your payment is verified securely before we create a paid order." : `Pay ${inr(display.total)} when your order is delivered.`}
                  </div>

                  <div className="mt-7 flex gap-3">
                    <button onClick={() => setStep("address")} className="px-5 py-3 rounded-full glass gold-border text-gold text-xs uppercase tracking-widest">Back</button>
                    <button disabled={loading || paymentMethods.length === 0} onClick={placeOrder} className="flex-1 bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2 shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-50">
                      {loading ? "Processing..." : paymentMethods.length === 0 ? "Unavailable" : payMethod === "online" ? "Pay Now" : "Place Order"} <Check className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <aside className="glass gold-border rounded-3xl p-6 shadow-elite sticky top-24">
              <h2 className="font-display text-2xl inline-flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" /> Order Summary
              </h2>
              <div className="mt-5 space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {items.length === 0 && <div className="text-sm text-muted-foreground">Your bag is empty.</div>}
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-noir-soft" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {item.qty}</div>
                    </div>
                    <div className="text-sm font-bold text-gold-gradient">{inr2(toInrAmount(item.price) * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-gold/20 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Items ({itemCount})</span><span>₹{display.subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground inline-flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span><span>{display.shipping === 0 ? "FREE" : `₹${display.shipping}`}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{display.tax.toLocaleString("en-IN")}</span></div>
                {display.discount > 0 && (
                  <div className="flex justify-between text-gold">
                    <span>Coupon {display.coupon_code ? `(${display.coupon_code})` : ""}</span>
                    <span>-₹{display.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-3 border-t border-gold/20"><span>Total</span><span className="text-gold-gradient text-xl">₹{display.total.toLocaleString("en-IN")}</span></div>
              </div>

              <button onClick={openCart} className="mt-5 w-full glass gold-border text-gold rounded-full py-3 text-xs uppercase tracking-widest">
                Edit Bag
              </button>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Checkout;
