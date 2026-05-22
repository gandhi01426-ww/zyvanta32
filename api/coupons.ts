import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json } from "./_lib/http.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

const cleanCode = (value: unknown) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");

function couponBody(body: Record<string, unknown>, currentCode = "") {
  const code = currentCode || cleanCode(body.code);
  const discount = Math.round(Number(body.discount_percent) || 0);
  const minOrder = Math.max(0, Math.round(Number(body.min_order) || 0));
  const expiresAt = String(body.expires_at || "").trim();
  return {
    code,
    discount_percent: Math.min(100, Math.max(1, discount)),
    min_order: minOrder,
    expires_at: expiresAt || null,
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "POST", "PUT", "DELETE", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });
    await requireAdmin(req);

    if (req.method === "GET") {
      const coupons = await supabaseFetch("coupons?select=*&order=created_at.desc");
      return json(res, 200, { coupons });
    }

    if (req.method === "POST") {
      const body = couponBody(req.body || {});
      if (!body.code) return json(res, 400, { error: "Coupon code is required." });
      const [coupon] = await supabaseFetch<unknown[]>("coupons", {
        method: "POST",
        body: { ...body, created_at: new Date().toISOString() },
        prefer: "return=representation",
      });
      return json(res, 201, { coupon });
    }

    const code = cleanCode(req.query.code || req.body?.code);
    if (!code) return json(res, 400, { error: "Coupon code is required." });

    if (req.method === "PUT") {
      const body = couponBody(req.body || {}, code);
      const [coupon] = await supabaseFetch<unknown[]>(`coupons?code=eq.${encodeURIComponent(code)}`, {
        method: "PATCH",
        body: { ...body, code: undefined },
        prefer: "return=representation",
      });
      return json(res, 200, { coupon });
    }

    await supabaseFetch(`coupons?code=eq.${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Coupons request failed." });
  }
}
