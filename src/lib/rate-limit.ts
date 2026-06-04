import "server-only";
import { headers } from "next/headers";

/**
 * Rate limiting.
 *
 * Two backends:
 *   1. Upstash Redis sliding-window (used when UPSTASH_REDIS_REST_URL +
 *      UPSTASH_REDIS_REST_TOKEN env vars are set). Required for
 *      production on Vercel because functions are stateless.
 *   2. In-process Map fallback for local dev. NOT durable across
 *      serverless cold starts. Don't ship this to prod.
 *
 * We expose `rateLimit(key, opts)` that any server action / route
 * handler can call BEFORE doing real work. If it returns
 * `{ ok: false }`, the caller should return a generic error to the
 * client (don't leak how close they are to the cap).
 *
 * Conventions:
 *   • Always key by IP + verb (e.g. "login:1.2.3.4")
 *   • Add a per-email or per-account secondary key for things that
 *     should hurt the attacker without affecting legit shoppers who
 *     share an IP (mobile NAT, university, office).
 */

export type RateLimitOptions = {
  /** Max successful checks within `windowMs`. */
  limit: number;
  /** Sliding-window size in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

// ─── Backend: in-process Map (dev-only) ────────────────────────────
type Hit = { count: number; reset: number };
const memStore = new Map<string, Hit>();

function memCheck(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = memStore.get(key);
  if (!existing || existing.reset < now) {
    const reset = now + opts.windowMs;
    memStore.set(key, { count: 1, reset });
    return { ok: true, remaining: opts.limit - 1, resetMs: opts.windowMs };
  }
  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  const resetMs = existing.reset - now;
  if (existing.count > opts.limit) {
    return { ok: false, remaining: 0, resetMs };
  }
  return { ok: true, remaining, resetMs };
}

// Periodic cleanup so the Map doesn't grow unbounded in long-lived
// dev sessions. Runs at most once per minute.
let lastSweep = 0;
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of memStore) {
    if (v.reset < now) memStore.delete(k);
  }
}

// ─── Backend: Upstash REST (prod) ───────────────────────────────────
async function upstashCheck(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Sliding window via INCR + EXPIRE. Simpler than the Lua sliding-log
  // variant; trades a small amount of accuracy for a single round-trip.
  const ttlSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
  try {
    const pipeline = [["INCR", key], ["EXPIRE", key, String(ttlSec), "NX"]];
    const r = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      // Don't let a slow Redis stall the request more than ~500ms;
      // fall back to allowing the request rather than blocking the
      // user on an infra hiccup.
      signal: AbortSignal.timeout(500),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as Array<{ result: number | string }>;
    const count = Number(data?.[0]?.result ?? 0);
    const remaining = Math.max(0, opts.limit - count);
    return {
      ok: count <= opts.limit,
      remaining,
      resetMs: ttlSec * 1000,
    };
  } catch {
    return null;
  }
}

/**
 * The main entrypoint. Returns `{ ok: true }` if the request is
 * allowed, `{ ok: false }` if rate-limited. On infra errors we
 * fail OPEN (allow the request) rather than blocking real users
 * on Redis being down — but log loudly if you want to alert.
 */
export async function rateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  // Try durable backend first
  const upstash = await upstashCheck(key, opts);
  if (upstash) return upstash;
  // Fall back to in-process (dev / Redis down)
  maybeSweep();
  return memCheck(key, opts);
}

/**
 * Pull the best-effort client IP from headers. On Vercel this comes
 * via `x-forwarded-for`. We take the LEFTMOST value (the original
 * client) since intermediate proxies append.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") || "unknown";
}

// ─── Pre-defined policies ─────────────────────────────────────────
//
// Tune these per-endpoint. They live here so the numbers are reviewed
// in one place and we don't sprinkle magic constants across the code.
export const POLICIES = {
  /** Auth endpoints (login, register, password reset). */
  auth: { limit: 5, windowMs: 15 * 60_000 }, // 5 / 15 min / key
  /** Public chatbot — main AI cost-burn surface. */
  chatbot: { limit: 10, windowMs: 60_000 }, // 10 / min / IP
  /** Daily chatbot cap on top of the per-minute one. */
  chatbotDaily: { limit: 80, windowMs: 24 * 60 * 60_000 },
  /** Coupon validation (enumeration risk). */
  coupon: { limit: 10, windowMs: 60_000 },
  /** Restock waitlist, contact form, abandoned-cart save. */
  spam: { limit: 5, windowMs: 60 * 60_000 }, // 5 / hour / IP
  /** Popup tracking and cart recovery (low-value metric endpoints). */
  metric: { limit: 60, windowMs: 60_000 },
  /** Generic safety cap for any storefront server action. */
  generic: { limit: 30, windowMs: 60_000 },
} as const;
