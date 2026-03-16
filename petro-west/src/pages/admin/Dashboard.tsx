import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetOrderStats, useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, Calendar, Clock, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats } = useGetOrderStats();
  const { data: recentOrders } = useListOrders({ limit: 5 });

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
          <h1 className="font-display text-4xl text-primary mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store's performance.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button asChild variant="secondary" className="flex-1 sm:flex-none hover-elevate">
            <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2"/> Add Product</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        <Card className="hover-elevate transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.pendingOrders || 0}</div>
            <Link href="/admin/orders?status=Pending" className="text-xs text-secondary font-bold uppercase hover:underline mt-2 inline-block">Review Now &rarr;</Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#001D3D] text-white border-none sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Revenue (Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl text-secondary mt-1">
              {stats?.monthRevenue?.toLocaleString() || 0} <span className="text-lg text-white">DA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl text-primary">Recent Orders</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Latest 5 orders received.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Wilaya</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.productName}</TableCell>
                    <TableCell>{order.wilayaName}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-bold">{order.totalPrice.toLocaleString()} DA</TableCell>
                    <TableCell className="text-right">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentOrders?.orders || recentOrders.orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders yet.</TableCell>
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
