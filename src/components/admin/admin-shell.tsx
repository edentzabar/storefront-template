import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminThemeProvider } from "./theme-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import type { AdminNotification } from "./notifications-bell";

export function AdminShell({
  children,
  userName,
  userEmail,
  notifications,
  pendingOrders,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  notifications: AdminNotification[];
  pendingOrders: number;
}) {
  return (
    <AdminThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen flex bg-background text-foreground">
          {/* Desktop sidebar — hidden on mobile */}
          <div className="hidden md:flex">
            <AdminSidebar pendingOrders={pendingOrders} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <AdminTopbar
              userName={userName}
              userEmail={userEmail}
              notifications={notifications}
              pendingOrders={pendingOrders}
            />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </AdminThemeProvider>
  );
}
