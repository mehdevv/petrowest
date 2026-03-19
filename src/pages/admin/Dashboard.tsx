import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetOrderStats, useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, Calendar, Clock, PlusCircle, Eye, Users, BarChart3, Store, Package, CreditCard } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────

interface VisitStats {
  todayViews: number;
  weekViews: number;
  monthViews: number;
  totalViews: number;
  uniqueToday: number;
  uniqueWeek: number;
  uniqueMonth: number;
  uniqueTotal: number;
  daily: { date: string; views: number; uniqueVisitors: number }[];
}

interface FunnelStats {
  totalVisits: number;
  uniqueVisitors: number;
  shopBrowsers: number;
  productViewers: number;
  buyers: number;
  pctShop: number;
  pctProduct: number;
  pctBuyers: number;
}

// ── Hooks ────────────────────────────────────────────────

function useVisitStats() {
  return useQuery<VisitStats>({
    queryKey: ["visit-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visit_stats");
      if (error) throw new Error(error.message);
      return typeof data === "string" ? JSON.parse(data) : data;
    },
    refetchInterval: 60_000,
  });
}

function useFunnelStats() {
  return useQuery<FunnelStats>({
    queryKey: ["funnel-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_funnel_stats");
      if (error) throw new Error(error.message);
      return typeof data === "string" ? JSON.parse(data) : data;
    },
    refetchInterval: 60_000,
  });
}

// ── Chart config ─────────────────────────────────────────

const visitChartConfig = {
  views: { label: "Visites", color: "#FFC300" },
  uniqueVisitors: { label: "Visiteurs Uniques", color: "#001D3D" },
};

// ── Funnel step component ────────────────────────────────

function FunnelStep({
  label,
  count,
  pct,
  color,
  icon: Icon,
  maxWidth,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  icon: React.ElementType;
  maxWidth: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4" style={{ color }} />
            {label}
          </span>
          <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-9 bg-muted rounded-lg overflow-hidden">
          <div
            className="h-full rounded-lg flex items-center px-3 transition-all duration-700 ease-out"
            style={{ width: maxWidth, backgroundColor: color, minWidth: count > 0 ? "3rem" : "0" }}
          >
            <span className="text-white text-xs font-bold whitespace-nowrap">
              {count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status labels ────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  'pending': 'En attente',
  'confirmed': 'Confirmée',
  'shipped': 'Expédiée',
  'delivered': 'Livrée',
  'cancelled': 'Annulée',
};

// ── Dashboard ────────────────────────────────────────────

export default function Dashboard() {
  const { data: stats } = useGetOrderStats();
  const { data: recentOrders } = useListOrders({ limit: 5 });
  const { data: visitStats } = useVisitStats();
  const { data: funnel } = useFunnelStats();
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-orange-500 hover:bg-orange-600';
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
      case 'shipped': return 'bg-purple-500 hover:bg-purple-600';
      case 'delivered': return 'bg-green-500 hover:bg-green-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">Tableau de Bord</h1>
          <p className="text-muted-foreground">Aperçu des performances de votre boutique.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button asChild variant="secondary" className="flex-1 sm:flex-none hover-elevate">
            <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2"/> Ajouter un Produit</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        <Card className="hover-elevate transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.pendingOrders || 0}</div>
            <Link href="/admin/orders?status=Pending" className="text-xs text-secondary font-bold uppercase hover:underline mt-2 inline-block">Voir Maintenant &rarr;</Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes du Jour</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#001D3D] text-white border-none sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Revenu (Mois)</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl text-secondary mt-1">
              {stats?.monthRevenue?.toLocaleString() || 0} <span className="text-lg text-white">DA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Visites du Site
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Trafic des 30 derniers jours</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visitStats?.daily && visitStats.daily.length > 0 ? (
              <ChartContainer config={visitChartConfig} className="h-[280px] w-full">
                <AreaChart
                  data={visitStats.daily.map((d) => ({
                    date: d.date,
                    views: d.views,
                    uniqueVisitors: d.uniqueVisitors,
                    label: format(new Date(d.date), "d MMM", { locale: fr }),
                  }))}
                  margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC300" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FFC300" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#001D3D" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#001D3D" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          if (payload?.[0]?.payload?.date) {
                            return format(new Date(payload[0].payload.date), "EEEE d MMMM yyyy", { locale: fr });
                          }
                          return "";
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#FFC300"
                    strokeWidth={2.5}
                    fill="url(#visitGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#001D3D"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    fill="url(#uniqueGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de visite disponible.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Eye className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{visitStats?.todayViews ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                visites · <span className="font-semibold text-foreground">{visitStats?.uniqueToday ?? 0}</span> uniques
              </p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{visitStats?.weekViews ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                visites · <span className="font-semibold text-foreground">{visitStats?.uniqueWeek ?? 0}</span> uniques
              </p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{visitStats?.monthViews ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                visites · <span className="font-semibold text-foreground">{visitStats?.uniqueMonth ?? 0}</span> uniques
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion Funnel */}
      <Card className="mb-10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Entonnoir de Conversion
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Ce mois — du visiteur à l'acheteur</p>
            </div>
            {funnel && (
              <div className="flex items-baseline gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                <span className="text-2xl font-bold text-primary">{funnel.uniqueVisitors.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">visiteurs uniques</span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-2xl font-bold text-primary">{funnel.totalVisits.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">visites totales</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {funnel ? (
            <div className="space-y-4">
              <FunnelStep
                label="Tous les Visiteurs"
                count={funnel.uniqueVisitors}
                pct={100}
                color="#001D3D"
                icon={Users}
                maxWidth="100%"
              />
              <FunnelStep
                label="Ont Navigué la Boutique"
                count={funnel.shopBrowsers}
                pct={funnel.pctShop}
                color="#2563eb"
                icon={Store}
                maxWidth={`${Math.max(funnel.pctShop, 3)}%`}
              />
              <FunnelStep
                label="Ont Vu un Produit"
                count={funnel.productViewers}
                pct={funnel.pctProduct}
                color="#7c3aed"
                icon={Package}
                maxWidth={`${Math.max(funnel.pctProduct, 3)}%`}
              />
              <FunnelStep
                label="Ont Commandé"
                count={funnel.buyers}
                pct={funnel.pctBuyers}
                color="#16a34a"
                icon={CreditCard}
                maxWidth={`${Math.max(funnel.pctBuyers, 3)}%`}
              />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chargement des données...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl text-primary">Commandes Récentes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Les 5 dernières commandes reçues.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">Voir Tout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Wilaya</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.productName}</TableCell>
                    <TableCell>{order.wilayaName}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "d MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell className="font-bold">{order.totalPrice.toLocaleString()} DA</TableCell>
                    <TableCell className="text-right">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>{STATUS_LABELS[order.status.toLowerCase()] || order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentOrders?.orders || recentOrders.orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune commande.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
