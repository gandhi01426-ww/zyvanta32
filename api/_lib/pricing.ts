import { supabaseConfigured, supabaseFetch } from "./supabase.js";

export type CheckoutItem = { id: string; qty: number };
export type CheckoutCustomer = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
};

export type PricedItem = {
  product_id: string | null;
  item_id: string;
  item_type: "product" | "course";
  item_code: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  allow_pay_now: boolean;
  allow_cod: boolean;
};

export type AppliedCoupon = {
  code: string;
  discount_percent: number;
  min_order: number;
  expires_at: string | null;
};

type ServerProduct = {
  id: string;
  code?: string;
  name: string;
  price: number;
  stock: number;
  kind?: "product" | "course";
  allow_pay_now?: boolean;
  allow_cod?: boolean;
};

type ServerCoupon = {
  code: string;
  discount_percent: number;
  min_order?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
};

const fallbackPrices: ServerProduct[] = [
  { id: "rd-aura-speaker", code: "ZYP-RDAURA", name: "RD Aura Wireless Speaker", price: 1099, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "rd-hush-cl790-headphones", code: "ZYP-HUSH790", name: "RD Hush CL-790 Headphones", price: 1799, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "dk-solar-wall-lamp", code: "ZYP-SOLAR", name: "DK Solar Wall Lamp", price: 899, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "boat-airdopes-141-pack", code: "ZYP-BOAT141", name: "boAt Airdopes 141", price: 1299, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "oud-smart-pods-navy", code: "ZYP-OUDNAVY", name: "OUD Smart Pods Navy", price: 399, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "boat-airdopes-141-bold-black", code: "ZYP-BOATBLK", name: "boAt AirDopes 141 Bold Black", price: 1199, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "smart-audio-collection", code: "ZYP-AUDIO", name: "Smart Audio Collection", price: 1499, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "oud-smart-pods-kit", code: "ZYP-OUDKIT", name: "OUD Smart Pods Accessory Kit", price: 499, stock: 99, allow_pay_now: true, allow_cod: true },
  { id: "dropshipping-mastery", code: "ZYC-DROP", name: "Dropshipping Mastery", price: 999, stock: 999, kind: "course", allow_pay_now: true, allow_cod: false },
  { id: "instagram-growth-engine", code: "ZYC-INSTA", name: "Instagram Growth Engine", price: 799, stock: 999, kind: "course", allow_pay_now: true, allow_cod: false },
  { id: "ai-for-solo-entrepreneurs", code: "ZYC-AI", name: "AI for Solo Entrepreneurs", price: 1199, stock: 999, kind: "course", allow_pay_now: true, allow_cod: false },
];

const LEGACY_USD_TO_INR = 83;

export function toInrAmount(amount: number) {
  const value = Number(amount) || 0;
  if (value > 0 && value < 30) return Math.round(value * LEGACY_USD_TO_INR);
  return Math.round(value);
}

export function validateCustomer(customer: CheckoutCustomer) {
  const errors: string[] = [];
  if (!customer.full_name || customer.full_name.trim().length < 2) errors.push("Full name is required.");
  if (!/^\d{10}$/.test(customer.phone)) errors.push("Enter a valid 10-digit phone number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.push("Enter a valid email address.");
  if (!customer.address || customer.address.trim().length < 8) errors.push("Address is required.");
  if (!/^\d{6}$/.test(customer.pincode)) errors.push("Enter a valid 6-digit pincode.");
  if (!customer.city || customer.city.trim().length < 2) errors.push("City is required.");
  if (!customer.state || customer.state.trim().length < 2) errors.push("State is required.");
  return errors;
}

export function sanitizeItems(items: CheckoutItem[]) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Your bag is empty.");
  return items.map((item) => ({
    id: String(item.id || "").trim(),
    qty: Math.max(1, Math.min(20, Number(item.qty) || 1)),
  }));
}

export function sanitizeCouponCode(code: unknown) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function withPaymentDefaults(product: ServerProduct): ServerProduct {
  const kind = product.kind || "product";
  return {
    ...product,
    allow_pay_now: product.allow_pay_now !== false,
    allow_cod: kind === "course" ? product.allow_cod === true : product.allow_cod !== false,
  };
}

export async function getServerProducts(ids: string[]): Promise<ServerProduct[]> {
  if (supabaseConfigured()) {
    const filter = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
    let products: ServerProduct[] = [];
    try {
      products = await supabaseFetch<ServerProduct[]>(
        `products?select=id,code,name,price,stock,allow_pay_now,allow_cod&id=in.(${filter})&is_active=eq.true`,
      );
    } catch {
      products = await supabaseFetch<ServerProduct[]>(
        `products?select=id,code,name,price,stock&id=in.(${filter})&is_active=eq.true`,
      );
    }
    let courses: ServerProduct[] = [];
    try {
      const settings = await supabaseFetch<{ content?: { selling_enabled?: boolean } }[]>(
        "homepage_sections?select=content&section_key=eq.courses_settings",
      );
      if (settings[0]?.content?.selling_enabled !== false) {
        let courseRows: ServerProduct[] = [];
        try {
          courseRows = await supabaseFetch<ServerProduct[]>(
            `courses?select=id,code,name,price,allow_pay_now,allow_cod&id=in.(${filter})&is_active=eq.true`,
          );
        } catch {
          courseRows = await supabaseFetch<ServerProduct[]>(
            `courses?select=id,code,name,price&id=in.(${filter})&is_active=eq.true`,
          );
        }
        courses = courseRows.map((course) => ({ ...course, stock: 999, kind: "course" }));
      }
    } catch {
      courses = [];
    }
    return [...products.map((product) => ({ ...product, kind: "product" as const })), ...courses].map(withPaymentDefaults);
  }
  return fallbackPrices.filter((product) => ids.includes(product.id)).map(withPaymentDefaults);
}

async function getServerCoupon(code: string): Promise<AppliedCoupon | null> {
  if (!code) return null;
  if (!supabaseConfigured()) throw new Error("Coupons are not configured yet.");
  const [coupon] = await supabaseFetch<ServerCoupon[]>(
    `coupons?select=code,discount_percent,min_order,expires_at,is_active&code=eq.${encodeURIComponent(code)}`,
  );
  if (!coupon) throw new Error("Invalid coupon code.");
  if (coupon.is_active === false) throw new Error("This coupon is not active.");
  if (coupon.expires_at) {
    const expiresAt = new Date(`${coupon.expires_at}T23:59:59`);
    if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      throw new Error("This coupon has expired.");
    }
  }
  const discountPercent = Math.min(100, Math.max(1, Math.round(Number(coupon.discount_percent) || 0)));
  return {
    code: coupon.code,
    discount_percent: discountPercent,
    min_order: Math.max(0, Math.round(Number(coupon.min_order) || 0)),
    expires_at: coupon.expires_at || null,
  };
}

export async function priceCheckout(items: CheckoutItem[], couponCode?: unknown) {
  const safeItems = sanitizeItems(items);
  const products = await getServerProducts([...new Set(safeItems.map((item) => item.id))]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const pricedItems: PricedItem[] = safeItems.map((item) => {
    const product = byId.get(item.id);
    if (!product) throw new Error("One or more products are no longer available.");
    if (product.stock < item.qty) throw new Error(`${product.name} has only ${product.stock} in stock.`);
    const unit = toInrAmount(product.price);
    const kind = product.kind || "product";
    return {
      product_id: kind === "course" ? null : product.id,
      item_id: product.id,
      item_type: kind,
      item_code: product.code || product.id.toUpperCase(),
      name: product.name,
      qty: item.qty,
      unit_price: unit,
      line_total: unit * item.qty,
      allow_pay_now: product.allow_pay_now !== false,
      allow_cod: product.allow_cod === true,
    };
  });
  const subtotal = pricedItems.reduce((sum, item) => sum + item.line_total, 0);
  const coupon = await getServerCoupon(sanitizeCouponCode(couponCode));
  if (coupon && subtotal < coupon.min_order) {
    throw new Error(`Minimum order ₹${coupon.min_order.toLocaleString("en-IN")} required for ${coupon.code}.`);
  }
  const discount = coupon ? Math.min(subtotal, Math.round((subtotal * coupon.discount_percent) / 100)) : 0;
  const shipping = subtotal >= 2000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + shipping + tax - discount);
  return {
    items: pricedItems,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    coupon_code: coupon?.code || "",
    coupon_discount_percent: coupon?.discount_percent || 0,
  };
}

export type PaymentMethod = "online" | "cod";

export function getPaymentAvailability(priced: { items: PricedItem[] }) {
  const unavailable = {
    online: priced.items.filter((item) => !item.allow_pay_now).map((item) => item.name),
    cod: priced.items.filter((item) => !item.allow_cod).map((item) => item.name),
  };
  return {
    payment_methods: {
      online: unavailable.online.length === 0,
      cod: unavailable.cod.length === 0,
    },
    unavailable,
  };
}

export function paymentUnavailableMessage(method: PaymentMethod, itemNames: string[]) {
  const label = method === "cod" ? "Cash on Delivery" : "Pay Now";
  const names = itemNames.slice(0, 3).join(", ");
  const suffix = itemNames.length > 3 ? ` and ${itemNames.length - 3} more item${itemNames.length - 3 === 1 ? "" : "s"}` : "";
  return `${label} is not available for ${names}${suffix}.`;
}
