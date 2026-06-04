import "server-only";
import type {
  PaymentProvider,
  StartInput,
  StartResult,
  CompleteInput,
  PaymentResult,
} from "./provider";

/**
 * Local-only mock provider. Simulates the hosted-page flow without
 * actually redirecting to a third party — start() returns a URL on
 * our own /api/payment/mock-result path that immediately completes.
 *
 * Test card behaviour is preserved from the previous mock so the
 * checkout UI's "test cards" panel still works in dev.
 *
 * provider.ts blocks selection of this module when NODE_ENV=production.
 */

export const TEST_CARDS = {
  success: "4111 1111 1111 1111",
  declined: "4000 0000 0000 0002",
  insufficientFunds: "4000 0000 0000 9995",
  expired: "4000 0000 0000 0069",
} as const;

// In-memory map from sessionId → expected order data, so complete()
// can validate. Cleared every server restart (dev only).
const sessions = new Map<
  string,
  { orderId: string; amount: number; card?: string }
>();

function makeReference(prefix: string) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

export const mockProvider: PaymentProvider = {
  name: "mock",

  async start(input: StartInput): Promise<StartResult> {
    const sessionId = makeReference("MOCK-S");
    sessions.set(sessionId, { orderId: input.orderId, amount: input.amount });
    // For local dev we don't actually redirect — the checkout-flow
    // calls complete() inline after a fake "approval".
    return { ok: true, redirectUrl: input.successUrl, sessionId };
  },

  async complete(input: CompleteInput): Promise<PaymentResult> {
    const sess = sessions.get(input.sessionId);
    if (!sess) {
      return { ok: false, error: "סשן תשלום לא נמצא" };
    }
    sessions.delete(input.sessionId);
    if (sess.amount !== input.expectedAmount) {
      return { ok: false, error: "סכום לא תואם" };
    }
    // The mock encodes test-card behaviour in the token string
    // (because there's no real PSP page to type into). Format:
    //   "card:4111111111111111" → success
    //   "card:4000000000000002" → declined
    // Anything else → success with random last4.
    const cleaned = (input.token || "").replace(/^card:/, "").replace(/\D/g, "");

    if (cleaned.length < 12) {
      // No card given — accept and return null last4 (non-card methods).
      return { ok: true, reference: makeReference("MOCK"), last4: null };
    }
    if (cleaned === "4000000000000002") {
      return { ok: false, error: "הכרטיס נדחה ע״י הבנק" };
    }
    if (cleaned === "4000000000009995") {
      return { ok: false, error: "אין מספיק יתרה" };
    }
    if (cleaned === "4000000000000069") {
      return { ok: false, error: "הכרטיס פג תוקף" };
    }
    return {
      ok: true,
      reference: makeReference("MOCK"),
      last4: cleaned.slice(-4),
    };
  },
};

/**
 * Back-compat shim for places that still import `processPayment` from
 * mock-payment.ts. Wraps the new provider in the old function signature.
 * Once the checkout flow is migrated to the redirect pattern, this
 * can go.
 */
export async function processPayment(input: {
  method: import("@prisma/client").PaymentMethod;
  amount: number;
  cardNumber?: string;
}): Promise<PaymentResult> {
  const sessionId = makeReference("MOCK-INLINE");
  sessions.set(sessionId, { orderId: "inline", amount: input.amount });
  return mockProvider.complete({
    token: input.cardNumber ? `card:${input.cardNumber}` : "",
    sessionId,
    expectedAmount: input.amount,
  });
}
