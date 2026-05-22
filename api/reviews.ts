import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import type { CatalogCodeTarget } from "./_lib/codes.js";
import { findCatalogItemByCode, normalizeCode } from "./_lib/codes.js";
import { allowMethods, json } from "./_lib/http.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

async function resolveTarget(body: Record<string, unknown>): Promise<CatalogCodeTarget | null | undefined> {
  if (Object.prototype.hasOwnProperty.call(body, "item_code")) {
    const code = normalizeCode(body.item_code);
    if (!code) return null;
    const target = await findCatalogItemByCode(code);
    if (!target) throw new Error(`No product or course was found for code ${code}.`);
    return target;
  }

  if (body.product_id) {
    return {
      id: String(body.product_id),
      code: "",
      name: "",
      item_type: "product",
      product_id: String(body.product_id),
    };
  }

  return undefined;
}

function reviewBody(body: Record<string, unknown>, target?: CatalogCodeTarget | null) {
  const next: Record<string, unknown> = {
    name: String(body.name || "").trim(),
    role: String(body.role || "").trim(),
    avatar: String(body.avatar || "").trim(),
    rating: Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5))),
    comment: String(body.comment || "").trim(),
    photo: String(body.photo || "").trim(),
    is_featured: body.is_featured !== false,
    is_active: body.is_active !== false,
  };

  if (target !== undefined) {
    next.product_id = target?.product_id || null;
    next.item_id = target?.id || null;
    next.item_type = target?.item_type || null;
    next.item_code = target?.code || null;
  }

  return next;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "POST", "PUT", "DELETE", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      const itemCode = normalizeCode(req.query.item_code);
      const itemId = req.query.item_id ? String(req.query.item_id).trim() : "";
      const itemType = req.query.item_type ? String(req.query.item_type).trim() : "";
      const productId = req.query.product_id ? String(req.query.product_id).trim() : "";
      const featured = req.query.featured === "true" ? "&is_featured=eq.true" : "";
      const target =
        itemCode ? `&item_code=eq.${encodeURIComponent(itemCode)}`
          : itemId && itemType ? `&item_id=eq.${encodeURIComponent(itemId)}&item_type=eq.${encodeURIComponent(itemType)}`
            : productId ? `&product_id=eq.${encodeURIComponent(productId)}` : "";
      const rows = await supabaseFetch(`reviews?select=*&is_active=eq.true${target}${featured}&order=created_at.desc`);
      return json(res, 200, { reviews: rows });
    }

    await requireAdmin(req);

    if (req.method === "POST") {
      const target = await resolveTarget(req.body || {});
      const [review] = await supabaseFetch<unknown[]>("reviews", {
        method: "POST",
        body: reviewBody(req.body || {}, target),
        prefer: "return=representation",
      });
      return json(res, 201, { review });
    }

    const id = String(req.query.id || req.body?.id || "");
    if (!id) return json(res, 400, { error: "Review id is required." });

    if (req.method === "PUT") {
      const target = await resolveTarget(req.body || {});
      const [review] = await supabaseFetch<unknown[]>(`reviews?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { ...reviewBody(req.body || {}, target), id: undefined },
        prefer: "return=representation",
      });
      return json(res, 200, { review });
    }

    await supabaseFetch(`reviews?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { is_active: false },
    });
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Review request failed." });
  }
}
