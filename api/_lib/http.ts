import type { VercelRequest, VercelResponse } from "./vercel-types.js";

export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export function json(res: VercelResponse, status: number, body: unknown) {
  setSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]) {
  res.setHeader("Allow", methods.join(", "));
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (!req.method || !methods.includes(req.method)) {
    json(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type?.toLowerCase() === "bearer" ? token : "";
}

export function getClientIp(req: VercelRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return ip?.trim() || req.socket.remoteAddress || "unknown";
}
