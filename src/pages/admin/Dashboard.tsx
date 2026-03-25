import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetOrderStats, useGetRevenueHistory, useListOrders, type RevenueHistoryBucket } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, Calendar, Clock, PlusCircle, Eye, Users, BarChart3, Store, Package, CreditCard, History } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { getDateFnsLocale } from "@/lib/date-locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <span className="text-sm font-bold" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="h-9 bg-muted rounded-lg overflow-hidden">
          <div
            className="h-full rounded-lg flex items-center px-3 transition-all duration-700 ease-out"
            style={{ width: maxWidth, backgroundColor: color, minWidth: count > 0 ? "3rem" : "0" }}
          >
            <span className="text-white text-xs font-bold whitespace-nowrap">{count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueBucketsTable({
  rows,
  emptyLabel,
  formatPeriod,
  colPeriod,
  colOrders,
  colRevenue,
}: {
  rows: RevenueHistoryBucket[];
  emptyLabel: string;
  formatPeriod: (period: string) => string;
  colPeriod: string;
  colOrders: string;
  colRevenue: string;
}) {
  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto max-h-[min(60vh,28rem)] overflow-y-auto rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{colPeriod}</TableHead>
            <TableHead className="text-end">{colOrders}</TableHead>
            <TableHead className="text-end">{colRevenue}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.period}-${i}`}>
              <TableCell className="font-medium">{formatPeriod(row.period)}</TableCell>
              <TableCell className="text-end tabular-nums">{row.orders}</TableCell>
              <TableCell className="text-end font-bold tabular-nums">{Number(row.revenue).toLocaleString()} DA</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const dfns = useMemo(() => getDateFnsLocale(i18n.language), [i18n.language]);
  const [revenueSheetOpen, setRevenueSheetOpen] = useState(false);

  const visitChartConfig = useMemo(
    () => ({
      views: { label: t("admin.dashboard.chartViews"), color: "#FFC300" },
      uniqueVisitors: { label: t("admin.dashboard.chartUnique"), color: "#001D3D" },
    }),
    [t]
  );

  const statusLabel = (status: string) => t(`admin.status.${status}` as const);

  const { data: stats } = useGetOrderStats();
  const { data: revenueHistory, isLoading: revenueHistoryLoading } = useGetRevenueHistory({
    query: { enabled: revenueSheetOpen },
  });
  const { data: recentOrders } = useListOrders({ limit: 5 });
  const { data: visitStats } = useVisitStats();
  const { data: funnel } = useFunnelStats();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-500 hover:bg-orange-600";
      case "confirmed":
        return "bg-blue-500 hover:bg-blue-600";
      case "shipped":
        return "bg-purple-500 hover:bg-purple-600";
      case "delivered":
        return "bg-green-500 hover:bg-green-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{t("admin.dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button asChild variant="secondary" className="flex-1 sm:flex-none hover-elevate">
            <Link href="/admin/products/new">
              <PlusCircle className="w-4 h-4 me-2" /> {t("admin.dashboard.addProduct")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        <Card className="hover-elevate transition-transform">
          <CardContent className="pt-6 pb-6 flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium leading-snug mb-0">{t("admin.dashboard.pendingOrders")}</CardTitle>
              <Clock className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
            </div>
            <div className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-primary leading-none tracking-tight tabular-nums mt-1">
              {stats?.pendingOrders || 0}
            </div>
            <Link href="/admin/orders?status=Pending" className="text-xs text-secondary font-bold uppercase hover:underline mt-2 inline-block w-fit">
              {t("admin.dashboard.seeNow")}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium leading-snug mb-0">{t("admin.dashboard.todayOrders")}</CardTitle>
              <ShoppingCart className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-primary leading-none tracking-tight tabular-nums mt-1">
              {stats?.todayOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium leading-snug mb-0">{t("admin.dashboard.thisWeek")}</CardTitle>
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-primary leading-none tracking-tight tabular-nums mt-1">
              {stats?.weekOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium leading-snug mb-0">{t("admin.dashboard.thisMonth")}</CardTitle>
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-primary leading-none tracking-tight tabular-nums mt-1">
              {stats?.monthOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#001D3D] text-white border-none sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">{t("admin.dashboard.revenueMonth")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl text-secondary mt-1">
              {stats?.monthRevenue?.toLocaleString() || 0} <span className="text-lg text-white">DA</span>
            </div>
            <p className="text-xs text-white/55 mt-2 leading-snug">{t("admin.dashboard.revenueMonthHint")}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20"
              onClick={() => setRevenueSheetOpen(true)}
            >
              <History className="h-4 w-4" />
              {t("admin.dashboard.revenueHistoryBtn")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("admin.dashboard.trafficTitle")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.dashboard.trafficSubtitle")}</p>
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
                    label: format(new Date(d.date), "d MMM", { locale: dfns }),
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
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          if (payload?.[0]?.payload?.date) {
                            return format(new Date(payload[0].payload.date), "EEEE d MMMM yyyy", { locale: dfns });
                          }
                          return "";
                        }}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="views" stroke="#FFC300" strokeWidth={2.5} fill="url(#visitGradient)" />
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
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">{t("admin.dashboard.noTraffic")}</div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.today")}</CardTitle>
              <Eye className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="font-display text-4xl sm:text-5xl font-bold text-primary leading-none tracking-tight">
                {visitStats?.todayViews ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("admin.dashboard.visitsUnique", { n: visitStats?.uniqueToday ?? 0 })}
              </p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.thisWeek")}</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="font-display text-4xl sm:text-5xl font-bold text-primary leading-none tracking-tight">
                {visitStats?.weekViews ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("admin.dashboard.visitsUnique", { n: visitStats?.uniqueWeek ?? 0 })}
              </p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.thisMonth")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="font-display text-4xl sm:text-5xl font-bold text-primary leading-none tracking-tight">
                {visitStats?.monthViews ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("admin.dashboard.visitsUnique", { n: visitStats?.uniqueMonth ?? 0 })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mb-10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("admin.dashboard.funnelTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t("admin.dashboard.funnelSubtitle")}</p>
            </div>
            {funnel && (
              <div className="flex items-baseline gap-1.5 bg-muted px-3 py-1.5 rounded-lg flex-wrap">
                <span className="text-2xl font-bold text-primary">{funnel.uniqueVisitors.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{t("admin.dashboard.uniqueVisitors")}</span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-2xl font-bold text-primary">{funnel.totalVisits.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{t("admin.dashboard.totalVisits")}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {funnel ? (
            <div className="space-y-4">
              <FunnelStep
                label={t("admin.dashboard.funnelAll")}
                count={funnel.uniqueVisitors}
                pct={100}
                color="#001D3D"
                icon={Users}
                maxWidth="100%"
              />
              <FunnelStep
                label={t("admin.dashboard.funnelShop")}
                count={funnel.shopBrowsers}
                pct={funnel.pctShop}
                color="#2563eb"
                icon={Store}
                maxWidth={`${Math.max(funnel.pctShop, 3)}%`}
              />
              <FunnelStep
                label={t("admin.dashboard.funnelProduct")}
                count={funnel.productViewers}
                pct={funnel.pctProduct}
                color="#7c3aed"
                icon={Package}
                maxWidth={`${Math.max(funnel.pctProduct, 3)}%`}
              />
              <FunnelStep
                label={t("admin.dashboard.funnelBuy")}
                count={funnel.buyers}
                pct={funnel.pctBuyers}
                color="#16a34a"
                icon={CreditCard}
                maxWidth={`${Math.max(funnel.pctBuyers, 3)}%`}
              />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">{t("admin.dashboard.funnelLoading")}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl text-primary">{t("admin.dashboard.recentOrders")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t("admin.dashboard.recentSubtitle")}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">{t("admin.dashboard.seeAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.dashboard.colOrder")}</TableHead>
                  <TableHead>{t("admin.dashboard.colClient")}</TableHead>
                  <TableHead>{t("admin.dashboard.colProduct")}</TableHead>
                  <TableHead>{t("admin.dashboard.colWilaya")}</TableHead>
                  <TableHead>{t("admin.dashboard.colDate")}</TableHead>
                  <TableHead>{t("admin.dashboard.colTotal")}</TableHead>
                  <TableHead className="text-end">{t("admin.dashboard.colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.productName}</TableCell>
                    <TableCell>{order.wilayaName}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "d MMM yyyy", { locale: dfns })}</TableCell>
                    <TableCell className="font-bold">{order.totalPrice.toLocaleString()} DA</TableCell>
                    <TableCell className="text-end">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {statusLabel(order.status) || order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentOrders?.orders || recentOrders.orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t("admin.dashboard.noOrders")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={revenueSheetOpen} onOpenChange={setRevenueSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("admin.dashboard.revenueHistoryTitle")}</SheetTitle>
            <SheetDescription>{t("admin.dashboard.revenueMonthHint")}</SheetDescription>
          </SheetHeader>
          {revenueHistoryLoading ? (
            <p className="text-sm text-muted-foreground text-center py-12">{t("admin.dashboard.revenueHistoryLoading")}</p>
          ) : (
            <Tabs defaultValue="daily" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">{t("admin.dashboard.revenueHistoryDaily")}</TabsTrigger>
                <TabsTrigger value="weekly">{t("admin.dashboard.revenueHistoryWeekly")}</TabsTrigger>
                <TabsTrigger value="monthly">{t("admin.dashboard.revenueHistoryMonthly")}</TabsTrigger>
              </TabsList>
              <TabsContent value="daily">
                <RevenueBucketsTable
                  rows={revenueHistory?.daily ?? []}
                  emptyLabel={t("admin.dashboard.revenueHistoryEmpty")}
                  colPeriod={t("admin.dashboard.revenueHistoryColPeriod")}
                  colOrders={t("admin.dashboard.revenueHistoryColOrders")}
                  colRevenue={t("admin.dashboard.revenueHistoryColRevenue")}
                  formatPeriod={(p) => format(parseISO(p), "PPP", { locale: dfns })}
                />
              </TabsContent>
              <TabsContent value="weekly">
                <RevenueBucketsTable
                  rows={revenueHistory?.weekly ?? []}
                  emptyLabel={t("admin.dashboard.revenueHistoryEmpty")}
                  colPeriod={t("admin.dashboard.revenueHistoryColPeriod")}
                  colOrders={t("admin.dashboard.revenueHistoryColOrders")}
                  colRevenue={t("admin.dashboard.revenueHistoryColRevenue")}
                  formatPeriod={(p) =>
                    t("admin.dashboard.revenueWeekOf", {
                      date: format(parseISO(p), "d MMM yyyy", { locale: dfns }),
                    })
                  }
                />
              </TabsContent>
              <TabsContent value="monthly">
                <RevenueBucketsTable
                  rows={revenueHistory?.monthly ?? []}
                  emptyLabel={t("admin.dashboard.revenueHistoryEmpty")}
                  colPeriod={t("admin.dashboard.revenueHistoryColPeriod")}
                  colOrders={t("admin.dashboard.revenueHistoryColOrders")}
                  colRevenue={t("admin.dashboard.revenueHistoryColRevenue")}
                  formatPeriod={(p) => format(parseISO(p), "LLLL yyyy", { locale: dfns })}
                />
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
