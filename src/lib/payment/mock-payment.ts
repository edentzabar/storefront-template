import "server-only";
import type { PaymentMethod } from "@prisma/client";

/**
 * Mock payment processor. Simulates real PSP behavior (Tranzila/CardCom/iCount):
 * - artificial 1.5s delay to mimic network round-trip
 * - specific test card numbers trigger known failures
 * - any other card number "succeeds" and returns a fake reference
 *
 * When wiring real Tranzila later, replace this file. The public API
 * (processPayment) stays the same.
 */

export const TEST_CARDS = {
  success: "4111 1111 1111 1111",
  declined: "4000 0000 0000 0002",
  insufficientFunds: "4000 0000 0000 9995",
  expired: "4000 0000 0000 0069",
} as const;

export type PaymentResult =
  | { ok: true; reference: string; last4: string | null }
  | { ok: false; error: string };

type ProcessPaymentInput = {
  method: PaymentMethod;
  amount: number;
  cardNumber?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
  // Simulate network round-trip
  await sleep(1500);

  // Non-card methods always succeed in mock mode
  if (input.method !== "card") {
    return {
      ok: true,
      reference: makeReference(input.method.toUpperCase()),
      last4: null,
    };
  }

  // Card flow
  const cleaned = (input.cardNumber ?? "").replace(/\D/g, "");
  if (cleaned.length < 12) {
    return { ok: false, error: "מספר כרטיס לא תקין" };
  }

  // Test cards with predictable failures
  if (cleaned === "4000000000000002") {
    return { ok: false, error: "הכרטיס נדחה ע״י הבנק. נסה כרטיס אחר." };
  }
  if (cleaned === "4000000000009995") {
    return { ok: false, error: "אין מספיק יתרה בכרטיס." };
  }
  if (cleaned === "4000000000000069") {
    return { ok: false, error: "הכרטיס פג תוקף." };
  }

  // Default: success
  return {
    ok: true,
    reference: makeReference("MOCK"),
    last4: cleaned.slice(-4),
  };
}

function makeReference(prefix: string) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}
