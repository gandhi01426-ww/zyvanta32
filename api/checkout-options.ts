import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json } from "./_lib/http.js";
import { getPaymentAvailability, priceCheckout } from "./_lib/pricing.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST", "OPTIONS"])) return;
  try {
    const rate = checkRateLimit(req, { keyPrefix: "checkout-options", limit: 20, windowMs: 60_000 });
    if (rate.limited) return json(res, 429, { error: `Too many checkout attempts. Try again in ${rate.retryAfter} seconds.` });

    const priced = await priceCheckout(req.body?.items, req.body?.coupon_code);
    return json(res, 200, {
      summary: priced,
      ...getPaymentAvailability(priced),
    });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Checkout options could not be loaded." });
  }
}
