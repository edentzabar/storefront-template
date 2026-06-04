import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { sendEmail } from "@/lib/email/client";
import { verifyEmailTemplate } from "@/lib/email/templates";

// SECURITY: Validate the auth secret at module load. Without a strong
// secret, sessions can be forged. We require at least 32 characters of
// entropy (better-auth generates 64-char hex by default). Throwing here
// makes a misconfigured deployment fail loudly on first boot rather
// than silently degrading.
function requireAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET is missing or too short (need 32+ chars). " +
        "Generate with: openssl rand -hex 32",
    );
  }
  return secret;
}

export const auth = betterAuth({
  appName: siteConfig.name,
  secret: requireAuthSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // SECURITY: 12 chars is the OWASP-recommended baseline for
    // passwords without complexity rules. better-auth handles the
    // hashing (scrypt) and never logs the plaintext.
    minPasswordLength: 12,
    // Email verification is DISABLED for now — the merchant wants
    // frictionless signup. To re-enable, flip this to true, set
    // autoSignIn to false, and set sendOnSignUp to true in the
    // emailVerification block below.
    requireEmailVerification: false,
    autoSignIn: true,
  },
  emailVerification: {
    // Disabled along with requireEmailVerification above.
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    /**
     * Kept wired so re-enabling verification is a one-line change.
     * Called by better-auth with the magic link to embed in the email.
     */
    async sendVerificationEmail({ user, url }) {
      const tpl = verifyEmailTemplate({
        name: user.name || "לקוחה",
        url,
      });
      const result = await sendEmail({
        to: user.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      if (!result.ok && !result.skipped) {
        console.error("[auth] verification email failed:", result.error);
      }
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: true },
      role: { type: "string", required: false, input: false, defaultValue: "customer" },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
