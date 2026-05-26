import "server-only";
import { siteConfig } from "@/lib/site-config";
import { brandPalette } from "@/lib/brand";

const PALETTE = brandPalette;

type CartItem = {
  id: string;
  slug?: string;
  name: string;
  image: string;
  size?: string | null;
  price: number;
  qty: number;
};

function fmtPrice(value: number) {
  return `₪${value.toLocaleString("he-IL")}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function abandonedCartEmail(opts: {
  customerName: string | null;
  items: CartItem[];
  subtotal: number;
  recoveryUrl: string;
}) {
  const greeting = opts.customerName
    ? `שלום ${escapeHtml(opts.customerName.split(" ")[0])},`
    : "שלום,";

  const itemRows = opts.items
    .map((item) => {
      const imgSrc = item.image.startsWith("http")
        ? item.image
        : `${siteConfig.url}${item.image}`;
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${PALETTE.border};width:64px;">
          <img src="${imgSrc}" alt="" width="56" height="64" style="display:block;border:0;object-fit:cover;border-radius:4px;" />
        </td>
        <td style="padding:12px 12px;border-bottom:1px solid ${PALETTE.border};">
          <div style="font-weight:500;color:${PALETTE.primary};">${escapeHtml(item.name)}</div>
          <div style="font-size:11px;color:${PALETTE.textSoft};margin-top:2px;">
            כמות ${item.qty}${item.size ? ` · מידה ${escapeHtml(item.size)}` : ""}
          </div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${PALETTE.border};text-align:left;font-variant-numeric:tabular-nums;">
          ${fmtPrice(item.price * item.qty)}
        </td>
      </tr>`;
    })
    .join("");

  const body = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:500;color:${PALETTE.primary};">
      השארת משהו בעגלה?
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${PALETTE.textSoft};line-height:1.7;">
      ${greeting}
      <br/>
      שמרנו את העגלה שלך כדי שתוכל/י לחזור ולסיים בכל רגע. כל הפריטים זמינים — אבל מלאי לא תמיד מחכה.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:${PALETTE.textSoft};">סך הכל בעגלה</td>
        <td style="padding:4px 0;text-align:left;font-weight:600;font-size:16px;color:${PALETTE.primary};font-variant-numeric:tabular-nums;">${fmtPrice(opts.subtotal)}</td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="background:${PALETTE.primary};">
          <a href="${opts.recoveryUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;font-weight:500;">
            חזרה לעגלה
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0 0;font-size:12px;color:${PALETTE.textSoft};text-align:center;line-height:1.6;">
      הקישור שמור עבורך — לחיצה אחת ותחזור לאיפה שעצרת.
    </p>
  `;

  const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${siteConfig.name}</title>
  </head>
  <body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Heebo',Arial,sans-serif;color:${PALETTE.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PALETTE.bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${PALETTE.border};">
            <tr>
              <td style="padding:32px 32px 16px 32px;border-bottom:2px solid ${PALETTE.primary};text-align:center;">
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:500;letter-spacing:0.2em;color:${PALETTE.primary};">${siteConfig.name}</div>
                <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${PALETTE.textSoft};margin-top:4px;">${siteConfig.tagline}</div>
              </td>
            </tr>
            <tr><td style="padding:28px 32px;">${body}</td></tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;border-top:1px solid ${PALETTE.border};text-align:center;font-size:11px;color:${PALETTE.textSoft};line-height:1.6;">
                ${siteConfig.contact.email} · ${siteConfig.contact.phone}<br/>
                <a href="${siteConfig.url}" style="color:${PALETTE.accentDark};text-decoration:none;">${siteConfig.url.replace(/^https?:\/\//, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: `${siteConfig.name} · השארת משהו בעגלה? המוצרים שלך מחכים`,
    html,
  };
}
