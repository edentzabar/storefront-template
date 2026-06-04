import "server-only";

/**
 * Back-compat re-export. The real implementation moved to
 * `src/lib/payment/mock.ts`, which lives behind a provider interface
 * (`src/lib/payment/provider.ts`) so we can swap to CardCom / Tranzila
 * for production via env (PAYMENT_PROVIDER=cardcom).
 *
 * Once the checkout flow is migrated to the hosted-page redirect
 * pattern (which keeps card data out of our server entirely), this
 * file can be deleted.
 */
export { TEST_CARDS, processPayment } from "./mock";
