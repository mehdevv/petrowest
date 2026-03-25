import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListProducts, useToggleProductStock, useDeleteProduct } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, PlusCircle, Pencil, Trash2, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { useTranslation } from "react-i18next";

export default function Products() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: productsData } = useListProducts({ search: search || undefined, limit: 100 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleMutation = useToggleProductStock({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: t("admin.products.toastStock") });
      },
    },
  });

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: t("admin.products.toastDeleted") });
        setDeleteId(null);
      },
    },
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{t("admin.products.title")}</h1>
          <p className="text-muted-foreground">{t("admin.products.subtitle")}</p>
        </div>
        <Button asChild variant="secondary" className="hover-elevate">
          <Link href="/admin/products/new">
            <PlusCircle className="w-4 h-4 me-2" /> {t("admin.products.addNew")}
          </Link>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-6 flex gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.products.searchPh")} className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16">{t("admin.products.colImage")}</TableHead>
                <TableHead>{t("admin.products.colName")}</TableHead>
                <TableHead>{t("admin.products.colBrand")}</TableHead>
                <TableHead>{t("admin.products.colCategory")}</TableHead>
                <TableHead>{t("admin.products.colPrice")}</TableHead>
                <TableHead className="text-center">{t("admin.products.colStock")}</TableHead>
                <TableHead className="text-center w-[4.5rem]">{t("admin.products.colFeatured")}</TableHead>
                <TableHead className="text-end">{t("admin.products.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData?.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded bg-gray-100 p-1">
                      <img
                        src={
                          product.images?.[0] ||
                          "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=100&h=100&fit=crop"
                        }
                        className="w-full h-full object-contain mix-blend-multiply"
                        alt=""
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{product.name}</TableCell>
                  <TableCell>{product.brandName}</TableCell>
                  <TableCell>{product.categoryName || "-"}</TableCell>
                  <TableCell className="font-bold">{product.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.inStock}
                      onCheckedChange={(c) => toggleMutation.mutate({ id: product.id, data: { inStock: c } })}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    {product.featured ? (
                      <span
                        className="inline-flex justify-center"
                        title={t("admin.products.featuredOnHomeTooltip")}
                      >
                        <Star
                          className="h-4 w-4 shrink-0 fill-secondary text-secondary"
                          aria-label={t("admin.products.featuredOnHomeTooltip")}
                        />
                      </span>
                    ) : (
                      <span className="inline-block w-4 h-4" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="hover:text-primary">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {productsData?.products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t("admin.products.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.products.dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.products.dialogBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.products.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {t("admin.products.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
