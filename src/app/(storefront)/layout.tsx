import { AnnouncementBar } from "@/components/site/announcement-bar";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { PopupOrchestrator } from "@/components/site/popup-orchestrator";
import { ChatbotWidget } from "@/components/site/chatbot-widget";
import { getActivePopups } from "@/lib/popups";
import { getCurrentUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/site-settings";

export default async function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [popups, user, settings] = await Promise.all([
    getActivePopups(),
    getCurrentUser(),
    getSiteSettings(),
  ]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
      <CartDrawer />
      <PopupOrchestrator popups={popups} isAuthenticated={Boolean(user)} />
      {settings.chatbot.enabled && (
        <ChatbotWidget
          welcomeMessage={settings.chatbot.welcomeMessage}
          position={settings.chatbot.position}
        />
      )}
    </>
  );
}
