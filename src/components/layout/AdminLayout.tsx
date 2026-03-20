import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  CarFront, 
  LogOut,
  Menu,
  BookOpen,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminGetMe, useAdminLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const NAV_KEYS = [
  { labelKey: "admin.nav.dashboard", href: "/admin", icon: LayoutDashboard },
  { labelKey: "admin.nav.orders", href: "/admin/orders", icon: ShoppingCart },
  { labelKey: "admin.nav.products", href: "/admin/products", icon: Package },
  { labelKey: "admin.nav.catalogue", href: "/admin/catalogue", icon: BookOpen },
  { labelKey: "admin.nav.delivery", href: "/admin/delivery", icon: Truck },
  { labelKey: "admin.nav.vehicle", href: "/admin/vehicle-filter", icon: CarFront },
  { labelKey: "admin.nav.b2b", href: "/admin/b2b-messages", icon: Building2 },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "").startsWith("ar");
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: admin, isLoading, isError } = useAdminGetMe({
    query: { retry: false }
  });

  const logout = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/admin/login");
      }
    }
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">{t("admin.loading")}</div>;
  
  if (isError || !admin) {
    setLocation("/admin/login");
    return null;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#001D3D] text-white">
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Petro West" className="h-20 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_KEYS.map((item) => {
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary text-secondary font-medium" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-secondary" : ""}`} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-4 px-4 text-sm text-white/50">{t("admin.connectedAs", { name: admin.name })}</div>
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-2" 
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4" />
          {logout.isPending ? t("admin.loggingOut") : t("admin.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block w-64 fixed inset-y-0 z-10 ${isArabic ? "right-0" : "left-0"}`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen ${isArabic ? "md:mr-64" : "md:ml-64"}`}>
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isArabic ? "right" : "left"} className="p-0 w-64 bg-[#001D3D] border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-2xl text-primary md:hidden">{t("admin.sidebarTitle")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="outline" size="sm" />
            <div className="text-sm font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString(
                i18n.language === "ar" ? "ar-DZ" : i18n.language === "en" ? "en-GB" : "fr-FR",
                { weekday: "long", year: "numeric", month: "long", day: "numeric" }
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
