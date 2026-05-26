import { AnnouncementBar } from "@/components/site/announcement-bar";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { PopupOrchestrator } from "@/components/site/popup-orchestrator";
import { getActivePopups } from "@/lib/popups";
import { getCurrentUser } from "@/lib/session";

export default async function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [popups, user] = await Promise.all([getActivePopups(), getCurrentUser()]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
      <CartDrawer />
      <PopupOrchestrator popups={popups} isAuthenticated={Boolean(user)} />
    </>
  );
}
