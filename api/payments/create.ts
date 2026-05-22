import type { VercelRequest, VercelResponse } from "../_lib/vercel-types.js";
import { allowMethods, json, requireEnv } from "../_lib/http.js";
import { getPaymentAvailability, paymentUnavailableMessage, priceCheckout, validateCustomer } from "../_lib/pricing.js";
import { checkRateLimit } from "../_lib/rate-limit.js";

function razorpayAuth() {
  const keyId = requireEnv("RAZORPAY_KEY_ID");
  const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
  return {
    keyId,
    authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST", "OPTIONS"])) return;
  try {
    const { customer, items, coupon_code } = req.body || {};
    const rate = checkRateLimit(req, { keyPrefix: "payment-create", limit: 12, windowMs: 60_000 });
    if (rate.limited) return json(res, 429, { error: `Too many payment attempts. Try again in ${rate.retryAfter} seconds.` });

    const errors = validateCustomer(customer || {});
    if (errors.length) return json(res, 400, { error: errors[0], errors });
    const priced = await priceCheckout(items, coupon_code);
    const availability = getPaymentAvailability(priced);
    if (!availability.payment_methods.online) {
      return json(res, 400, {
        error: paymentUnavailableMessage("online", availability.unavailable.online),
        unavailable: availability.unavailable.online,
      });
    }
    const { keyId, authorization } = razorpayAuth();

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: priced.total * 100,
        currency: "INR",
        receipt: `zyv_${Date.now()}`,
        notes: {
          customer_phone: customer.phone,
          item_count: String(priced.items.reduce((sum, item) => sum + item.qty, 0)),
          coupon_code: priced.coupon_code || "",
        },
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Payment gateway order creation failed.");
    }

    const order = await response.json();
    return json(res, 200, {
      key_id: keyId,
      payment_order_id: order.id,
      amount: priced.total,
      currency: "INR",
      summary: priced,
    });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Payment could not be started." });
  }
}
