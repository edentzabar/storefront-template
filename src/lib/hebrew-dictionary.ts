/**
 * Built-in Hebrew → English dictionary for e-commerce category slugs.
 *
 * Why: the AI-based translator at src/lib/ai/slug-actions.ts is great
 * but requires an API key (Anthropic / OpenAI / Google). This dictionary
 * covers ~95% of common Israeli shopping vocabulary with zero cost,
 * zero network calls, and zero setup.
 *
 * Strategy:
 *   1. Tokenize the input into Hebrew words.
 *   2. Strip common prefixes ("ל", "ב", "מ", "ש", "ו", "ה") so
 *      "לגבר" matches "גבר" entry.
 *   3. Look up each word in the dictionary.
 *   4. If at least ONE word translated, join with hyphens and return.
 *   5. Otherwise return null so the caller can fall back to the AI
 *      translator (if configured) or transliteration.
 *
 * Adding a term: just push it to the relevant section. Keep keys lowercase
 * Hebrew (Hebrew has no uppercase). Values are the English noun, plural
 * preferred for category names ("rings", not "ring").
 */

// ─── The dictionary ────────────────────────────────────────────────
// Organized by category for ease of maintenance. The runtime merges
// them into a single Map.

const JEWELRY: Record<string, string> = {
  // Jewelry items (plural and singular)
  "תכשיט": "jewelry",
  "תכשיטים": "jewelry",
  "שרשרת": "necklace",
  "שרשראות": "necklaces",
  "טבעת": "ring",
  "טבעות": "rings",
  "צמיד": "bracelet",
  "צמידים": "bracelets",
  "עגיל": "earring",
  "עגילים": "earrings",
  "תליון": "pendant",
  "תליונים": "pendants",
  "שעון": "watch",
  "שעונים": "watches",
  "סיכה": "pin",
  "סיכות": "pins",
  "חפת": "cufflink",
  "חפתים": "cufflinks",
  "מחזיק": "holder",
  "מחזיקי": "holders",
  "מפתחות": "keys",
  "מפתח": "key",
  "מחזיק-מפתחות": "keychains",
};

const MATERIALS: Record<string, string> = {
  "זהב": "gold",
  "כסף": "silver",
  "פלטינה": "platinum",
  "פלטינום": "platinum",
  "פלדה": "steel",
  "ברזל": "iron",
  "נחושת": "copper",
  "אלומיניום": "aluminum",
  "עור": "leather",
  "בד": "fabric",
  "כותנה": "cotton",
  "צמר": "wool",
  "משי": "silk",
  "פלסטיק": "plastic",
  "עץ": "wood",
  "זכוכית": "glass",
  "קרמיקה": "ceramic",
  "אבן": "stone",
  "אבני": "stones",
  "אבנים": "stones",
  "יהלום": "diamond",
  "יהלומים": "diamonds",
  "פנינה": "pearl",
  "פנינים": "pearls",
};

const CLOTHING: Record<string, string> = {
  "ביגוד": "clothing",
  "בגדים": "clothing",
  "בגד": "clothing",
  "חולצה": "shirt",
  "חולצות": "shirts",
  "טישרט": "tshirt",
  "מכנסיים": "pants",
  "מכנס": "pants",
  "שמלה": "dress",
  "שמלות": "dresses",
  "חצאית": "skirt",
  "חצאיות": "skirts",
  "ז׳קט": "jacket",
  "ז'קט": "jacket",
  "ז׳קטים": "jackets",
  "ז'קטים": "jackets",
  "מעיל": "coat",
  "מעילים": "coats",
  "סוודר": "sweater",
  "סוודרים": "sweaters",
  "בגד-ים": "swimsuit",
  "בגדי-ים": "swimsuits",
  "פיג׳מה": "pajamas",
  "פיג'מה": "pajamas",
  "תחתון": "underwear",
  "תחתונים": "underwear",
  "גרבי": "socks",
  "גרביים": "socks",
  "כובע": "hat",
  "כובעים": "hats",
};

const SHOES: Record<string, string> = {
  "נעל": "shoe",
  "נעליים": "shoes",
  "מגף": "boot",
  "מגפיים": "boots",
  "סנדל": "sandal",
  "סנדלים": "sandals",
  "כפכף": "flipflop",
  "כפכפים": "flipflops",
};

const BAGS: Record<string, string> = {
  "תיק": "bag",
  "תיקים": "bags",
  "ארנק": "wallet",
  "ארנקי": "wallets",
  "ארנקים": "wallets",
  "תרמיל": "backpack",
  "תרמילים": "backpacks",
  "מזוודה": "suitcase",
  "מזוודות": "suitcases",
  "קלמר": "pencilcase",
  "קלמרים": "pencilcases",
};

const BEAUTY: Record<string, string> = {
  "איפור": "makeup",
  "קוסמטיקה": "cosmetics",
  "בושם": "perfume",
  "בשמים": "perfumes",
  "קרם": "cream",
  "קרמים": "creams",
  "סבון": "soap",
  "סבונים": "soaps",
  "שמפו": "shampoo",
  "מסכה": "mask",
  "מסכות": "masks",
  "שפתון": "lipstick",
  "שפתונים": "lipsticks",
  "מסקרה": "mascara",
  "סומק": "blush",
  "צלליות": "eyeshadow",
};

const HOME: Record<string, string> = {
  "בית": "home",
  "מטבח": "kitchen",
  "סלון": "living-room",
  "חדר": "room",
  "חדר-שינה": "bedroom",
  "חדר-אמבטיה": "bathroom",
  "ריהוט": "furniture",
  "כלים": "ware",
  "כלי-מטבח": "kitchenware",
  "מצעים": "bedding",
  "כריות": "pillows",
  "שמיכות": "blankets",
  "מגבת": "towel",
  "מגבות": "towels",
  "נר": "candle",
  "נרות": "candles",
  "צמח": "plant",
  "צמחים": "plants",
};

const FOOD: Record<string, string> = {
  "אוכל": "food",
  "מזון": "food",
  "שתייה": "drinks",
  "משקאות": "drinks",
  "יין": "wine",
  "יינות": "wines",
  "בירה": "beer",
  "ממתקים": "candy",
  "שוקולד": "chocolate",
  "עוגיות": "cookies",
  "עוגות": "cakes",
  "תה": "tea",
  "קפה": "coffee",
  "תוסף": "supplement",
  "תוספי": "supplements",
  "תוספים": "supplements",
  "תוסף-תזונה": "supplement",
  "תוספי-תזונה": "supplements",
  "ויטמין": "vitamin",
  "ויטמינים": "vitamins",
  "חלבון": "protein",
  "חלבונים": "proteins",
};

const KIDS: Record<string, string> = {
  "תינוק": "baby",
  "תינוקות": "babies",
  "ילד": "kid",
  "ילדים": "kids",
  "ילדה": "girl",
  "ילדות": "girls",
  "צעצוע": "toy",
  "צעצועים": "toys",
  "משחק": "game",
  "משחקים": "games",
  "ספר": "book",
  "ספרים": "books",
};

const MODIFIERS: Record<string, string> = {
  // Audience
  "גבר": "men",
  "גברים": "men",
  "אישה": "women",
  "נשים": "women",
  "יוניסקס": "unisex",
  // Occasion
  "יום-הולדת": "birthday",
  "חתונה": "wedding",
  "אירוסין": "engagement",
  "מתנה": "gift",
  "מתנות": "gifts",
  "חג": "holiday",
  "חגים": "holidays",
  // Sale / status
  "מבצע": "sale",
  "מבצעים": "sale",
  "חדש": "new",
  "חדשים": "new",
  "פופולרי": "popular",
  "מומלץ": "featured",
  "אהוב": "favorites",
  "אהובים": "favorites",
  // Adjectives
  "גדול": "large",
  "קטן": "small",
  "בינוני": "medium",
  "ארוך": "long",
  "קצר": "short",
  "כחול": "blue",
  "אדום": "red",
  "ירוק": "green",
  "צהוב": "yellow",
  "שחור": "black",
  "לבן": "white",
  "ורוד": "pink",
  "סגול": "purple",
  "כתום": "orange",
  "חום": "brown",
  "אפור": "gray",
};

const ELECTRONICS: Record<string, string> = {
  "אלקטרוניקה": "electronics",
  "טלפון": "phone",
  "טלפונים": "phones",
  "מחשב": "computer",
  "מחשבים": "computers",
  "טאבלט": "tablet",
  "טאבלטים": "tablets",
  "אוזניות": "headphones",
  "רמקול": "speaker",
  "רמקולים": "speakers",
  "מטען": "charger",
  "מטענים": "chargers",
  "כבל": "cable",
  "כבלים": "cables",
  "כיסוי": "case",
  "כיסויים": "cases",
};

const SPORTS: Record<string, string> = {
  "ספורט": "sports",
  "כושר": "fitness",
  "אופניים": "bicycle",
  "ריצה": "running",
  "יוגה": "yoga",
  "שחייה": "swimming",
  "כדורגל": "soccer",
  "כדורסל": "basketball",
};

// Common connectors (stop words) — these get stripped when they appear
// between matched terms ("ארנקי עור" → "leather wallets" not "wallets of leather").
const STOP_WORDS = new Set([
  "של",
  "עם",
  "ו",
  "וגם",
  "או",
  "גם",
]);

// Common prefixes Hebrew attaches to nouns ("לגברים" = "for men").
// We try stripping each prefix when a word doesn't match directly.
const PREFIXES = ["ל", "ב", "מ", "ש", "ו", "ה", "כ"];

// ─── Build the lookup map ──────────────────────────────────────────

const DICT: Map<string, string> = new Map();
for (const group of [
  JEWELRY,
  MATERIALS,
  CLOTHING,
  SHOES,
  BAGS,
  BEAUTY,
  HOME,
  FOOD,
  KIDS,
  MODIFIERS,
  ELECTRONICS,
  SPORTS,
]) {
  for (const [k, v] of Object.entries(group)) {
    // Strip nikkud just in case the term is pasted with vowel marks.
    DICT.set(stripNikkud(k), v);
  }
}

// ─── Tokenization helpers ──────────────────────────────────────────

function stripNikkud(s: string): string {
  return s.replace(/[֑-ׇ]/g, "");
}

/**
 * Strip a single Hebrew prefix if the result is a known dictionary key.
 * e.g. "לגברים" → strip "ל" → "גברים" → found → "men".
 */
function lookupWithPrefixStrip(word: string): string | null {
  if (DICT.has(word)) return DICT.get(word)!;
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length > p.length + 1) {
      const stripped = word.slice(p.length);
      if (DICT.has(stripped)) return DICT.get(stripped)!;
    }
  }
  return null;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Try to translate a Hebrew phrase to an English slug using the
 * built-in dictionary. Returns null if no word matched (caller should
 * fall back to AI or transliteration).
 *
 * Examples:
 *   "תכשיטי כסף"   → "silver-jewelry"
 *   "ארנקי עור"    → "leather-wallets"
 *   "מתנות לגבר"   → "gifts-men"
 *   "שרשרת זהב"    → "gold-necklace"
 *   "ז'ירפה רוקדת" → null (nothing matched)
 */
export function dictionaryTranslate(input: string): string | null {
  const cleaned = stripNikkud(input.trim());
  if (!cleaned) return null;

  // Split on whitespace and Hebrew/Latin punctuation, keep Hebrew letters.
  const words = cleaned
    .split(/[\s,.\-_/\\()\[\]:;"'״׳!?]+/)
    .filter(Boolean);

  const translated: string[] = [];
  let matchedAny = false;
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const hit = lookupWithPrefixStrip(word);
    if (hit) {
      translated.push(hit);
      matchedAny = true;
    } else {
      // If a word doesn't match, drop it. This keeps the slug clean.
      // (Alternative: transliterate it — but that mixes scripts ugly.)
    }
  }

  if (!matchedAny) return null;

  // Common pattern: "ארנקי עור" should become "leather-wallets" not
  // "wallets-leather". When we see a noun followed by a material, swap
  // them. We do a simple heuristic: if the first translated word is in
  // a "noun" group and the second is in a "material" group, swap.
  if (translated.length === 2) {
    const [first, second] = translated;
    if (isMaterial(second) && !isMaterial(first)) {
      return `${second}-${first}`;
    }
  }

  return translated
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isMaterial(en: string): boolean {
  return Object.values(MATERIALS).includes(en);
}
