import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { getCurrentUser } from "@/lib/session";
import { getOrdersByUser } from "@/lib/queries";
import { AccountView } from "./account-view";

export const metadata: Metadata = {
  title: "החשבון שלי",
  description: "החשבון שלך.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const orders = await getOrdersByUser(user.id);

  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "חשבון" }]} />
      <main className="py-12 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-2 text-center">
            החשבון שלי
          </h1>
          <p className="text-center text-brand-text-soft mb-10">
            שלום, {user.name}
          </p>
          <AccountView
            user={{
              name: user.name,
              email: user.email,
              phone: (user as { phone?: string }).phone ?? "",
              role: (user as { role?: string }).role ?? "customer",
            }}
            orders={orders}
          />
        </div>
      </main>
    </>
  );
}
