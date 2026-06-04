import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware for rate-limiting authentication endpoints.
 *
 * better-auth handles /api/auth/* internally — we wrap it to throttle
 * brute-force login/register attempts BEFORE the auth library does the
 * password compare (which is the expensive part). We key by IP, with a
 * generous 10 attempts per 15 minutes — too tight to brute-force, loose
 * enough that a real customer fumbling their password isn't locked out.
 *
 * We use the in-memory Map only in middleware (edge runtime; this map
 * is per-instance). For real prod, swap to Upstash when keys are set —
 * see notes in src/lib/rate-limit.ts.
 *
 * NOTE: Next middleware runs on the Edge runtime, so we can't import
 * the Node-only `rate-limit.ts` helper here. We duplicate the memory
 * store logic instead.
 */

type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

const AUTH_LIMIT = 10;
const AUTH_WINDOW_MS = 15 * 60_000;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function isOverLimit(key: string): boolean {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.reset < now) {
    store.set(key, { count: 1, reset: now + AUTH_WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > AUTH_LIMIT;
}

// Periodic sweep so the store doesn't grow unbounded
let lastSweep = 0;
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) {
    if (v.reset < now) store.delete(k);
  }
}

export function middleware(req: NextRequest) {
  // Limit only the mutating auth endpoints (signin / signup). Reads
  // like /api/auth/get-session are called on every page and shouldn't
  // be throttled.
  const isMutatingAuth =
    req.nextUrl.pathname.startsWith("/api/auth/sign-in") ||
    req.nextUrl.pathname.startsWith("/api/auth/sign-up") ||
    req.nextUrl.pathname.startsWith("/api/auth/forget-password") ||
    req.nextUrl.pathname.startsWith("/api/auth/reset-password");

  if (!isMutatingAuth) return NextResponse.next();

  maybeSweep();
  const ip = getClientIp(req);
  if (isOverLimit(`auth:${ip}`)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסי שוב בעוד 15 דקות." },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
