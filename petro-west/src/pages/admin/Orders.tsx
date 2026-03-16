import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListOrders, useUpdateOrder } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Search, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const { data: ordersData } = useListOrders({
    search: search || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    limit: 100
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/stats"] });
        toast({ title: "Order updated successfully." });
        setSelectedOrder(null);
      }
    }
  });

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      id: selectedOrder.id,
      data: { status: newStatus, notes: selectedOrder.notes }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-orange-500';
      case 'confirmed': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">Orders Management</h1>
        <p className="text-muted-foreground">View and process customer orders.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant={statusFilter === "All" ? "default" : "outline"} 
            onClick={() => setStatusFilter("All")}
            className="rounded-full"
          >All</Button>
          {STATUSES.map(s => (
            <Button 
              key={s} 
              variant={statusFilter === s ? "default" : "outline"} 
              onClick={() => setStatusFilter(s)}
              className="rounded-full whitespace-nowrap"
            >
              {s}
            </Button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or phone..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Wilaya</TableHead>
                <TableHead className="text-right">Total (DA)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersData?.orders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.phone}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.productName || ""}>{order.productName}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.wilayaName}</TableCell>
                  <TableCell className="text-right font-bold">{order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${getStatusColor(order.status)} text-white hover:${getStatusColor(order.status)}`}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4 text-muted-foreground"/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6 border-b pb-4">
                <SheetTitle className="font-display text-2xl">Order #{selectedOrder.id}</SheetTitle>
                <div className="text-sm text-muted-foreground">{format(new Date(selectedOrder.createdAt), "PPP p")}</div>
              </SheetHeader>
              
              <div className="space-y-8">
                {/* Status Update */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">Update Status</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={handleUpdateStatus}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full h-12 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Customer Details</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Name:</span> <span className="col-span-2 font-medium">{selectedOrder.customerName}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Phone:</span> <span className="col-span-2 font-medium">{selectedOrder.phone}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Wilaya:</span> <span className="col-span-2 font-medium">{selectedOrder.wilayaName}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Address:</span> <span className="col-span-2 font-medium">{selectedOrder.address}</span></div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Order Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <div className="font-medium text-primary pb-2 border-b">{selectedOrder.productName}</div>
                    <div className="flex justify-between pt-2"><span>Price:</span> <span>{selectedOrder.productPrice?.toLocaleString()} DA</span></div>
                    <div className="flex justify-between"><span>Quantity:</span> <span>x{selectedOrder.quantity}</span></div>
                    <div className="flex justify-between"><span>Delivery:</span> <span>{selectedOrder.deliveryPrice.toLocaleString()} DA</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 text-primary"><span>Total:</span> <span>{selectedOrder.totalPrice.toLocaleString()} DA</span></div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Admin Notes</h3>
                  <Textarea 
                    placeholder="Add internal notes here..." 
                    value={selectedOrder.notes || ""}
                    onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                    className="mb-2"
                  />
                  <Button 
                    onClick={() => updateMutation.mutate({ id: selectedOrder.id, data: { status: selectedOrder.status, notes: selectedOrder.notes }})}
                    disabled={updateMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </AdminLayout>
  );
}
