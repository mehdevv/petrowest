import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DocumentLang } from "@/components/DocumentLang";
import { usePageTracking } from "@/hooks/use-analytics";
import NotFound from "@/pages/not-found";

// Public Pages
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetails from "@/pages/ProductDetails";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Products from "@/pages/admin/Products";
import ProductForm from "@/pages/admin/ProductForm";
import Categories from "@/pages/admin/Categories";
import Catalogue from "@/pages/admin/Catalogue";
import Delivery from "@/pages/admin/Delivery";
import VehicleFilter from "@/pages/admin/VehicleFilter";
import B2BMessages from "@/pages/admin/B2BMessages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/:slug" component={ProductDetails} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/orders" component={Orders} />
      <Route path="/admin/products" component={Products} />
      <Route path="/admin/products/new" component={ProductForm} />
      <Route path="/admin/products/:id/edit" component={ProductForm} />
      <Route path="/admin/categories" component={Categories} />
      <Route path="/admin/catalogue" component={Catalogue} />
      <Route path="/admin/delivery" component={Delivery} />
      <Route path="/admin/vehicle-filter" component={VehicleFilter} />
      <Route path="/admin/b2b-messages" component={B2BMessages} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  usePageTracking();
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <DocumentLang />
          <AppInner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
