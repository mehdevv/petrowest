import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListBrands, useCreateBrand, useUpdateBrand, useDeleteBrand,
  useListOilTypes, useCreateOilType, useUpdateOilType, useDeleteOilType,
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useListProductVolumes, useCreateProductVolume, useUpdateProductVolume, useDeleteProductVolume,
  useListViscosityGrades, useCreateViscosityGrade, useUpdateViscosityGrade, useDeleteViscosityGrade,
  useListCatalogueSpecDefaults,
  useCreateCatalogueSpecDefault,
  useUpdateCatalogueSpecDefault,
  useDeleteCatalogueSpecDefault,
} from "@workspace/api-client-react";
import type { CatalogueSpecType } from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpecRichInput } from "@/components/admin/SpecRichInput";
import { SpecRichTextSegments } from "@/components/admin/SpecRichTextSegments";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check, Tag, Droplets, FolderOpen, Package, Gauge, ListChecks } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type TabType = "brands" | "oilTypes" | "categories" | "volumes" | "viscosity" | "specDefaults";

export default function Catalogue() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("brands");

  const TABS = useMemo(
    () => [
      { id: "brands" as TabType, label: t("admin.catalogue.tabBrands"), icon: Tag },
      { id: "oilTypes" as TabType, label: t("admin.catalogue.tabOilTypes"), icon: Droplets },
      { id: "categories" as TabType, label: t("admin.catalogue.tabCategories"), icon: FolderOpen },
      { id: "volumes" as TabType, label: t("admin.catalogue.tabVolumes"), icon: Package },
      { id: "viscosity" as TabType, label: t("admin.catalogue.tabViscosity"), icon: Gauge },
      { id: "specDefaults" as TabType, label: t("admin.catalogue.tabSpecDefaults"), icon: ListChecks },
    ],
    [t]
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">{t("admin.catalogue.title")}</h1>
        <p className="text-muted-foreground">{t("admin.catalogue.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === id
                ? "bg-primary text-white shadow-md"
                : "bg-white text-muted-foreground border hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "brands" && <BrandsTab />}
      {activeTab === "oilTypes" && <OilTypesTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "volumes" && <ProductVolumesTab />}
      {activeTab === "viscosity" && <ViscosityGradesTab />}
      {activeTab === "specDefaults" && <SpecDefaultsTab />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  BRANDS TAB
// ═══════════════════════════════════════════════════════════

function BrandsTab() {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: brands, isLoading } = useListBrands();

  const createMut = useCreateBrand({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
        setNewName("");
        toast({ title: t("admin.catalogue.toastBrandAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastBrandErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateBrand({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastBrandUpd") });
      },
    },
  });

  const deleteMut = useDeleteBrand({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
        toast({ title: t("admin.catalogue.toastBrandDel") });
      },
      onError: () => toast({ title: t("admin.catalogueBrands.toastDelErr"), variant: "destructive" }),
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ data: { name: newName.trim() } });
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id, data: { name: editName.trim() } });
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">{t("admin.catalogueBrands.addLabel")}</label>
          <Input placeholder={t("admin.catalogueBrands.placeholder")} value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 me-2" /> {t("admin.catalogue.add")}
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !brands?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogueBrands.empty")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.catalogueBrands.colBrandName")}</TableHead>
                <TableHead className="text-center w-32">{t("admin.catalogue.products")}</TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    {editingId === brand.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(brand.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className="font-medium">{brand.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{brand.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === brand.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(brand.id)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(brand.id); setEditName(brand.name); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: brand.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OIL TYPES TAB
// ═══════════════════════════════════════════════════════════

function OilTypesTab() {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: oilTypes, isLoading } = useListOilTypes();

  const createMut = useCreateOilType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/oil-types"] });
        setNewName("");
        toast({ title: t("admin.catalogue.toastOilAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastOilErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateOilType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/oil-types"] });
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastOilUpd") });
      },
    },
  });

  const deleteMut = useDeleteOilType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/oil-types"] });
        toast({ title: t("admin.catalogue.toastOilDel") });
      },
      onError: () => toast({ title: t("admin.catalogueOil.toastDelErr"), variant: "destructive" }),
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ data: { name: newName.trim() } });
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id, data: { name: editName.trim() } });
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">{t("admin.catalogueOil.addLabel")}</label>
          <Input placeholder={t("admin.catalogueOil.placeholder")} value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 me-2" /> {t("admin.catalogue.add")}
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !oilTypes?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogueOil.empty")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.catalogueOil.colTypeName")}</TableHead>
                <TableHead className="text-center w-32">{t("admin.catalogue.products")}</TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oilTypes.map((oilType) => (
                <TableRow key={oilType.id}>
                  <TableCell>
                    {editingId === oilType.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(oilType.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className="font-medium">{oilType.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{oilType.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === oilType.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(oilType.id)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(oilType.id); setEditName(oilType.name); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: oilType.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PACK VOLUMES TAB
// ═══════════════════════════════════════════════════════════

function ProductVolumesTab() {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListProductVolumes();

  const createMut = useCreateProductVolume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/product-volumes"] });
        setNewName("");
        toast({ title: t("admin.catalogue.toastVolAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastVolErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateProductVolume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/product-volumes"] });
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastVolUpd") });
      },
    },
  });

  const deleteMut = useDeleteProductVolume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/product-volumes"] });
        toast({ title: t("admin.catalogue.toastVolDel") });
      },
      onError: () => toast({ title: t("admin.catalogueVolumes.toastDelErr"), variant: "destructive" }),
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ data: { name: newName.trim() } });
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id, data: { name: editName.trim() } });
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">{t("admin.catalogueVolumes.addLabel")}</label>
          <Input placeholder={t("admin.catalogueVolumes.placeholder")} value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 me-2" /> {t("admin.catalogue.add")}
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !rows?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogueVolumes.empty")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.catalogueVolumes.colName")}</TableHead>
                <TableHead className="text-center w-32">{t("admin.catalogue.products")}</TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className="font-medium">{row.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{row.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === row.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(row.id)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(row.id); setEditName(row.name); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: row.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISCOSITY GRADES TAB
// ═══════════════════════════════════════════════════════════

function ViscosityGradesTab() {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListViscosityGrades();

  const createMut = useCreateViscosityGrade({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/viscosity-grades"] });
        setNewName("");
        toast({ title: t("admin.catalogue.toastVisAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastVisErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateViscosityGrade({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/viscosity-grades"] });
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastVisUpd") });
      },
    },
  });

  const deleteMut = useDeleteViscosityGrade({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/viscosity-grades"] });
        toast({ title: t("admin.catalogue.toastVisDel") });
      },
      onError: () => toast({ title: t("admin.catalogueViscosity.toastDelErr"), variant: "destructive" }),
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ data: { name: newName.trim() } });
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id, data: { name: editName.trim() } });
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">{t("admin.catalogueViscosity.addLabel")}</label>
          <Input placeholder={t("admin.catalogueViscosity.placeholder")} value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 me-2" /> {t("admin.catalogue.add")}
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !rows?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogueViscosity.empty")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.catalogueViscosity.colName")}</TableHead>
                <TableHead className="text-center w-32">{t("admin.catalogue.products")}</TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className="font-medium">{row.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{row.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === row.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(row.id)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(row.id); setEditName(row.name); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: row.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CATEGORIES TAB
// ═══════════════════════════════════════════════════════════

function CategoriesTab() {
  const { t } = useTranslation();
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useListCategories();

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setNewCatName("");
        toast({ title: t("admin.catalogue.toastCatAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastCatErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastCatUpd") });
      },
    },
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: t("admin.catalogue.toastCatDel") });
      },
      onError: () => toast({ title: t("admin.categories.toastDeleteErr"), variant: "destructive" }),
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMut.mutate({ data: { name: newCatName.trim() } });
  };

  const saveEdit = (cat: any) => {
    if (!editName.trim()) return;
    updateMut.mutate({ id: cat.id, data: { name: editName.trim() } });
  };

  return (
    <div className="max-w-4xl">
      {/* Add Form */}
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8">
        <label className="text-sm font-bold text-primary mb-4 block uppercase tracking-wider">{t("admin.categories.addNewSection")}</label>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder={t("admin.catalogue.newCatPh")} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="h-12" />
          </div>

          <Button type="submit" className="h-12 px-6 hover-elevate flex-shrink-0" disabled={createMut.isPending || !newCatName.trim()}>
            <Plus className="w-4 h-4 me-2" /> {t("admin.catalogue.add")}
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !categories?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogue.noCategories")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t("admin.categories.colName")}</TableHead>
                <TableHead className="text-center w-32">{t("admin.catalogue.products")}</TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className="font-medium">{cat.name}</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="secondary">{cat.productCount}</Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    {editingId === cat.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(cat)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteMut.mutate({ id: cat.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SPEC DEFAULTS (specifications + homologations)
// ═══════════════════════════════════════════════════════════

function SpecDefaultsTab() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<CatalogueSpecType>("api_acea");
  const [newName, setNewName] = useState("");
  const [newSpec, setNewSpec] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpec, setEditSpec] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListCatalogueSpecDefaults(kind);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/catalogue/spec-defaults"] });

  const createMut = useCreateCatalogueSpecDefault({
    mutation: {
      onSuccess: () => {
        invalidate();
        setNewName("");
        setNewSpec("");
        toast({ title: t("admin.catalogue.toastSpecDefAdd") });
      },
      onError: () => toast({ title: t("admin.catalogue.toastSpecDefErr"), variant: "destructive" }),
    },
  });

  const updateMut = useUpdateCatalogueSpecDefault({
    mutation: {
      onSuccess: () => {
        invalidate();
        setEditingId(null);
        toast({ title: t("admin.catalogue.toastSpecDefUpd") });
      },
    },
  });

  const deleteMut = useDeleteCatalogueSpecDefault({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: t("admin.catalogue.toastSpecDefDel") });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() && !newSpec.trim()) return;
    createMut.mutate({
      data: {
        specType: kind,
        name: newName.trim(),
        specification: newSpec.trim(),
        sortOrder: rows?.length ?? 0,
      },
    });
  };

  const saveEdit = (id: number) => {
    if (!editName.trim() && !editSpec.trim()) return;
    updateMut.mutate({
      id,
      data: { name: editName.trim(), specification: editSpec.trim() },
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-muted-foreground">{t("admin.catalogue.specDefaultsIntro")}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setKind("api_acea");
            setEditingId(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            kind === "api_acea" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          {t("admin.catalogue.specDefaultsKindSpecifications")}
        </button>
        <button
          type="button"
          onClick={() => {
            setKind("homologation");
            setEditingId(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            kind === "homologation" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          {t("admin.catalogue.specDefaultsKindHomologation")}
        </button>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border">
        <label className="text-sm font-bold text-primary mb-4 block uppercase tracking-wider">
          {t("admin.catalogue.specDefaultsAddSection")}
        </label>
        <div className="flex flex-row flex-wrap items-end gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1 basis-[min(100%,18rem)]">
            <label className="text-xs text-muted-foreground mb-1 block">{t("admin.productForm.colSpecName")}</label>
            <SpecRichInput
              value={newName}
              onChange={setNewName}
              placeholder={t("admin.catalogue.specDefaultsNamePh")}
              inputClassName="min-h-11"
            />
          </div>
          <div className="min-w-0 flex-1 basis-[min(100%,18rem)]">
            <label className="text-xs text-muted-foreground mb-1 block">{t("admin.productForm.colSpecification")}</label>
            <SpecRichInput
              value={newSpec}
              onChange={setNewSpec}
              placeholder={t("admin.catalogue.specDefaultsSpecPh")}
              inputClassName="min-h-11"
            />
          </div>
          <div className="w-full sm:w-auto sm:shrink-0">
            <Button
              type="submit"
              className="h-11"
              disabled={createMut.isPending || (!newName.trim() && !newSpec.trim())}
            >
              <Plus className="w-4 h-4 me-2" />
              {t("admin.catalogue.add")}
            </Button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.common.loading")}</div>
        ) : !rows?.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("admin.catalogue.specDefaultsEmpty")}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="min-w-0">
                  <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 pe-2">
                    <span className="min-w-0 flex-1 basis-[min(100%,12rem)]">
                      {t("admin.productForm.colSpecName")}
                    </span>
                    <span className="min-w-0 flex-1 basis-[min(100%,12rem)]">
                      {t("admin.productForm.colSpecification")}
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-end w-28">{t("admin.catalogue.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:not(:first-child)_td]:border-t [&_tr:not(:first-child)_td]:border-border/25">
              {rows.map((row) => (
                <TableRow key={row.id} className="border-b-0">
                  <TableCell className="min-w-0 max-w-[min(100vw-4rem,56rem)] align-top">
                    {editingId === row.id ? (
                      <div className="flex flex-row flex-wrap items-start gap-x-3 gap-y-2 min-w-0">
                        <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
                          <SpecRichInput
                            value={editName}
                            onChange={setEditName}
                            inputClassName="min-h-9"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(row.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
                          <SpecRichInput
                            value={editSpec}
                            onChange={setEditSpec}
                            inputClassName="min-h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(row.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="min-w-0 break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                        {row.name ? (
                          <span className="font-medium">
                            <SpecRichTextSegments text={row.name} />
                          </span>
                        ) : null}
                        {row.name && row.specification ? (
                          <span className="ms-2 text-muted-foreground [overflow-wrap:anywhere]">
                            <SpecRichTextSegments text={row.specification} />
                          </span>
                        ) : row.specification ? (
                          <span className="font-medium text-primary">
                            <SpecRichTextSegments text={row.specification} />
                          </span>
                        ) : !row.name ? (
                          "—"
                        ) : null}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    {editingId === row.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(row.id)} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(row.id);
                            setEditName(row.name);
                            setEditSpec(row.specification);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteMut.mutate({ id: row.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
