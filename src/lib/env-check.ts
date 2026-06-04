import "server-only";

/**
 * One-shot environment audit run at server boot via instrumentation.ts.
 *
 * Categorizes env vars into three buckets:
 *   • required — missing means refuse to boot (already enforced in
 *     auth.ts for BETTER_AUTH_SECRET).
 *   • prodRequired — missing in production triggers a loud console.error
 *     but doesn't crash. We prefer "ship with a warning" over "downtime"
 *     when an admin forgets to set ADMIN_NOTIFICATION_EMAIL.
 *   • prodRecommended — missing in production logs a warning. These
 *     don't break anything; they just weaken the defense.
 *
 * In dev we stay quiet so the local server log doesn't get spammy.
 */

type Check = {
  name: string;
  what: string;
  why: string;
};

const PROD_REQUIRED: Check[] = [
  {
    name: "DATABASE_URL",
    what: "מחרוזת חיבור ל-Postgres (pooled, דרך PgBouncer)",
    why: "בלי DB אין שום דבר.",
  },
  {
    name: "BETTER_AUTH_SECRET",
    what: "מפתח 32+ תווים לחתימת קוקיז וסשנים",
    why: "בלי זה אי אפשר לאמת משתמשים בכלל. (כבר נכפה ב-auth.ts.)",
  },
  {
    name: "BETTER_AUTH_URL",
    what: "כתובת הבסיס של האתר בפרודקשן (https://...)",
    why: "ה-cookie ושמירת ההפניות חוזרים אליו.",
  },
];

const PROD_RECOMMENDED: Check[] = [
  {
    name: "UPSTASH_REDIS_REST_URL",
    what: "כתובת REST של Upstash Redis",
    why: "בלי זה ה-rate-limit עובד in-memory לכל instance של Vercel — בפועל כמעט לא עובד כי בקשה הבאה תלך ל-instance אחר. החינמי של Upstash מספיק להמון: https://upstash.com",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    what: "טוקן REST של Upstash Redis",
    why: "צריך יחד עם ה-URL כדי שהחיבור יעבוד.",
  },
  {
    name: "BLOB_READ_WRITE_TOKEN",
    what: "טוקן של Vercel Blob להעלאת תמונות",
    why: "בלי זה האדמין לא יכול להעלות לוגו / תמונות מוצרים / באנר.",
  },
  {
    name: "ADMIN_NOTIFICATION_EMAIL",
    what: "כתובת האימייל שתקבל התראה על כל הזמנה חדשה",
    why: "בלי זה ה-fallback הוא site-config.contact.email, וזה לא בהכרח מה שאת רוצה.",
  },
  {
    name: "RESEND_API_KEY",
    what: "מפתח של Resend לשליחת מיילים טרנזקציוניים",
    why: "בלי זה מיילי אישור הזמנה / שחזור עגלה / אימות אימייל לא ייצאו.",
  },
  {
    name: "PAYMENT_PROVIDER",
    what: "שם ספק הסליקה (cardcom / tranzila / ...)",
    why: "בלי זה הקוד נשאר ב-mock וזורק שגיאה בפרודקשן. צריך גם את ה-CARDCOM_* אם בוחרים cardcom.",
  },
];

export function auditEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = (list: Check[]) =>
    list.filter((c) => !process.env[c.name]);

  const requiredMissing = missing(PROD_REQUIRED);
  const recommendedMissing = missing(PROD_RECOMMENDED);

  if (requiredMissing.length === 0 && recommendedMissing.length === 0) {
    // eslint-disable-next-line no-console
    console.log("[env-check] ✓ all production environment vars present");
    return;
  }

  if (requiredMissing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      "\n[env-check] ✗ CRITICAL env vars missing in production:\n" +
        requiredMissing.map((c) => `  - ${c.name}: ${c.what}\n    → ${c.why}`).join("\n") +
        "\n",
    );
  }

  if (recommendedMissing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "\n[env-check] ⚠ recommended env vars missing — security/UX weakened:\n" +
        recommendedMissing.map((c) => `  - ${c.name}: ${c.what}\n    → ${c.why}`).join("\n") +
        "\n",
    );
  }
}
