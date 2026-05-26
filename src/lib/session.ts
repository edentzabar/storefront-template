import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the current session in a Server Component / Route Handler.
 * Cached per-request.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
