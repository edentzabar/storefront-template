import "server-only";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Provider-agnostic AI interface. Every AI-powered feature on the site
 * (description generator, chatbot, future modules) goes through this
 * layer so we can swap providers later without touching the call sites.
 *
 * Current state: only ANTHROPIC is wired (and as a stub — returns
 * placeholders until you set the API key in `/admin/settings` or via
 * the ANTHROPIC_API_KEY env var). Add OpenAI / Google by implementing
 * the same interface and registering them in `getProvider()`.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ImageInput = {
  /** "data:image/png;base64,..." OR an https URL the provider can fetch. */
  source: string;
  mimeType?: string;
};

export type AIProvider = {
  name: string;
  /** Plain text turn. Returns the assistant's reply. */
  text(messages: ChatMessage[], opts?: { maxTokens?: number }): Promise<string>;
  /** Multi-modal turn — at least one image + a question. */
  vision(
    images: ImageInput[],
    messages: ChatMessage[],
    opts?: { maxTokens?: number },
  ): Promise<string>;
};

type Resolved = {
  provider: AIProvider | null;
  /** Helps the UI explain WHY AI is off ("no key" vs "disabled by admin"). */
  reason: "disabled" | "no-key" | "no-provider" | "ok";
};

/**
 * Walks the resolution chain:
 *   1. site_setting.ai.enabled === false  → reason="disabled", null
 *   2. site_setting.ai.provider === ""    → reason="no-provider", null
 *   3. no apiKey in DB AND no env var     → reason="no-key", null
 *   4. otherwise                          → real provider instance
 */
export async function getProvider(): Promise<Resolved> {
  const settings = await getSiteSettings();
  if (!settings.ai.enabled) return { provider: null, reason: "disabled" };
  if (!settings.ai.provider) return { provider: null, reason: "no-provider" };

  const envKey = providerEnvKey(settings.ai.provider);
  const apiKey = settings.ai.apiKey || (envKey ? process.env[envKey] : "") || "";
  if (!apiKey) return { provider: null, reason: "no-key" };

  switch (settings.ai.provider) {
    case "anthropic":
      return {
        provider: createAnthropicStub(apiKey, settings.ai.model || "claude-sonnet-4-5"),
        reason: "ok",
      };
    case "openai":
    case "google":
      // Not yet wired — falls back to stub so the UI keeps working.
      return {
        provider: createGenericStub(settings.ai.provider, apiKey, settings.ai.model),
        reason: "ok",
      };
  }
}

function providerEnvKey(p: string): string | null {
  if (p === "anthropic") return "ANTHROPIC_API_KEY";
  if (p === "openai") return "OPENAI_API_KEY";
  if (p === "google") return "GOOGLE_GENERATIVE_AI_API_KEY";
  return null;
}

/* ───────── Provider implementations ───────── */

/**
 * Anthropic stub. Returns deterministic placeholders so the UI looks
 * right BEFORE you connect a real SDK. Swap in `@anthropic-ai/sdk`
 * here when ready — only this function changes, every call site
 * stays the same.
 */
function createAnthropicStub(apiKey: string, model: string): AIProvider {
  return {
    name: `anthropic:${model}`,
    async text(messages, opts) {
      void apiKey;
      void opts;
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      return STUB_TEXT_PREFIX + (lastUser?.content.slice(0, 60) ?? "…");
    },
    async vision(images, messages, opts) {
      void apiKey;
      void opts;
      const userQuestion =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      return [
        STUB_VISION_PREFIX,
        `(תמונה אחת + ${images.length - 1} נוספות)`,
        userQuestion ? `שאלה: "${userQuestion.slice(0, 80)}"` : "",
        "",
        "מוצר איכותי שמתאים לחנות שלכם. החליפו את הטקסט הזה אחרי שתחברו API key אמיתי.",
      ]
        .filter(Boolean)
        .join("\n");
    },
  };
}

function createGenericStub(name: string, apiKey: string, model: string): AIProvider {
  return {
    name: `${name}:${model || "default"}`,
    async text(messages) {
      void apiKey;
      const last = [...messages].reverse().find((m) => m.role === "user");
      return `[סטאב ${name}] ${last?.content.slice(0, 60) ?? ""}`;
    },
    async vision(_images, messages) {
      void apiKey;
      const last = [...messages].reverse().find((m) => m.role === "user");
      return `[סטאב ${name} vision] ${last?.content.slice(0, 80) ?? ""}`;
    },
  };
}

const STUB_TEXT_PREFIX = "🤖 [סטאב AI] תשובה לדוגמה. הגדירו ספק + מפתח באדמין → הגדרות → AI. הפנייה האחרונה: ";
const STUB_VISION_PREFIX = "🤖 [סטאב AI Vision] תיאור לדוגמה — חברו API key באדמין → הגדרות → AI:";
