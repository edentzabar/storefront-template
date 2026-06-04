import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless signed tokens.
 *
 * Use case: short-lived "give the bearer this URL and they can access X
 * without an account". Examples in this app:
 *   • Abandoned-cart recovery links sent by email
 *   • Magic-link account recovery (if/when added)
 *   • Customer order receipt links
 *
 * Format: `<base64url(payload)>.<base64url(hmac)>`
 *
 * Payload is a JSON object with `exp` (unix ms). The HMAC is computed
 * over the payload bytes using BETTER_AUTH_SECRET. If the secret leaks,
 * an attacker can forge tokens — so the secret is treated as sensitive
 * (validated at startup by ensureSecret() below).
 *
 * Tokens are NOT revocable. If you need revocation, pair with a DB
 * field (e.g. `recoveredAt`) and check both. This is what we do for
 * cart recovery.
 */

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  // The auth layer also validates this on startup; we re-check here so
  // any path that signs/verifies tokens fails fast in misconfigured envs.
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set and at least 32 characters.");
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

/**
 * Sign an arbitrary payload + expiry. Returns a URL-safe string.
 * Default expiry is 7 days.
 */
export function signToken<T extends Record<string, unknown>>(
  payload: T,
  expiresInMs: number = 7 * 24 * 60 * 60_000,
): string {
  const body = { ...payload, exp: Date.now() + expiresInMs };
  const encoded = b64url(Buffer.from(JSON.stringify(body)));
  const sig = b64url(
    createHmac("sha256", getSecret()).update(encoded).digest(),
  );
  return `${encoded}.${sig}`;
}

/**
 * Verify a token. Returns the payload if valid + unexpired, otherwise
 * null. Constant-time HMAC compare to prevent timing leaks.
 */
export function verifyToken<T extends { exp: number }>(
  token: string,
): T | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = createHmac("sha256", getSecret()).update(encoded).digest();
    provided = fromB64url(sig);
  } catch {
    return null;
  }
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  let parsed: T;
  try {
    parsed = JSON.parse(fromB64url(encoded).toString("utf-8")) as T;
  } catch {
    return null;
  }
  if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
  return parsed;
}
