import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json } from "./_lib/http.js";
import { createCustomerOrder } from "./_lib/orders.js";
import { getPaymentAvailability, paymentUnavailableMessage, priceCheckout, validateCustomer } from "./_lib/pricing.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "POST", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      await requireAdmin(req);
      const orders = await supabaseFetch("orders?select=*,order_items(*)&order=created_at.desc");
      return json(res, 200, { orders });
    }

    const { customer, items, coupon_code } = req.body || {};
    const rate = checkRateLimit(req, { keyPrefix: "cod-order", limit: 8, windowMs: 60_000 });
    if (rate.limited) return json(res, 429, { error: `Too many order attempts. Try again in ${rate.retryAfter} seconds.` });

    const errors = validateCustomer(customer || {});
    if (errors.length) return json(res, 400, { error: errors[0], errors });
    const priced = await priceCheckout(items, coupon_code);
    const availability = getPaymentAvailability(priced);
    if (!availability.payment_methods.cod) {
      return json(res, 400, {
        error: paymentUnavailableMessage("cod", availability.unavailable.cod),
        unavailable: availability.unavailable.cod,
      });
    }

    const order = await createCustomerOrder(customer, priced, {
      payment_method: "cod",
      payment_status: "cod_pending",
    });
    return json(res, 201, order);
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Order request failed." });
  }
}
