let scriptPromise: Promise<boolean> | null = null;

export type GatewayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type GatewayOptions = {
  key: string;
  orderId: string;
  amount: number;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (response: GatewayResponse) => void;
  onDismiss: () => void;
};

export function loadPaymentGateway() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openPaymentGateway(options: GatewayOptions) {
  const loaded = await loadPaymentGateway();
  if (!loaded) throw new Error("Payment gateway could not be loaded.");
  const Razorpay = (window as unknown as { Razorpay: new (config: unknown) => { open: () => void } }).Razorpay;
  const checkout = new Razorpay({
    key: options.key,
    amount: options.amount * 100,
    currency: "INR",
    name: options.name,
    description: options.description,
    image: "/favicon.ico",
    order_id: options.orderId,
    prefill: options.prefill,
    theme: { color: "#16753d" },
    handler: options.onSuccess,
    modal: { ondismiss: options.onDismiss },
  });
  checkout.open();
}
