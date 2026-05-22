import type { VercelRequest, VercelResponse } from "./_lib/vercel-types.js";
import { allowMethods, json, requireEnv } from "./_lib/http.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { requireAdmin, supabaseConfigured } from "./_lib/supabase.js";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const STORAGE_ROOT = "zyvanta30";
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const allowedFolders = new Set(["products", "courses", "reviews"]);

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getUploadPath(folder: string, baseName: string, fileName: string, contentType: string) {
  if (!allowedFolders.has(folder)) throw new Error("Upload folder is not allowed.");
  const ext = allowedTypes.get(contentType);
  if (!ext) throw new Error("Only JPG, PNG, WEBP and GIF images are allowed.");

  const fallbackName = fileName.replace(/\.[^.]+$/, "");
  const safeName = slugify(baseName || fallbackName || "image") || "image";
  return `${STORAGE_ROOT}/${folder}/${safeName}-${Date.now()}.${ext}`;
}

async function uploadToStorage(path: string, contentType: string, bytes: Buffer) {
  const baseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${baseUrl}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Cache-Control": "31536000",
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: bytes as unknown as BodyInit,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Storage upload failed.");
  }

  return `${baseUrl}/storage/v1/object/public/product-images/${path}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST", "OPTIONS"])) return;
  try {
    if (!supabaseConfigured()) return json(res, 503, { error: "Supabase is not configured." });

    const rate = checkRateLimit(req, { keyPrefix: "admin-upload", limit: 20, windowMs: 60_000 });
    if (rate.limited) return json(res, 429, { error: `Too many uploads. Try again in ${rate.retryAfter} seconds.` });

    await requireAdmin(req);

    const { folder, baseName, fileName, contentType, base64 } = req.body || {};
    const path = getUploadPath(String(folder || ""), String(baseName || ""), String(fileName || ""), String(contentType || ""));
    const bytes = Buffer.from(String(base64 || ""), "base64");
    if (!bytes.length) return json(res, 400, { error: "Image file is required." });
    if (bytes.length > MAX_UPLOAD_BYTES) return json(res, 413, { error: "Image must be 3MB or smaller." });

    const publicUrl = await uploadToStorage(path, String(contentType), bytes);
    return json(res, 201, { path, publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return json(res, message.includes("Admin access") ? 403 : 400, { error: message });
  }
}
