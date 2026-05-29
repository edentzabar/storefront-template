"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { brandPalette } from "@/lib/brand";

/**
 * Restock waitlist — visitors signal "email me when this is back" on
 * out-of-stock product pages. We store the request, and notify them
 * automatically the next time stock returns (see notifyRestockWaitlist
 * which is called from admin product update + bulk restock actions).
 */

const signupSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email("כתובת אימייל לא תקינה").max(200),
});

export type RestockSignupResult = {
  ok: boolean;
  error?: string;
  /** True if this email was already on the list (we don't reveal a real "exists" — same response either way) */
  alreadyOnList?: boolean;
};

/** Add an email to a product's waitlist. Idempotent — duplicates are
 *  treated as success (we don't leak whether the email was already on
 *  the list). Returns the same shape either way. */
export async function joinRestockWaitlist(
  input: unknown,
): Promise<RestockSignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "קלט לא תקין",
    };
  }
  const { productId, email } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Make sure the product actually exists + is currently out of stock
  // (defense in depth — UI already only shows the form when stock=0).
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true, name: true },
  });
  if (!product) {
    return { ok: false, error: "מוצר לא נמצא" };
  }
  if (product.stock > 0) {
    return {
      ok: false,
      error: "המוצר במלאי כרגע — לא צריך הרשמה לעדכון.",
    };
  }

  try {
    await prisma.restockNotification.upsert({
      where: {
        productId_email: { productId, email: normalizedEmail },
      },
      create: { productId, email: normalizedEmail },
      update: {}, // idempotent
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "שגיאה ברישום",
    };
  }
}

/**
 * Send notifications for one product that just returned to stock.
 * Called from updateProduct / bulk stock actions whenever a product's
 * stock transitions from 0 → >0. Gracefully no-ops if Resend is not
 * configured (RESEND_API_KEY missing) — entries stay un-notified and
 * can be re-sent later once email is wired up.
 */
export async function notifyRestockWaitlist(productId: string): Promise<{
  ok: boolean;
  sent: number;
  skipped: boolean;
}> {
  // Pull all un-notified rows
  const pending = await prisma.restockNotification.findMany({
    where: { productId, notifiedAt: null },
    select: { id: true, email: true },
  });
  if (pending.length === 0) {
    return { ok: true, sent: 0, skipped: false };
  }

  // No Resend configured → silently leave entries pending. They'll
  // ship the next time the product restocks AND email is wired up.
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return { ok: true, sent: 0, skipped: true };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, slug: true, image: true, price: true },
  });
  if (!product) {
    return { ok: false, sent: 0, skipped: false };
  }

  // Lazy import — keeps Resend out of the bundle until actually used
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const productUrl = `${siteConfig.url}/product/${product.slug}`;
  const subject = `${product.name} חזר למלאי! 🎉`;

  let sentCount = 0;
  for (const row of pending) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: row.email,
        subject,
        html: restockEmailHtml({
          productName: product.name,
          productUrl,
          productImage: product.image,
          productPrice: product.price,
        }),
      });
      await prisma.restockNotification.update({
        where: { id: row.id },
        data: { notifiedAt: new Date() },
      });
      sentCount += 1;
    } catch {
      // Individual send failure — leave un-notified, try again next restock
    }
  }
  return { ok: true, sent: sentCount, skipped: false };
}

function restockEmailHtml(o: {
  productName: string;
  productUrl: string;
  productImage: string;
  productPrice: number;
}): string {
  const p = brandPalette;
  const priceLabel = `${siteConfig.currency.symbol}${o.productPrice.toLocaleString("he-IL")}`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${o.productName} חזר למלאי</title>
</head>
<body style="margin:0;padding:24px;background:${p.bg};font-family:'Heebo',sans-serif;color:${p.text};">
  <table cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="max-width:560px;margin:0 auto;background:${p.surface};border:1px solid ${p.border};">
    <tr>
      <td style="padding:32px 32px 16px;text-align:center;">
        <h1 style="margin:0;color:${p.primary};font-size:24px;font-weight:600;">חדשות טובות 🎉</h1>
        <p style="margin:12px 0 0;color:${p.textSoft};">המוצר שביקשת לדעת עליו חזר למלאי.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="120" valign="top">
              <img src="${o.productImage}" alt="${escapeHtml(o.productName)}" width="120" style="display:block;border:1px solid ${p.border};border-radius:4px;" />
            </td>
            <td valign="top" style="padding-right:18px;">
              <div style="font-size:16px;font-weight:600;color:${p.primary};margin-bottom:6px;">${escapeHtml(o.productName)}</div>
              <div style="font-size:18px;color:${p.accent};margin-bottom:12px;">${priceLabel}</div>
              <a href="${o.productUrl}" style="display:inline-block;background:${p.accent};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:500;">לעמוד המוצר →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 32px;border-top:1px solid ${p.border};text-align:center;font-size:12px;color:${p.textSoft};">
        קיבלת את המייל כי ביקשת עדכון לכשהמוצר יחזור.<br/>
        ${siteConfig.name}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
