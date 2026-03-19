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
import { fr } from "date-fns/locale";
import { Search, Eye, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const STATUS_LABELS: Record<string, string> = {
  'Pending': 'En attente',
  'Confirmed': 'Confirmée',
  'Shipped': 'Expédiée',
  'Delivered': 'Livrée',
  'Cancelled': 'Annulée',
};

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
        toast({ title: "Commande mise à jour avec succès." });
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

  const exportToExcel = () => {
    const orders = ordersData?.orders;
    if (!orders || orders.length === 0) {
      toast({ title: "Aucune commande à exporter.", variant: "destructive" });
      return;
    }

    const rows = orders.map((o) => ({
      "N°": o.id,
      "Date": format(new Date(o.createdAt), "dd/MM/yyyy HH:mm"),
      "Client": o.customerName,
      "Téléphone": o.phone,
      "Produit": o.productName || "",
      "Quantité": o.quantity,
      "Wilaya": o.wilayaName,
      "Livraison": o.deliveryType === "domicile" ? "Domicile" : "Stop Desk",
      "Frais Livraison (DA)": o.deliveryPrice,
      "Total (DA)": o.totalPrice,
      "Statut": STATUS_LABELS[o.status] || o.status,
      "Adresse": o.address || "",
      "Notes": o.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
      { wch: 6 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
      { wch: 30 }, { wch: 8 }, { wch: 16 }, { wch: 12 },
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 20 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");

    const filterLabel = statusFilter !== "All" ? `_${STATUS_LABELS[statusFilter] || statusFilter}` : "";
    const dateStr = format(new Date(), "yyyy-MM-dd");
    XLSX.writeFile(wb, `Commandes_PetroWest${filterLabel}_${dateStr}.xlsx`);

    toast({ title: `${orders.length} commande(s) exportée(s) avec succès.` });
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
        <h1 className="font-display text-4xl text-primary mb-1">Gestion des Commandes</h1>
        <p className="text-muted-foreground">Voir et traiter les commandes clients.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant={statusFilter === "All" ? "default" : "outline"} 
            onClick={() => setStatusFilter("All")}
            className="rounded-full"
          >Tout</Button>
          {STATUSES.map(s => (
            <Button 
              key={s} 
              variant={statusFilter === s ? "default" : "outline"} 
              onClick={() => setStatusFilter(s)}
              className="rounded-full whitespace-nowrap"
            >
              {STATUS_LABELS[s] || s}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher nom ou téléphone..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="shrink-0 gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter Excel</span>
          </Button>
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
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Qté</TableHead>
                <TableHead>Wilaya</TableHead>
                <TableHead className="text-right">Total (DA)</TableHead>
                <TableHead className="text-center">Statut</TableHead>
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
                    <Badge className={`${getStatusColor(order.status)} text-white hover:${getStatusColor(order.status)}`}>{STATUS_LABELS[order.status] || order.status}</Badge>
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
                <SheetTitle className="font-display text-2xl">Commande #{selectedOrder.id}</SheetTitle>
                <div className="text-sm text-muted-foreground">{format(new Date(selectedOrder.createdAt), "PPP p", { locale: fr })}</div>
              </SheetHeader>
              
              <div className="space-y-8">
                {/* Status Update */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">Mettre à Jour le Statut</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={handleUpdateStatus}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full h-12 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Détails du Client</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Nom :</span> <span className="col-span-2 font-medium">{selectedOrder.customerName}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Téléphone :</span> <span className="col-span-2 font-medium">{selectedOrder.phone}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Wilaya :</span> <span className="col-span-2 font-medium">{selectedOrder.wilayaName}</span></div>
                    <div className="grid grid-cols-3"><span className="text-muted-foreground">Adresse :</span> <span className="col-span-2 font-medium">{selectedOrder.address}</span></div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Résumé de la Commande</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <div className="font-medium text-primary pb-2 border-b">{selectedOrder.productName}</div>
                    <div className="flex justify-between pt-2"><span>Prix :</span> <span>{selectedOrder.productPrice?.toLocaleString()} DA</span></div>
                    <div className="flex justify-between"><span>Quantité :</span> <span>x{selectedOrder.quantity}</span></div>
                    <div className="flex justify-between"><span>Livraison :</span> <span>{selectedOrder.deliveryPrice.toLocaleString()} DA</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 text-primary"><span>Total :</span> <span>{selectedOrder.totalPrice.toLocaleString()} DA</span></div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">Notes Admin</h3>
                  <Textarea 
                    placeholder="Ajouter des notes internes ici..." 
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
                    Enregistrer les Notes
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
