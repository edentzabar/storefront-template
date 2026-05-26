/**
 * Static info pages: about, shipping, returns, privacy, terms,
 * size-guide, FAQ. These ship as generic placeholders — replace with
 * the client's actual policy text per deployment.
 *
 * Most blocks read numbers (free-shipping threshold, return-days,
 * installments) from siteConfig so brand-name and shop-policy swaps
 * propagate without editing this file.
 */
import { siteConfig } from "@/lib/site-config";

export type StaticBlock = { heading: string; body: string };

export const aboutContent = {
  eyebrow: "About",
  title: `אודות ${siteConfig.name}`,
  subtitle: "סיפור המותג בכמה משפטים — שנה את הטקסט הזה ב-src/lib/data/static-pages.ts.",
  blocks: [
    {
      heading: "המסע שלנו",
      body: "פסקה ראשונה — מתי נוסד המותג, על ידי מי, ומה הניע אותו. השאירו את זה אישי ואותנטי.",
    },
    {
      heading: "הפילוסופיה",
      body: "פסקה שנייה — הערכים שמנחים אותנו, מה חשוב לנו בעבודה, ומה מבדל אותנו מהמתחרים.",
    },
    {
      heading: "ההבטחה",
      body: "פסקה שלישית — מה אנחנו מבטיחים ללקוח, גם מבחינת איכות וגם מבחינת שירות.",
    },
  ] satisfies StaticBlock[],
};

export const shippingContent: StaticBlock[] = [
  {
    heading: `משלוח חינם מעל ₪${siteConfig.shop.freeShippingMin}`,
    body: `כל הזמנה מעל ${siteConfig.shop.freeShippingMin} שקלים זוכה למשלוח חינם בישראל.`,
  },
  {
    heading: "זמני אספקה",
    body: `משלוח רגיל: ${siteConfig.shop.shippingDays} ימי עסקים. משלוח אקספרס זמין בתשלום נוסף.`,
  },
  { heading: "איסוף עצמי", body: "ניתן לתאם איסוף עצמי ללא עלות. נשלח לכם מייל ברגע שההזמנה מוכנה." },
  {
    heading: 'משלוחים לחו"ל',
    body: 'אנחנו שולחים לכל העולם. עלויות וזמני אספקה משתנים — נתאם איתכם לאחר ההזמנה.',
  },
  { heading: "אריזה", body: "כל הזמנה מגיעה באריזה איכותית, מוכנה למתנה." },
];

export const returnsContent: StaticBlock[] = [
  {
    heading: `${siteConfig.shop.returnDays} ימי החזרה`,
    body: `ניתן להחזיר כל מוצר תוך ${siteConfig.shop.returnDays} יום מיום קבלת ההזמנה, בתנאי שהמוצר במצבו המקורי, באריזה המקורית, ללא סימני שימוש.`,
  },
  {
    heading: "החלפות",
    body: "החלפת מידה או דגם — בחינם, פעם אחת לכל הזמנה. צרו איתנו קשר ונתאם משלוח חוזר.",
  },
  {
    heading: "מוצרים שאינם ניתנים להחזרה",
    body: "מוצרים בעיצוב אישי / מותאמים אישית — אינם ניתנים להחזרה.",
  },
  { heading: "החזר כספי", body: "החזר כספי תוך 5-10 ימי עסקים מיום קבלת המוצר אצלנו." },
];

export const privacyContent: StaticBlock[] = [
  { heading: "איסוף מידע", body: "אנחנו אוספים רק את המידע ההכרחי לטיפול בהזמנה: שם, כתובת, אימייל ופרטי תשלום." },
  { heading: "שימוש במידע", body: "המידע משמש אך ורק לטיפול בהזמנה, יצירת קשר ועדכונים שנרשמתם אליהם במפורש." },
  { heading: "שיתוף עם צד שלישי", body: "אנחנו לא משתפים מידע עם צד שלישי, מלבד ספקי משלוח ותשלום שמטפלים בהזמנה." },
  { heading: "אבטחת מידע", body: "כל תשלום עובר דרך שירות תשלום מוצפן ומאובטח." },
  { heading: "זכויות שלכם", body: "תוכלו לבקש לראות, לעדכן או למחוק את המידע השמור עליכם בכל עת." },
];

export const termsContent: StaticBlock[] = [
  { heading: "כללי", body: "השימוש באתר כפוף לתקנון זה. עצם השימוש מהווה הסכמה לתנאים." },
  { heading: "המוצרים", body: "כל המוצרים זמינים בהתאם למלאי. אנחנו שומרים על הזכות לעדכן מחירים ולשנות זמינות בכל עת." },
  {
    heading: "תשלום",
    body: `התשלום מתבצע באמצעות שירות תשלום מאובטח. ניתן לשלם עד ${siteConfig.shop.maxInstallments} תשלומים.`,
  },
  { heading: "אחריות", body: siteConfig.shop.warranty },
  { heading: "סמכות שיפוט", body: "סכסוכים יידונו בבתי המשפט המוסמכים בישראל." },
];

export const sizeGuideContent: StaticBlock[] = [
  { heading: "מדידה כללית", body: "אם המוצרים שלכם דורשים מידות — שנה את הטקסט הזה ב-src/lib/data/static-pages.ts." },
];

export const faqContent = [
  { q: "מה זמן האספקה?", a: `${siteConfig.shop.shippingDays} ימי עסקים.` },
  { q: 'האם המחירים כוללים מע"מ?', a: 'כן, כל המחירים באתר כוללים מע"מ.' },
  {
    q: "האם ניתן לשלם בתשלומים?",
    a: `כן, עד ${siteConfig.shop.maxInstallments} תשלומים ללא ריבית בכרטיס אשראי.`,
  },
  { q: 'האם אתם שולחים לחו"ל?', a: 'כן, אנחנו שולחים לכל העולם.' },
  {
    q: "מהי מדיניות ההחזרות?",
    a: `החזרה תוך ${siteConfig.shop.returnDays} יום מקבלת ההזמנה, במצב מקורי.`,
  },
];

export const contactContent = {
  intro:
    "נשמח לעמוד לרשותכם בכל שאלה. ניתן ליצור איתנו קשר באחת מהדרכים הבאות, או למלא את הטופס ונחזור אליכם בהקדם.",
  studio: {
    address: siteConfig.contact.address,
    hours: 'א\'-ה\' 10:00-19:00 · ו\' 10:00-14:00',
  },
};
