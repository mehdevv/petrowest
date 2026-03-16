import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Truck, 
  CarFront, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminGetMe, useAdminLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Delivery Prices", href: "/admin/delivery", icon: Truck },
  { label: "Vehicle Filter", href: "/admin/vehicle-filter", icon: CarFront },
];

export function AdminLayout({ children }: { children: ReactNode }) {
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  
  if (isError || !admin) {
    setLocation("/admin/login");
    return null;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#001D3D] text-white">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
            <span className="text-primary font-display font-bold text-lg leading-none">PW</span>
          </div>
          <span className="font-display tracking-widest text-xl uppercase">Petro West<br/><span className="text-secondary text-sm">Admin Panel</span></span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-4 px-4 text-sm text-white/50">Logged in as {admin.name}</div>
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-2" 
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4" />
          {logout.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-[#001D3D] border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-2xl text-primary md:hidden">Petro West Admin</h1>
          </div>
          
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
