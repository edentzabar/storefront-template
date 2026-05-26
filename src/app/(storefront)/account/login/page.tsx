import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחבר לחשבון שלך.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "חשבון", href: "/account" }, { label: "התחברות" }]} />
      <main className="py-16 px-6 lg:px-10 flex justify-center">
        <div className="w-full max-w-[420px]">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-8 text-center">
            התחברות
          </h1>
          <LoginForm />
        </div>
      </main>
    </>
  );
}
