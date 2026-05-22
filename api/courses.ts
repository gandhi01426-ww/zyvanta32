import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { createUniqueCode, normalizeCode } from "./_lib/codes.js";
import { allowMethods, json } from "./_lib/http.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

type CoursesSettings = {
  selling_enabled?: boolean;
};

const settingsPath = "homepage_sections?on_conflict=section_key";

async function getCoursesSettings(): Promise<CoursesSettings> {
  try {
    const rows = await supabaseFetch<{ content?: CoursesSettings }[]>(
      "homepage_sections?select=content&section_key=eq.courses_settings",
    );
    return rows[0]?.content || { selling_enabled: true };
  } catch {
    return { selling_enabled: true };
  }
}

async function saveCoursesSettings(settings: CoursesSettings) {
  const [section] = await supabaseFetch<unknown[]>(settingsPath, {
    method: "POST",
    body: {
      section_key: "courses_settings",
      title: "Courses Settings",
      content: { selling_enabled: settings.selling_enabled !== false },
      sort_order: 20,
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return section;
}

function imageList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function courseBody(body: Record<string, unknown>, code: string) {
  const gallery = imageList(body.gallery);
  const image = String(body.image || gallery[0] || "").trim();
  return {
    id: String(body.id || "").trim(),
    code,
    name: String(body.name || "").trim(),
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    price: Math.max(0, Math.round(Number(body.price) || 0)),
    duration: String(body.duration || "").trim(),
    image,
    gallery,
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    review_count: Math.max(0, Math.round(Number(body.review_count) || 0)),
    is_active: body.is_active !== false,
    allow_pay_now: body.allow_pay_now !== false,
    allow_cod: body.allow_cod === true,
    sort_order: Math.round(Number(body.sort_order) || 100),
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "POST", "PUT", "DELETE", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      const adminView = req.query.admin === "true";
      if (adminView) await requireAdmin(req);
      const settings = await getCoursesSettings();
      const activeFilter = adminView ? "" : "&is_active=eq.true";
      const rows = settings.selling_enabled === false && !adminView
        ? []
        : await supabaseFetch(`courses?select=*${activeFilter}&order=is_active.desc,sort_order.asc,name.asc`);
      return json(res, 200, { courses: rows, selling_enabled: settings.selling_enabled !== false });
    }

    await requireAdmin(req);

    if (req.method === "PUT" && req.query.settings === "true") {
      const settings = await saveCoursesSettings({ selling_enabled: req.body?.selling_enabled !== false });
      return json(res, 200, { settings, selling_enabled: req.body?.selling_enabled !== false });
    }

    if (req.method === "POST") {
      const code = normalizeCode(req.body?.code) || await createUniqueCode("ZYC", "courses");
      const body = courseBody(req.body || {}, code);
      if (!body.id || !body.name) return json(res, 400, { error: "Course id and name are required." });
      if (!body.allow_pay_now && !body.allow_cod) return json(res, 400, { error: "Select at least one payment method for this course." });
      const [course] = await supabaseFetch<unknown[]>("courses", {
        method: "POST",
        body: { ...body, created_at: new Date().toISOString() },
        prefer: "return=representation",
      });
      return json(res, 201, { course });
    }

    const id = String(req.query.id || req.body?.id || "");
    if (!id) return json(res, 400, { error: "Course id is required." });

    if (req.method === "PUT") {
      const existing = await supabaseFetch<{ code?: string }[]>(
        `courses?select=code&id=eq.${encodeURIComponent(id)}&limit=1`,
      );
      const code = normalizeCode(req.body?.code) || normalizeCode(existing[0]?.code) || await createUniqueCode("ZYC", "courses");
      const body = courseBody(req.body || {}, code);
      if (!body.allow_pay_now && !body.allow_cod) return json(res, 400, { error: "Select at least one payment method for this course." });
      const [course] = await supabaseFetch<unknown[]>(`courses?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { ...body, id: undefined },
        prefer: "return=representation",
      });
      return json(res, 200, { course });
    }

    await supabaseFetch(`courses?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { is_active: false, updated_at: new Date().toISOString() },
    });
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Course request failed." });
  }
}
