import { Course, Product, ProductReview, fallbackCourses, fallbackCrownWants, fallbackProducts, fallbackReviews } from "@/data/catalog";
import { FooterPage, fallbackFooterPages } from "@/data/footer-pages";
import { SiteSettings, fallbackSiteSettings, normalizeSiteSettings } from "@/data/site-settings";

export type CheckoutCustomer = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
};

export type CheckoutLine = { id: string; qty: number };

export type PaymentSummary = {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon_code?: string;
  coupon_discount_percent?: number;
  items: {
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
  }[];
};

export type Coupon = {
  code: string;
  discount_percent: number;
  min_order: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PaymentAvailability = {
  online: boolean;
  cod: boolean;
};

export type CheckoutOptions = {
  summary: PaymentSummary;
  payment_methods: PaymentAvailability;
  unavailable: {
    online: string[];
    cod: string[];
  };
};

export type Policy = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export type CoursesResponse = {
  courses: Course[];
  selling_enabled: boolean;
};

export type { FooterPage };
export type { SiteSettings };

export const fallbackPolicies: Policy[] = [
  {
    slug: "delivery-policy",
    title: "Delivery Policy",
    summary: "Express dispatch with careful packaging and tracking.",
    body: "Orders are packed within 24 hours and dispatched through tracked courier partners. Delivery timelines depend on the destination pincode and courier availability.",
  },
  {
    slug: "returns",
    title: "7 Days Return",
    summary: "Simple returns for unused products in original packaging.",
    body: "Return requests are accepted within 7 days of delivery when the product is unused, undamaged, and returned with all original accessories and packaging.",
  },
  {
    slug: "warranty",
    title: "1 Year Warranty",
    summary: "Coverage for manufacturing defects.",
    body: "Eligible Zyvanta products include a 1 year limited warranty against manufacturing defects. Damage caused by misuse, accidents, or unauthorized repair is excluded.",
  },
  {
    slug: "secure-payments",
    title: "Secure Payments",
    summary: "Encrypted checkout with verified payment confirmation.",
    body: "Online payments are processed through a certified payment gateway and verified server-side before any paid order is created.",
  },
];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}

export async function getProducts() {
  try {
    const data = await request<{ products: Product[] }>("/api/products");
    return data.products?.length ? data.products : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getCourses() {
  try {
    const data = await request<CoursesResponse>("/api/courses");
    if (!Array.isArray(data.courses)) return { courses: fallbackCourses, selling_enabled: true };
    return {
      courses: data.courses,
      selling_enabled: data.selling_enabled !== false,
    };
  } catch {
    return { courses: fallbackCourses, selling_enabled: true };
  }
}

export async function getFeaturedReviews() {
  try {
    const data = await request<{ reviews: ProductReview[] }>("/api/reviews?featured=true");
    return data.reviews?.length ? data.reviews : fallbackReviews;
  } catch {
    return fallbackReviews;
  }
}

export async function getItemReviews(target: { item_code?: string; item_id?: string; item_type?: "product" | "course"; product_id?: string }) {
  const params = new URLSearchParams();
  if (target.item_code) params.set("item_code", target.item_code);
  else if (target.item_id && target.item_type) {
    params.set("item_id", target.item_id);
    params.set("item_type", target.item_type);
  } else if (target.product_id) {
    params.set("product_id", target.product_id);
  }

  try {
    const data = await request<{ reviews: ProductReview[] }>(`/api/reviews?${params.toString()}`);
    return data.reviews || [];
  } catch {
    return fallbackReviews.filter((review) => {
      if (target.item_code) return review.item_code === target.item_code;
      if (target.item_id && target.item_type) return review.item_id === target.item_id && review.item_type === target.item_type;
      if (target.product_id) return review.product_id === target.product_id;
      return false;
    });
  }
}

export async function getHomepageSections() {
  try {
    const data = await request<{ sections: { section_key: string; content: unknown }[] }>("/api/site?resource=homepage");
    const crown = data.sections.find((section) => section.section_key === "crown_wants")?.content as { items?: string[] } | undefined;
    return { crownWants: crown?.items?.length ? crown.items : fallbackCrownWants };
  } catch {
    return { crownWants: fallbackCrownWants };
  }
}

export async function getPolicies() {
  try {
    const data = await request<{ policies: Policy[] }>("/api/policies");
    return data.policies?.length ? data.policies : fallbackPolicies;
  } catch {
    return fallbackPolicies;
  }
}

export async function getFooterPages() {
  const fallback = fallbackFooterPages.filter((page) => page.is_active !== false);
  try {
    const data = await request<{ pages: FooterPage[] }>("/api/site?resource=footer");
    return data.pages?.length ? data.pages : fallback;
  } catch {
    return fallback;
  }
}

export async function getSiteSettings() {
  try {
    const data = await request<{ settings: Partial<SiteSettings> }>("/api/site?resource=site-settings");
    return normalizeSiteSettings(data.settings);
  } catch {
    return fallbackSiteSettings;
  }
}

export async function createPaymentOrder(customer: CheckoutCustomer, items: CheckoutLine[], coupon_code = "") {
  return request<{ key_id: string; payment_order_id: string; amount: number; currency: string; summary: PaymentSummary }>("/api/payments/create", {
    method: "POST",
    body: JSON.stringify({ customer, items, coupon_code }),
  });
}

export async function getCheckoutOptions(items: CheckoutLine[], coupon_code = "") {
  return request<CheckoutOptions>("/api/checkout-options", {
    method: "POST",
    body: JSON.stringify({ items, coupon_code }),
  });
}

export async function verifyPayment(customer: CheckoutCustomer, items: CheckoutLine[], payment: unknown, coupon_code = "") {
  return request<{ order_id: string; order_code: string; total: number }>("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify({ customer, items, payment, coupon_code }),
  });
}

export async function createCodOrder(customer: CheckoutCustomer, items: CheckoutLine[], coupon_code = "") {
  return request<{ order_id: string; order_code: string; total: number }>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ customer, items, coupon_code }),
  });
}

export async function adminRequest<T>(url: string, token: string, init?: RequestInit) {
  return request<T>(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}
