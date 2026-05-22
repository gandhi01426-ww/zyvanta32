import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json } from "./_lib/http.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "PUT", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      const slug = req.query.slug ? `&slug=eq.${encodeURIComponent(String(req.query.slug))}` : "";
      const policies = await supabaseFetch(`delivery_policies?select=*&is_active=eq.true${slug}&order=sort_order.asc`);
      return json(res, 200, { policies });
    }

    await requireAdmin(req);
    const slug = String(req.query.slug || req.body?.slug || "");
    if (!slug) return json(res, 400, { error: "Policy slug is required." });
    const [policy] = await supabaseFetch<unknown[]>(`delivery_policies?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: { ...req.body, slug: undefined, updated_at: new Date().toISOString() },
      prefer: "return=representation",
    });
    return json(res, 200, { policy });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Policy request failed." });
  }
}
