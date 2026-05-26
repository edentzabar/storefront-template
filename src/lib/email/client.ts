import "server-only";
import { Resend } from "resend";
import { siteConfig } from "@/lib/site-config";

/**
 * Lazy Resend client. Returns null if RESEND_API_KEY is not configured —
 * email functions then no-op gracefully so order placement never breaks
 * just because email isn't wired up yet.
 */
function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? `${siteConfig.name} <onboarding@resend.dev>`;

export async function sendEmail(input: SendEmailInput): Promise<
  { ok: true; id: string } | { ok: false; error: string; skipped?: boolean }
> {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to:", input.to);
    return { ok: false, error: "Email not configured", skipped: true };
  }
  try {
    const result = await client.emails.send({
      from: DEFAULT_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
