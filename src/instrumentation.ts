/**
 * Next.js calls `register()` once per server boot (per runtime). We
 * use it to run the env audit so missing production vars show up
 * loudly in Vercel logs immediately, not when a user hits the broken
 * code path two days later.
 *
 * Keep this lean — anything blocking here delays cold starts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { auditEnv } = await import("./lib/env-check");
    auditEnv();
  }
}
