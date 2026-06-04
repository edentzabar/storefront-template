import type { NextConfig } from "next";

/**
 * Security response headers applied to every route.
 *
 * Reasoning per header:
 *   • HSTS — force HTTPS for 2 years, includes subdomains, preload-eligible.
 *   • X-Frame-Options DENY — admin can't be iframed → clickjacking blocked.
 *     (Also covered by CSP frame-ancestors, but legacy browsers honor this.)
 *   • X-Content-Type-Options nosniff — browser won't reinterpret a JSON
 *     response as HTML, blocking some XSS-via-MIME-confusion vectors.
 *   • Referrer-Policy — leak as little as possible to outbound clicks
 *     (no path, no query, no params).
 *   • Permissions-Policy — explicitly deny powerful APIs we never use.
 *   • Content-Security-Policy — defense in depth: even if an XSS slipped
 *     in, it couldn't exfiltrate to a third-party domain or load a remote
 *     script. We allow:
 *       - 'self' for scripts/styles/fonts
 *       - 'unsafe-inline' on style-src (Tailwind generates inline styles;
 *          modern CSP can't avoid this without nonces, which Next 16 still
 *          doesn't expose cleanly)
 *       - 'unsafe-inline' on script-src (Next inlines bootstrap scripts in
 *          RSC payloads; without nonces this is needed)
 *       - data: + https: for images (Blob storage, gravatar-like cases)
 *       - vercel-storage.com for direct image fetches if any bypass next/image
 *       - https://api.anthropic.com / openai / google for AI provider calls
 *         made from the server (these are NOT subject to browser CSP but
 *         listing them in connect-src documents the egress surface)
 *     The CSP is intentionally not a paranoia-max default; it's a
 *     pragmatic one for an e-commerce front-end. Tighten further by
 *     introducing nonces once Next 16 stabilizes its CSP nonce API.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is kept ONLY for Next.js dev (HMR / React Refresh
      // use eval). In production it's removed via the conditional below.
      // 'unsafe-inline' is required because Next 16 doesn't yet expose
      // nonces cleanly for the RSC bootstrap scripts.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Connect-src: where the browser is allowed to fetch from.
      // Anthropic/OpenAI/Google AI calls are made server-side so they
      // don't technically need to be here, but listing keeps the
      // egress surface documented.
      "connect-src 'self' https://*.vercel-storage.com https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Prisma engine must not be bundled by Turbopack.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Server actions default to a 1MB body limit — way too small for
  // product images. The Blob upload action enforces its own 8MB cap
  // (src/lib/admin/upload-actions.ts), so we bump the framework
  // limit just past that to let real photos through.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      // Vercel Blob storage — admin-uploaded logos, hero images, etc.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
