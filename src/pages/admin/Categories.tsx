import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Categories() {
  const { t } = useTranslation();
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setNewCatName("");
        toast({ title: t("admin.categories.toastAdded") });
      },
    },
  });

  const updateMut = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setEditingId(null);
        toast({ title: t("admin.categories.toastUpdated") });
      },
    },
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: t("admin.categories.toastDeleted") });
      },
      onError: () => {
        toast({ title: t("admin.categories.toastDeleteErr"), variant: "destructive" });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMut.mutate({ data: { name: newCatName.trim() } });
  };

  const saveEdit = (cat: { id: number }) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id: cat.id, data: { name: editName.trim() } });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">{t("admin.categories.title")}</h1>
        <p className="text-muted-foreground">{t("admin.categories.subtitle")}</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8">
          <label className="text-sm font-bold text-primary mb-4 block uppercase tracking-wider">{t("admin.categories.addNewSection")}</label>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("admin.categories.newNamePh")}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-12"
              />
            </div>

            <Button type="submit" className="h-12 w-32 hover-elevate" disabled={createMut.isPending || !newCatName.trim()}>
              <Plus className="w-4 h-4 me-2" /> {t("admin.categories.add")}
            </Button>
          </div>
        </form>

        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.categories.colName")}</TableHead>
                <TableHead className="text-center">{t("admin.categories.colProducts")}</TableHead>
                <TableHead className="text-center w-[120px]">{t("admin.categories.colHeroVehicle")}</TableHead>
                <TableHead className="text-center w-28">{t("admin.categories.colHeroOrder")}</TableHead>
                <TableHead className="text-end">{t("admin.categories.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(cat);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="font-medium text-base">{cat.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{cat.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={!!cat.heroActive}
                      onCheckedChange={(c) => updateMut.mutate({ id: cat.id, data: { heroActive: c } })}
                      disabled={editingId === cat.id || updateMut.isPending}
                      aria-label={t("admin.categories.colHeroVehicle")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      className="h-9 w-20 mx-auto text-center"
                      defaultValue={cat.heroSortOrder ?? 0}
                      key={`${cat.id}-hord-${cat.heroSortOrder ?? 0}`}
                      disabled={editingId === cat.id || updateMut.isPending}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== (cat.heroSortOrder ?? 0)) {
                          updateMut.mutate({ id: cat.id, data: { heroSortOrder: v } });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    {editingId === cat.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(cat)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: cat.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
