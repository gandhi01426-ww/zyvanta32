import type { VercelRequest, VercelResponse } from "../_lib/vercel-types.js";
import crypto from "crypto";
import { allowMethods, json, requireEnv } from "../_lib/http.js";
import { createCustomerOrder } from "../_lib/orders.js";
import { getPaymentAvailability, paymentUnavailableMessage, priceCheckout, validateCustomer } from "../_lib/pricing.js";
import { checkRateLimit } from "../_lib/rate-limit.js";
import { supabaseConfigured } from "../_lib/supabase.js";

function authorizationHeader() {
  const keyId = requireEnv("RAZORPAY_KEY_ID");
  const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayGet<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: authorizationHeader() },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Payment verification lookup failed.");
  }
  return response.json() as Promise<T>;
}

function signaturesMatch(expected: string, received: unknown) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(String(received || ""), "hex");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    const { customer, items, payment, coupon_code } = req.body || {};
    const rate = checkRateLimit(req, { keyPrefix: "payment-verify", limit: 12, windowMs: 60_000 });
    if (rate.limited) return json(res, 429, { error: `Too many payment attempts. Try again in ${rate.retryAfter} seconds.` });

    const errors = validateCustomer(customer || {});
    if (errors.length) return json(res, 400, { error: errors[0], errors });
    if (!payment?.razorpay_order_id || !payment?.razorpay_payment_id || !payment?.razorpay_signature) {
      return json(res, 400, { error: "Payment verification details are missing." });
    }

    const expected = crypto
      .createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
      .update(`${payment.razorpay_order_id}|${payment.razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(expected, payment.razorpay_signature)) {
      return json(res, 400, { error: "Payment signature verification failed." });
    }

    const priced = await priceCheckout(items, coupon_code);
    const availability = getPaymentAvailability(priced);
    if (!availability.payment_methods.online) {
      return json(res, 400, {
        error: paymentUnavailableMessage("online", availability.unavailable.online),
        unavailable: availability.unavailable.online,
      });
    }
    const paymentRecord = await razorpayGet<{ amount: number; status: string; order_id: string; currency: string }>(
      `payments/${encodeURIComponent(payment.razorpay_payment_id)}`,
    );
    const gatewayOrder = await razorpayGet<{ amount: number; status: string; id: string }>(
      `orders/${encodeURIComponent(payment.razorpay_order_id)}`,
    );

    if (paymentRecord.order_id !== payment.razorpay_order_id || gatewayOrder.id !== payment.razorpay_order_id) {
      return json(res, 400, { error: "Payment order mismatch." });
    }
    if (paymentRecord.currency !== "INR" || paymentRecord.amount !== priced.total * 100 || gatewayOrder.amount !== priced.total * 100) {
      return json(res, 400, { error: "Payment amount verification failed." });
    }
    if (!["captured", "authorized"].includes(paymentRecord.status)) {
      return json(res, 402, { error: "Payment was not completed." });
    }

    const order = await createCustomerOrder(customer, priced, {
      payment_method: "online",
      payment_status: "paid",
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
    });
    return json(res, 200, order);
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Payment verification failed." });
  }
}
