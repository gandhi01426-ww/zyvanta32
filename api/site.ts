import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json } from "./_lib/http.js";
import { requireAdmin, supabaseConfigured, supabaseFetch } from "./_lib/supabase.js";

type SiteSettings = {
  email: string;
  phone: string;
  instagram_handle: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  twitter_url: string;
  company_name: string;
  office_address: string;
  map_query: string;
  footer_note: string;
};

const fallbackSiteSettings: SiteSettings = {
  email: "zyvanta.co@gmail.com",
  phone: "+91 70130 14863",
  instagram_handle: "@zyvanta.co",
  instagram_url: "https://www.instagram.com/zyvanta.co?igsh=cmlzbGN4bGJ0NHh6",
  facebook_url: "https://facebook.com",
  youtube_url: "https://youtube.com",
  twitter_url: "https://twitter.com",
  company_name: "Zyvanta Luxe Pvt. Ltd.",
  office_address: "4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh",
  map_query: "4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh, India",
  footer_note: "Crafted with obsession.",
};

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const text = (value: unknown, fallback = "") => String(value || fallback).trim();

function footerPageBody(body: Record<string, unknown>, currentSlug = "") {
  const label = String(body.label || "").trim();
  const slug = currentSlug || slugify(String(body.slug || label));
  return {
    slug,
    section_title: String(body.section_title || "About").trim() || "About",
    section_order: Math.round(Number(body.section_order) || 100),
    label,
    summary: String(body.summary || "").trim(),
    body: String(body.body || "").trim(),
    sort_order: Math.round(Number(body.sort_order) || 100),
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };
}

function siteSettingsBody(content: Record<string, unknown> = {}): SiteSettings {
  return {
    email: text(content.email, fallbackSiteSettings.email),
    phone: text(content.phone, fallbackSiteSettings.phone),
    instagram_handle: text(content.instagram_handle, fallbackSiteSettings.instagram_handle),
    instagram_url: text(content.instagram_url, fallbackSiteSettings.instagram_url),
    facebook_url: text(content.facebook_url, fallbackSiteSettings.facebook_url),
    youtube_url: text(content.youtube_url, fallbackSiteSettings.youtube_url),
    twitter_url: text(content.twitter_url, fallbackSiteSettings.twitter_url),
    company_name: text(content.company_name, fallbackSiteSettings.company_name),
    office_address: text(content.office_address, fallbackSiteSettings.office_address),
    map_query: text(content.map_query, fallbackSiteSettings.map_query),
    footer_note: text(content.footer_note, fallbackSiteSettings.footer_note),
  };
}

async function handleFooter(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "POST", "PUT", "DELETE", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      const adminView = req.query.admin === "true";
      if (adminView) await requireAdmin(req);
      const slug = req.query.slug ? `&slug=eq.${encodeURIComponent(String(req.query.slug))}` : "";
      const active = adminView ? "" : "&is_active=eq.true";
      const pages = await supabaseFetch(
        `footer_pages?select=*${active}${slug}&order=section_order.asc,sort_order.asc,label.asc`,
      );
      return json(res, 200, { pages });
    }

    await requireAdmin(req);

    if (req.method === "POST") {
      const body = footerPageBody(req.body || {});
      if (!body.slug || !body.label) return json(res, 400, { error: "Footer page slug and label are required." });
      const [page] = await supabaseFetch<unknown[]>("footer_pages", {
        method: "POST",
        body: { ...body, created_at: new Date().toISOString() },
        prefer: "return=representation",
      });
      return json(res, 201, { page });
    }

    const slug = String(req.query.slug || req.body?.slug || "").trim();
    if (!slug) return json(res, 400, { error: "Footer page slug is required." });

    if (req.method === "PUT") {
      const body = footerPageBody(req.body || {}, slug);
      if (!body.label) return json(res, 400, { error: "Footer page label is required." });
      const [page] = await supabaseFetch<unknown[]>(`footer_pages?slug=eq.${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: { ...body, slug: undefined },
        prefer: "return=representation",
      });
      return json(res, 200, { page });
    }

    await supabaseFetch(`footer_pages?slug=eq.${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Footer page request failed." });
  }
}

async function handleHomepage(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "PUT", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    if (req.method === "GET") {
      const sections = await supabaseFetch("homepage_sections?select=*&order=sort_order.asc");
      return json(res, 200, { sections });
    }

    await requireAdmin(req);
    const key = String(req.query.key || req.body?.section_key || "");
    if (!key) return json(res, 400, { error: "Section key is required." });
    const [section] = await supabaseFetch<unknown[]>(`homepage_sections?section_key=eq.${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: { content: req.body.content, updated_at: new Date().toISOString() },
      prefer: "return=representation",
    });
    return json(res, 200, { section });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Homepage request failed." });
  }
}

async function handleSiteSettings(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["GET", "PUT", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 200, { settings: fallbackSiteSettings });

    if (req.method === "GET") {
      const [section] = await supabaseFetch<{ content?: Partial<SiteSettings> }[]>(
        "homepage_sections?section_key=eq.site_settings&select=content",
      );
      return json(res, 200, { settings: siteSettingsBody(section?.content || {}) });
    }

    await requireAdmin(req);
    const settings = siteSettingsBody(req.body?.settings || req.body?.content || req.body || {});
    const existing = await supabaseFetch<{ section_key: string }[]>(
      "homepage_sections?section_key=eq.site_settings&select=section_key",
    );

    if (existing.length) {
      const [section] = await supabaseFetch<unknown[]>("homepage_sections?section_key=eq.site_settings", {
        method: "PATCH",
        body: { content: settings, updated_at: new Date().toISOString() },
        prefer: "return=representation",
      });
      return json(res, 200, { settings, section });
    }

    const [section] = await supabaseFetch<unknown[]>("homepage_sections", {
      method: "POST",
      body: {
        section_key: "site_settings",
        title: "Site Settings",
        content: settings,
        sort_order: 30,
        updated_at: new Date().toISOString(),
      },
      prefer: "return=representation",
    });
    return json(res, 201, { settings, section });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Site settings request failed." });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const resource = String(req.query.resource || "").trim();

  if (resource === "footer") return handleFooter(req, res);
  if (resource === "homepage") return handleHomepage(req, res);
  if (resource === "site-settings") return handleSiteSettings(req, res);

  return json(res, 400, { error: "Unknown site resource." });
}
