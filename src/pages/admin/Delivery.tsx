import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListDeliveryPrices, useSaveDeliveryPrices } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DeliveryPrices() {
  const { t } = useTranslation();
  const { data: pricesData, isLoading } = useListDeliveryPrices();
  const [localDesk, setLocalDesk] = useState<Record<string, number>>({});
  const [localDomicile, setLocalDomicile] = useState<Record<string, number>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (pricesData) {
      const deskMap: Record<string, number> = {};
      const domMap: Record<string, number> = {};
      pricesData.forEach((p) => {
        deskMap[p.wilayaCode] = p.price;
        domMap[p.wilayaCode] = p.domicilePrice;
      });
      setLocalDesk(deskMap);
      setLocalDomicile(domMap);
    }
  }, [pricesData]);

  const saveMut = useSaveDeliveryPrices({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/delivery-prices"] });
        toast({ title: t("admin.delivery.toastOk") });
      },
      onError: () => {
        toast({ title: t("admin.delivery.toastErr"), variant: "destructive" });
      },
    },
  });

  const handleSaveAll = () => {
    const pricesArray = Object.keys(localDesk).map((wilayaCode) => ({
      wilayaCode,
      price: Number(localDesk[wilayaCode]),
      domicilePrice: Number(localDomicile[wilayaCode]),
    }));
    saveMut.mutate({ data: { prices: pricesArray } });
  };

  const handleReset = () => {
    if (confirm(t("admin.delivery.resetConfirm"))) {
      const deskMap: Record<string, number> = {};
      const domMap: Record<string, number> = {};
      Object.keys(localDesk).forEach((k) => {
        deskMap[k] = 500;
        domMap[k] = 800;
      });
      setLocalDesk(deskMap);
      setLocalDomicile(domMap);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{t("admin.delivery.title")}</h1>
          <p className="text-muted-foreground">{t("admin.delivery.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="hover-elevate">
            <RotateCcw className="w-4 h-4 me-2" /> {t("admin.delivery.reset")}
          </Button>
          <Button variant="secondary" onClick={handleSaveAll} disabled={saveMut.isPending} className="hover-elevate">
            <Save className="w-4 h-4 me-2" /> {saveMut.isPending ? t("admin.delivery.saving") : t("admin.delivery.saveAll")}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#001D3D] hover:bg-[#001D3D]">
            <TableRow>
              <TableHead className="text-white font-bold tracking-wider w-16">{t("admin.delivery.code")}</TableHead>
              <TableHead className="text-white font-bold tracking-wider">{t("admin.delivery.wilayaName")}</TableHead>
              <TableHead className="text-end text-white font-bold tracking-wider">
                <div className="flex flex-col items-end">
                  <span>{t("admin.delivery.stopDeskTitle")}</span>
                  <span className="text-xs text-white/60 font-normal">{t("admin.delivery.stopDeskSub")}</span>
                </div>
              </TableHead>
              <TableHead className="text-end text-white font-bold tracking-wider">
                <div className="flex flex-col items-end">
                  <span>{t("admin.delivery.domicileTitle")}</span>
                  <span className="text-xs text-white/60 font-normal">{t("admin.delivery.domicileSub")}</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t("admin.delivery.loading")}
                </TableCell>
              </TableRow>
            )}
            {pricesData?.map((item) => (
              <TableRow key={item.wilayaCode} className="hover:bg-gray-50">
                <TableCell className="font-bold text-muted-foreground">{item.wilayaCode}</TableCell>
                <TableCell className="font-medium text-base">{item.wilayaName}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end items-center gap-2">
                    <Input
                      type="number"
                      value={localDesk[item.wilayaCode] ?? item.price}
                      onChange={(e) => setLocalDesk({ ...localDesk, [item.wilayaCode]: Number(e.target.value) })}
                      className="w-28 text-end font-bold h-10 border-primary/20 focus-visible:ring-secondary"
                    />
                    <span className="text-sm font-medium text-muted-foreground w-6">DA</span>
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end items-center gap-2">
                    <Input
                      type="number"
                      value={localDomicile[item.wilayaCode] ?? item.domicilePrice}
                      onChange={(e) => setLocalDomicile({ ...localDomicile, [item.wilayaCode]: Number(e.target.value) })}
                      className="w-28 text-end font-bold h-10 border-orange-300/50 focus-visible:ring-orange-400"
                    />
                    <span className="text-sm font-medium text-muted-foreground w-6">DA</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
