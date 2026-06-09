import { AnnouncementBar } from "@/components/site/announcement-bar";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { KodMaxCredit } from "@/components/site/kodmax-credit";
import { CookieBanner } from "@/components/site/cookie-banner";
import { CartDrawer } from "@/components/site/cart-drawer";
import { PopupOrchestrator } from "@/components/site/popup-orchestrator";
import { ChatbotWidget } from "@/components/site/chatbot-widget";
import { ShopSettingsProvider } from "@/components/site/shop-settings-provider";
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
    <ShopSettingsProvider
      value={{
        freeShippingMin: settings.shop.freeShippingMin,
        shippingDays: settings.shop.shippingDays,
        warranty: settings.shop.warranty,
        returnDays: settings.shop.returnDays,
      }}
    >
      <AnnouncementBar />
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
      <KodMaxCredit />
      <CartDrawer />
      <PopupOrchestrator popups={popups} isAuthenticated={Boolean(user)} />
      {settings.chatbot.enabled && (
        <ChatbotWidget
          welcomeMessage={settings.chatbot.welcomeMessage}
          position={settings.chatbot.position}
        />
      )}
      {/* Renders only until the visitor makes a consent choice; gated
          via the client-side persisted store. */}
      <CookieBanner />
    </ShopSettingsProvider>
  );
}
