import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListOrders, useUpdateOrder, useDeleteOrder } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Search, Eye, Download, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { getDateFnsLocale } from "@/lib/date-locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;

export default function Orders() {
  const { t, i18n } = useTranslation();
  const dfns = useMemo(() => getDateFnsLocale(i18n.language), [i18n.language]);
  const statusLabel = (s: string) => t(`admin.status.${s}` as const);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deleteOrderOpen, setDeleteOrderOpen] = useState(false);

  const { data: ordersData } = useListOrders({
    search: search || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    limit: 100,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/stats"] });
        toast({ title: t("admin.orders.toastUpdated") });
        setSelectedOrder(null);
      },
    },
  });

  const deleteMutation = useDeleteOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/stats"] });
        toast({ title: t("admin.orders.toastOrderDeleted") });
        setDeleteOrderOpen(false);
        setSelectedOrder(null);
      },
      onError: () => {
        toast({ title: t("admin.orders.toastDeleteErr"), variant: "destructive" });
      },
    },
  });

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      id: selectedOrder.id,
      data: { status: newStatus, notes: selectedOrder.notes },
    });
  };

  const exportToExcel = () => {
    const orders = ordersData?.orders;
    if (!orders || orders.length === 0) {
      toast({ title: t("admin.orders.toastNoExport"), variant: "destructive" });
      return;
    }

    const rows = orders.map((o) => ({
      [t("admin.orders.excelColId")]: o.id,
      [t("admin.orders.excelColDate")]: format(new Date(o.createdAt), "dd/MM/yyyy HH:mm"),
      [t("admin.orders.excelColClient")]: o.customerName,
      [t("admin.orders.excelColPhone")]: o.phone,
      [t("admin.orders.excelColProduct")]: o.productName || "",
      [t("admin.orders.excelColQty")]: o.quantity,
      [t("admin.orders.excelWilaya")]: o.wilayaName,
      [t("admin.orders.excelDelivery")]:
        o.deliveryType === "domicile" ? t("admin.orders.excelDomicile") : t("admin.orders.excelStopDesk"),
      [t("admin.orders.excelColDeliveryFee")]: o.deliveryPrice,
      [t("admin.orders.excelColTotal")]: o.totalPrice,
      [t("admin.orders.excelColStatus")]: statusLabel(o.status) || o.status,
      [t("admin.orders.excelColAddress")]: o.address || "",
      [t("admin.orders.excelColNotes")]: o.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
      { wch: 6 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 8 },
      { wch: 16 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("admin.orders.excelSheet"));

    const filterLabel = statusFilter !== "All" ? `_${statusLabel(statusFilter) || statusFilter}` : "";
    const dateStr = format(new Date(), "yyyy-MM-dd");
    XLSX.writeFile(wb, `${t("admin.orders.excelFilePrefix")}${filterLabel}_${dateStr}.xlsx`);

    toast({ title: t("admin.orders.toastExported", { count: orders.length }) });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-500";
      case "confirmed":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">{t("admin.orders.title")}</h1>
        <p className="text-muted-foreground">{t("admin.orders.subtitle")}</p>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant={statusFilter === "All" ? "default" : "outline"} onClick={() => setStatusFilter("All")} className="rounded-full">
            {t("admin.orders.all")}
          </Button>
          {STATUSES.map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="rounded-full whitespace-nowrap">
              {statusLabel(s) || s}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("admin.orders.searchPh")} className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportToExcel} className="shrink-0 gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("admin.orders.export")}</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.orders.colId")}</TableHead>
                <TableHead>{t("admin.orders.colDate")}</TableHead>
                <TableHead>{t("admin.orders.colClient")}</TableHead>
                <TableHead>{t("admin.orders.colProduct")}</TableHead>
                <TableHead>{t("admin.orders.colQty")}</TableHead>
                <TableHead>{t("admin.orders.colWilaya")}</TableHead>
                <TableHead className="text-end">{t("admin.orders.colTotal")}</TableHead>
                <TableHead className="text-center">{t("admin.orders.colStatus")}</TableHead>
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
                  <TableCell className="max-w-[200px] truncate" title={order.productName || ""}>
                    {order.productName}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.wilayaName}</TableCell>
                  <TableCell className="text-end font-bold">{order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${getStatusColor(order.status)} text-white hover:${getStatusColor(order.status)}`}>
                      {statusLabel(order.status) || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6 border-b pb-4">
                <SheetTitle className="font-display text-2xl">{t("admin.orders.sheetTitle", { id: selectedOrder.id })}</SheetTitle>
                <div className="text-sm text-muted-foreground">{format(new Date(selectedOrder.createdAt), "PPP p", { locale: dfns })}</div>
              </SheetHeader>

              <div className="space-y-8">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">{t("admin.orders.updateStatus")}</label>
                  <Select value={selectedOrder.status} onValueChange={handleUpdateStatus} disabled={updateMutation.isPending}>
                    <SelectTrigger className="w-full h-12 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s) || s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">{t("admin.orders.customerDetails")}</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">{t("admin.orders.name")}</span>{" "}
                      <span className="col-span-2 font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">{t("admin.orders.phone")}</span>{" "}
                      <span className="col-span-2 font-medium">{selectedOrder.phone}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">{t("admin.orders.wilaya")}</span>{" "}
                      <span className="col-span-2 font-medium">{selectedOrder.wilayaName}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">{t("admin.orders.address")}</span>{" "}
                      <span className="col-span-2 font-medium">{selectedOrder.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">{t("admin.orders.orderSummary")}</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <div className="font-medium text-primary pb-2 border-b">{selectedOrder.productName}</div>
                    <div className="flex justify-between pt-2">
                      <span>{t("admin.orders.price")}</span> <span>{selectedOrder.productPrice?.toLocaleString()} DA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("admin.orders.quantity")}</span> <span>x{selectedOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("admin.orders.delivery")}</span> <span>{selectedOrder.deliveryPrice.toLocaleString()} DA</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 text-primary">
                      <span>{t("admin.orders.total")}</span> <span>{selectedOrder.totalPrice.toLocaleString()} DA</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-sm border-b pb-2">{t("admin.orders.adminNotes")}</h3>
                  <Textarea
                    placeholder={t("admin.orders.notesPh")}
                    value={selectedOrder.notes || ""}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, notes: e.target.value })}
                    className="mb-2"
                  />
                  <Button
                    onClick={() =>
                      updateMutation.mutate({ id: selectedOrder.id, data: { status: selectedOrder.status, notes: selectedOrder.notes } })
                    }
                    disabled={updateMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {t("admin.orders.saveNotes")}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteOrderOpen(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {t("admin.orders.deleteOrder")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOrderOpen} onOpenChange={setDeleteOrderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.orders.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.orders.deleteDialogBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t("admin.orders.deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !selectedOrder}
              onClick={() => selectedOrder && deleteMutation.mutate({ id: selectedOrder.id })}
            >
              {t("admin.orders.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
