import "server-only";
import type { PaymentMethod } from "@prisma/client";

/**
 * Payment provider interface — designed around the "hosted page"
 * model that every Israeli PSP (CardCom, Tranzila, Z-Credit, iCount)
 * supports. The CRITICAL property: card numbers NEVER touch our server.
 *
 * Flow:
 *   1. `start()` — server tells the PSP "we want to charge X agorot for
 *      order Y". PSP returns a one-time URL we redirect the customer to.
 *   2. Customer enters card on the PSP's page (their TLS, their PCI scope).
 *   3. PSP redirects back to our `successUrl` with a token.
 *   4. `complete(token)` — server asks PSP "is this token good for that
 *      charge?" PSP confirms + returns a reference + last4. We persist
 *      the order with `paymentReference` + `paymentLast4` only.
 *
 * This puts us in PCI DSS SAQ-A — the lowest scope, where we self-attest
 * once a year that we never see, store, or transmit card data. The
 * alternative (PSP API where we POST the card to them) would put us in
 * SAQ-A-EP and require quarterly ASV scans + tighter network controls.
 *
 * Mock provider is for local dev only. It accepts a card number for the
 * test-mode UX. In production, providers.mock is REJECTED at startup
 * (see selectProvider below).
 */

export type PaymentResult =
  | { ok: true; reference: string; last4: string | null }
  | { ok: false; error: string };

export type StartInput = {
  method: PaymentMethod;
  amount: number; // agorot
  orderId: string;
  customerEmail: string;
  customerFullName: string;
  /** URL the PSP redirects to on success. Must include the order ID
   *  somewhere so we can pair the returned token with the order. */
  successUrl: string;
  /** URL the PSP redirects to on cancel/failure. */
  cancelUrl: string;
};

export type StartResult =
  | {
      ok: true;
      /** Where to send the customer's browser. */
      redirectUrl: string;
      /** Opaque PSP-issued payment session ID. We store it on the order
       *  so the success callback can verify the round-trip. */
      sessionId: string;
    }
  | { ok: false; error: string };

export type CompleteInput = {
  /** The token / transactionId returned by the PSP to our successUrl. */
  token: string;
  /** The session ID we recorded from start(). */
  sessionId: string;
  /** The expected order amount in agorot — guard against mismatch. */
  expectedAmount: number;
};

export interface PaymentProvider {
  readonly name: string;
  /**
   * Begin a payment. Returns a URL to redirect the customer to.
   * Throws / returns ok:false if PSP setup is misconfigured.
   */
  start(input: StartInput): Promise<StartResult>;
  /**
   * Verify a token returned by the PSP after the customer paid.
   * Server-to-server call. Returns the reference + last4 to persist.
   */
  complete(input: CompleteInput): Promise<PaymentResult>;
}

/**
 * Pick a provider based on env. In production, the mock provider is
 * REJECTED — better to break the boot than to silently let a mock
 * charge ride. To switch to CardCom, set:
 *   PAYMENT_PROVIDER=cardcom
 *   CARDCOM_TERMINAL_NUMBER=...
 *   CARDCOM_API_USER=...
 *   CARDCOM_API_PASSWORD=...
 */
export async function selectProvider(): Promise<PaymentProvider> {
  const name = process.env.PAYMENT_PROVIDER || "mock";

  if (name === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "PAYMENT_PROVIDER=mock is not allowed in production. " +
          "Set PAYMENT_PROVIDER=cardcom (or another real PSP) and configure credentials.",
      );
    }
    const { mockProvider } = await import("./mock");
    return mockProvider;
  }

  if (name === "cardcom") {
    const { createCardComProvider } = await import("./cardcom");
    return createCardComProvider();
  }

  throw new Error(`Unknown PAYMENT_PROVIDER: ${name}`);
}
