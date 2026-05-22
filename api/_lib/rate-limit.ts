import type { VercelRequest } from "./vercel-types.js";
import { getClientIp } from "./http.js";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(req: VercelRequest, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientIp(req)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > options.limit) {
    return { limited: true, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  if (buckets.size > 500) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  return { limited: false, retryAfter: 0 };
}
