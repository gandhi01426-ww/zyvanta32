import { createUniqueCode } from "./codes.js";
import type { CheckoutCustomer, PricedItem } from "./pricing.js";
import { supabaseFetch } from "./supabase.js";

type PricedCheckout = {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon_code?: string;
  coupon_discount_percent?: number;
};

type PaymentDetails = {
  payment_method: "online" | "cod";
  payment_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
};

function cleanCustomer(customer: CheckoutCustomer) {
  return {
    full_name: customer.full_name.trim(),
    phone: customer.phone,
    email: customer.email.trim().toLowerCase(),
    address: customer.address.trim(),
    pincode: customer.pincode,
    city: customer.city.trim(),
    state: customer.state.trim(),
  };
}

export async function createCustomerOrder(customer: CheckoutCustomer, priced: PricedCheckout, payment: PaymentDetails) {
  const orderCode = await createUniqueCode("ZYO", "orders", "order_code");
  const clean = cleanCustomer(customer);
  const [savedCustomer] = await supabaseFetch<{ id: string }[]>("customers", {
    method: "POST",
    body: clean,
    prefer: "return=representation",
  });

  const [order] = await supabaseFetch<{ id: string }[]>("orders", {
    method: "POST",
    body: {
      order_code: orderCode,
      customer_id: savedCustomer.id,
      customer_name: clean.full_name,
      customer_phone: clean.phone,
      customer_email: clean.email,
      address: clean.address,
      pincode: clean.pincode,
      city: clean.city,
      state: clean.state,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      tax: priced.tax,
      discount: priced.discount,
      coupon_code: priced.coupon_code || null,
      coupon_discount_percent: priced.coupon_discount_percent || null,
      total: priced.total,
      order_status: "confirmed",
      ...payment,
    },
    prefer: "return=representation",
  });

  await supabaseFetch("order_items", {
    method: "POST",
    body: priced.items.map(({ allow_pay_now, allow_cod, ...item }) => ({ ...item, order_id: order.id })),
  });

  return { order_id: order.id, order_code: orderCode, total: priced.total };
}
