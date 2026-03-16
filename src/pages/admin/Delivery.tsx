import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListDeliveryPrices, useSaveDeliveryPrices } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw } from "lucide-react";

export default function DeliveryPrices() {
  const { data: pricesData, isLoading } = useListDeliveryPrices();
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (pricesData) {
      const map: Record<string, number> = {};
      pricesData.forEach(p => { map[p.wilayaCode] = p.price; });
      setLocalPrices(map);
    }
  }, [pricesData]);

  const saveMut = useSaveDeliveryPrices({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/delivery-prices"] });
        toast({ title: "Prix de livraison enregistrés avec succès." });
      }
    }
  });

  const handleSaveAll = () => {
    const pricesArray = Object.entries(localPrices).map(([wilayaCode, price]) => ({
      wilayaCode,
      price: Number(price)
    }));
    saveMut.mutate({ data: { prices: pricesArray } });
  };

  const handleReset = () => {
    if(confirm("Réinitialiser toutes les wilayas à 500 DA ?")) {
      const resetMap: Record<string, number> = {};
      Object.keys(localPrices).forEach(k => resetMap[k] = 500);
      setLocalPrices(resetMap);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">Prix de Livraison</h1>
          <p className="text-muted-foreground">Définir les prix de livraison contre remboursement pour les 58 wilayas.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="hover-elevate">
            <RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser
          </Button>
          <Button variant="secondary" onClick={handleSaveAll} disabled={saveMut.isPending} className="hover-elevate">
            <Save className="w-4 h-4 mr-2" /> {saveMut.isPending ? "Enregistrement..." : "Enregistrer Tous les Prix"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden max-w-4xl shadow-sm">
        <Table>
          <TableHeader className="bg-[#001D3D] hover:bg-[#001D3D]">
            <TableRow>
              <TableHead className="text-white font-bold tracking-wider">Code</TableHead>
              <TableHead className="text-white font-bold tracking-wider">Nom de la Wilaya</TableHead>
              <TableHead className="text-right text-white font-bold tracking-wider">Prix (DA)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={3} className="text-center py-8">Chargement des wilayas...</TableCell></TableRow>}
            {pricesData?.map((item) => (
              <TableRow key={item.wilayaCode} className="hover:bg-gray-50">
                <TableCell className="font-bold text-muted-foreground">{item.wilayaCode}</TableCell>
                <TableCell className="font-medium text-base">{item.wilayaName}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Input 
                      type="number"
                      value={localPrices[item.wilayaCode] ?? item.price}
                      onChange={(e) => setLocalPrices({...localPrices, [item.wilayaCode]: Number(e.target.value)})}
                      className="w-32 text-right font-bold h-10 border-primary/20 focus-visible:ring-secondary"
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
