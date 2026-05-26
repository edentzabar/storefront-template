import "server-only";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Order, OrderItem } from "@prisma/client";
import { siteConfig } from "@/lib/site-config";
import { brandPalette } from "@/lib/brand";
import { SHIPPING_LABELS, STATUS_LABELS } from "@/lib/admin/order-helpers";

const PALETTE = brandPalette;

function fmtPrice(value: number) {
  return `₪${value.toLocaleString("he-IL")}`;
}

/** Base wrapper — used by all transactional emails. RTL Hebrew. */
function wrap(opts: { previewText: string; bodyHtml: string }) {
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${siteConfig.name}</title>
    <style>
      body { margin:0; padding:0; background:${PALETTE.bg}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Heebo", Arial, sans-serif; color:${PALETTE.text}; }
      a { color:${PALETTE.accentDark}; }
      table { border-collapse:collapse; }
      .num { font-variant-numeric: tabular-nums; }
    </style>
  </head>
  <body>
    <span style="display:none!important;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.previewText}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PALETTE.bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${PALETTE.border};">
            <tr>
              <td style="padding:32px 32px 16px 32px;border-bottom:2px solid ${PALETTE.primary};text-align:center;">
                <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:24px; font-weight:500; letter-spacing:0.2em; color:${PALETTE.primary};">${siteConfig.name}</div>
                <div style="font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:${PALETTE.textSoft}; margin-top:4px;">${siteConfig.tagline}</div>
              </td>
            </tr>
            <tr><td style="padding:28px 32px;">${opts.bodyHtml}</td></tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;border-top:1px solid ${PALETTE.border};text-align:center;font-size:11px;color:${PALETTE.textSoft};line-height:1.6;">
                ${siteConfig.contact.address}<br/>
                <a href="tel:${siteConfig.contact.phone}" style="color:${PALETTE.textSoft};text-decoration:none;">${siteConfig.contact.phone}</a> ·
                <a href="mailto:${siteConfig.contact.email}" style="color:${PALETTE.textSoft};text-decoration:none;">${siteConfig.contact.email}</a>
                <br/><br/>
                <a href="${siteConfig.url}" style="color:${PALETTE.accentDark};">${siteConfig.url.replace(/^https?:\/\//, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type OrderWithItems = Order & { items: OrderItem[] };

// ---------- order confirmation (to customer) ----------

export function orderConfirmationEmail(order: OrderWithItems) {
  const itemsRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${PALETTE.border};">
          <div style="font-weight:500;color:${PALETTE.primary};">${escapeHtml(i.name)}</div>
          <div style="font-size:11px;color:${PALETTE.textSoft};margin-top:2px;">
            כמות ${i.qty}${i.size ? ` · מידה ${escapeHtml(i.size)}` : ""}
          </div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${PALETTE.border};text-align:left;" class="num">
          ${fmtPrice(i.price * i.qty)}
        </td>
      </tr>`,
    )
    .join("");

  const body = `
    <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:500;color:${PALETTE.primary};">תודה על ההזמנה, ${escapeHtml(order.customerFullName.split(" ")[0])}!</h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${PALETTE.textSoft};line-height:1.7;">
      קיבלנו את ההזמנה שלך ואנחנו מתחילים לאסוף אותה.
      תקבל מאיתנו עדכון נוסף ברגע שהיא תצא לדרך.
    </p>

    <div style="background:${PALETTE.bgSoft};padding:16px 20px;margin-bottom:24px;border:1px solid ${PALETTE.border};">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.textSoft};margin-bottom:4px;">מספר הזמנה</div>
      <div style="font-family:monospace;font-size:18px;font-weight:600;color:${PALETTE.primary};">${order.id}</div>
      <div style="font-size:12px;color:${PALETTE.textSoft};margin-top:6px;">
        ${format(order.createdAt, "d בMMMM yyyy · HH:mm", { locale: he })}
      </div>
    </div>

    <h2 style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.textSoft};margin:0 0 8px 0;">פריטים</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemsRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">ביניים</td>
        <td style="padding:4px 0;text-align:left;" class="num">${fmtPrice(order.subtotal)}</td>
      </tr>
      ${
        order.discount > 0
          ? `<tr>
        <td style="padding:4px 0;color:${PALETTE.accentDark};">הנחה${order.couponCode ? ` (${order.couponCode})` : ""}</td>
        <td style="padding:4px 0;text-align:left;color:${PALETTE.accentDark};" class="num">−${fmtPrice(order.discount)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">משלוח</td>
        <td style="padding:4px 0;text-align:left;" class="num">${order.shippingCost === 0 ? "חינם" : fmtPrice(order.shippingCost)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0 0;border-top:2px solid ${PALETTE.primary};font-weight:600;font-size:16px;color:${PALETTE.primary};">סה״כ</td>
        <td style="padding:12px 0 0 0;border-top:2px solid ${PALETTE.primary};text-align:left;font-weight:600;font-size:18px;color:${PALETTE.primary};" class="num">${fmtPrice(order.total)}</td>
      </tr>
    </table>

    <h2 style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.textSoft};margin:28px 0 8px 0;">משלוח</h2>
    <div style="font-size:14px;line-height:1.6;color:${PALETTE.text};">
      ${SHIPPING_LABELS[order.shippingMethod]}<br/>
      ${order.shippingAddress ? `${escapeHtml(order.shippingAddress)}<br/>` : ""}
      ${order.shippingCity ? `${escapeHtml(order.shippingCity)}` : ""}${order.shippingZip ? ` · ${escapeHtml(order.shippingZip)}` : ""}
    </div>

    <p style="margin:28px 0 0 0;font-size:13px;color:${PALETTE.textSoft};line-height:1.7;">
      שאלות? צור קשר: <a href="mailto:${siteConfig.contact.email}" style="color:${PALETTE.accentDark};">${siteConfig.contact.email}</a>
    </p>
  `;

  return {
    subject: `${siteConfig.name} · הזמנתך התקבלה — #${order.id}`,
    html: wrap({ previewText: `הזמנה #${order.id} התקבלה. סה״כ ${fmtPrice(order.total)}`, bodyHtml: body }),
  };
}

// ---------- admin notification (to store owner) ----------

export function adminNewOrderEmail(order: OrderWithItems) {
  const body = `
    <h1 style="margin:0 0 4px 0;font-size:20px;font-weight:500;color:${PALETTE.primary};">הזמנה חדשה! ✨</h1>
    <p style="margin:0 0 16px 0;font-size:14px;color:${PALETTE.textSoft};">${escapeHtml(order.customerFullName)} ביצע/ה הזמנה חדשה.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background:${PALETTE.bgSoft};padding:16px 20px;border:1px solid ${PALETTE.border};">
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};width:120px;">מספר הזמנה</td>
        <td style="padding:4px 0;font-family:monospace;font-weight:600;">${order.id}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">פריטים</td>
        <td style="padding:4px 0;">${order.items.reduce((s, i) => s + i.qty, 0)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">סה״כ</td>
        <td style="padding:4px 0;font-weight:600;font-size:16px;color:${PALETTE.primary};" class="num">${fmtPrice(order.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">לקוח</td>
        <td style="padding:4px 0;">${escapeHtml(order.customerFullName)}<br/><a href="mailto:${order.customerEmail}" style="color:${PALETTE.accentDark};">${order.customerEmail}</a> · ${escapeHtml(order.customerPhone)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">משלוח</td>
        <td style="padding:4px 0;">${SHIPPING_LABELS[order.shippingMethod]}</td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0;">
      <a href="${siteConfig.url}/admin/orders/${order.id}" style="display:inline-block;background:${PALETTE.primary};color:#ffffff;padding:12px 24px;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-weight:500;">
        פתח באדמין
      </a>
    </p>
  `;

  return {
    subject: `🔔 הזמנה חדשה #${order.id} · ${fmtPrice(order.total)}`,
    html: wrap({ previewText: `${order.customerFullName} · ${fmtPrice(order.total)}`, bodyHtml: body }),
  };
}

// ---------- order status update (to customer) ----------

export function orderStatusEmail(order: OrderWithItems) {
  const statusCopy: Record<typeof order.status, { headline: string; body: string }> = {
    new: {
      headline: "ההזמנה שלך התקבלה",
      body: "אנחנו מתחילים לאסוף אותה. עדכון נוסף יגיע ברגע שתצא לדרך.",
    },
    processing: {
      headline: "ההזמנה שלך נארזת",
      body: "אנחנו אורזים את ההזמנה שלך בקפידה. בקרוב היא בדרך אליך.",
    },
    shipped: {
      headline: "ההזמנה שלך נשלחה ✨",
      body: order.trackingNumber
        ? `המשלוח בדרך אליך. מספר מעקב: ${order.trackingNumber}`
        : "המשלוח בדרך אליך. נעדכן אותך כשתימסר.",
    },
    delivered: {
      headline: "ההזמנה שלך נמסרה",
      body: "מקווים שתיהנה/י מהפריט החדש. נשמח לשמוע ממך אם יש משוב.",
    },
    cancelled: {
      headline: "ההזמנה שלך בוטלה",
      body: "החזר התשלום יבוצע בהתאם למדיניות החנות. ניתן ליצור איתנו קשר לכל שאלה.",
    },
  };

  const copy = statusCopy[order.status];

  const body = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:500;color:${PALETTE.primary};">${copy.headline}</h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${PALETTE.textSoft};line-height:1.7;">${copy.body}</p>

    <div style="background:${PALETTE.bgSoft};padding:16px 20px;margin-bottom:24px;border:1px solid ${PALETTE.border};">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.textSoft};margin-bottom:4px;">הזמנה</div>
      <div style="font-family:monospace;font-size:16px;font-weight:600;color:${PALETTE.primary};">${order.id}</div>
      <div style="font-size:13px;margin-top:8px;">
        סטטוס: <span style="color:${PALETTE.primary};font-weight:500;">${STATUS_LABELS[order.status]}</span>
      </div>
    </div>

    <p style="margin:0;font-size:13px;color:${PALETTE.textSoft};line-height:1.7;">
      שאלות? צור קשר: <a href="mailto:${siteConfig.contact.email}" style="color:${PALETTE.accentDark};">${siteConfig.contact.email}</a>
    </p>
  `;

  return {
    subject: `${siteConfig.name} · ${copy.headline} — #${order.id}`,
    html: wrap({ previewText: copy.headline, bodyHtml: body }),
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
