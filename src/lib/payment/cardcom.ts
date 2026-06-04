import "server-only";
import type {
  PaymentProvider,
  StartInput,
  StartResult,
  CompleteInput,
  PaymentResult,
} from "./provider";

/**
 * CardCom Low Profile (LP) hosted-payment-page integration.
 *
 * Why Low Profile and not the direct API:
 *   • Low Profile redirects the customer to CardCom's hosted page.
 *     Card data goes from the customer's browser directly to CardCom
 *     over their TLS — we never see, store, or transmit it.
 *   • This keeps us in PCI DSS scope SAQ-A (lightest annual self-
 *     assessment, no quarterly scans, no card vault).
 *   • The direct API requires SAQ-A-EP at minimum, more network
 *     controls, more risk if our server is ever breached.
 *
 * Two ways to wire the success callback:
 *   1. Redirect — the customer comes back to our successUrl with a
 *      LowProfileId in the query. We then GET CardCom's
 *      `GetLowProfileResult` to verify. This is what `complete()`
 *      below implements.
 *   2. Webhook — CardCom POSTs a notification to a separate URL the
 *      moment payment clears, regardless of whether the customer
 *      reached our successUrl. Production should add this too;
 *      treat it as authoritative and the redirect as UX-only.
 *
 * Setup checklist for the merchant:
 *   1. Create CardCom Test → Production accounts at https://cardcom.solutions
 *   2. Grab Terminal Number, API User, API Password.
 *   3. Put them in Vercel env vars (see provider.ts).
 *   4. Set PAYMENT_PROVIDER=cardcom in Vercel.
 *   5. Configure CardCom webhook (Indicator URL) pointing to
 *      /api/payment/webhook (see route handler — TODO when wiring real).
 *
 * Cost / fraud notes:
 *   • Add `MaxNumOfPayments` to the start payload only if you want to
 *     allow installments (set from siteConfig.shop.maxInstallments).
 *   • Set `IsHidden3DS=false` so 3D Secure (Verified by Visa) fires on
 *     suspicious cards — required by Israeli banks for chargeback
 *     protection. Defaults to on.
 *   • For B2B / recurring, request token saving (CreateToken=true);
 *     CardCom returns a token we can charge later WITHOUT seeing the
 *     card again. Out of scope for this initial integration.
 */

const LP_CREATE_URL = "https://secure.cardcom.solutions/Interface/LowProfile.aspx";
const LP_GET_RESULT_URL =
  "https://secure.cardcom.solutions/Interface/BillGoldGetLowProfileIndicator.aspx";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `CardCom is misconfigured: ${name} env var is missing. ` +
        "See src/lib/payment/cardcom.ts for setup notes.",
    );
  }
  return v;
}

export function createCardComProvider(): PaymentProvider {
  const TerminalNumber = () => requireEnv("CARDCOM_TERMINAL_NUMBER");
  const ApiUserName = () => requireEnv("CARDCOM_API_USER");

  return {
    name: "cardcom",

    async start(input: StartInput): Promise<StartResult> {
      // CardCom amounts are in shekels with 2 decimals — we store agorot.
      const sum = (input.amount / 100).toFixed(2);

      const form = new URLSearchParams({
        TerminalNumber: TerminalNumber(),
        UserName: ApiUserName(),
        APILevel: "10",
        Operation: "1", // 1 = charge
        SumToBill: sum,
        CoinID: "1", // 1 = ILS
        Language: "he",
        ProductName: `הזמנה ${input.orderId}`,
        SuccessRedirectUrl: input.successUrl,
        ErrorRedirectUrl: input.cancelUrl,
        ReturnValue: input.orderId,
        // Best practice: pre-fill what we know so the customer doesn't retype.
        InvoiceHead_CustName: input.customerFullName,
        InvoiceHead_Email: input.customerEmail,
      });

      try {
        const res = await fetch(LP_CREATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
          // Don't hang the checkout if CardCom is slow — fail loudly.
          signal: AbortSignal.timeout(10_000),
        });
        const text = await res.text();
        // CardCom returns a urlencoded body like:
        //   ResponseCode=0&LowProfileCode=abcd-1234&url=https://...
        const out = Object.fromEntries(new URLSearchParams(text));
        if (out.ResponseCode !== "0" || !out.url || !out.LowProfileCode) {
          return {
            ok: false,
            error: out.Description || "פתיחת תשלום נכשלה",
          };
        }
        return {
          ok: true,
          redirectUrl: out.url,
          sessionId: out.LowProfileCode,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "פתיחת תשלום נכשלה",
        };
      }
    },

    async complete(input: CompleteInput): Promise<PaymentResult> {
      // SECURITY: We re-verify with CardCom server-to-server. We do
      // NOT trust the customer's browser to tell us "payment succeeded"
      // since the browser-side params can be tampered.
      const form = new URLSearchParams({
        TerminalNumber: TerminalNumber(),
        UserName: ApiUserName(),
        LowProfileCode: input.sessionId,
      });
      try {
        const res = await fetch(LP_GET_RESULT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
          signal: AbortSignal.timeout(10_000),
        });
        const text = await res.text();
        const out = Object.fromEntries(new URLSearchParams(text));
        if (out.ResponseCode !== "0" || out.OperationResponse !== "0") {
          return {
            ok: false,
            error: out.Description || "התשלום נכשל",
          };
        }
        // SECURITY: verify the amount CardCom charged matches what we
        // expected. Otherwise an attacker could intercept and try to
        // confirm a smaller payment for a larger order.
        const chargedAgorot = Math.round(Number(out.Sum || 0) * 100);
        if (chargedAgorot !== input.expectedAmount) {
          return {
            ok: false,
            error: "סכום החיוב אינו תואם להזמנה",
          };
        }
        return {
          ok: true,
          // CardCom's `InternalDealNumber` is the auth reference we
          // need for refunds / inquiries.
          reference: out.InternalDealNumber || out.DealResponse || "CARDCOM",
          last4: out.ExtShvaParams_Last4Digits || null,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "אימות תשלום נכשל",
        };
      }
    },
  };
}
