import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, X } from "lucide-react";
import { 
  useListVehicleCategories, useCreateVehicleCategory, useDeleteVehicleCategory,
  useListVehicleBrands, useCreateVehicleBrand, useDeleteVehicleBrand,
  useListVehicleModels, useCreateVehicleModel, useDeleteVehicleModel,
  useListProducts,
  useListModelTextEntries,
  useCreateModelTextEntry,
  useDeleteModelTextEntry,
  useGetTextEntryConfig,
  usePatchTextEntryCategory,
  getTextEntryConfigQueryKey,
  getListModelTextEntriesQueryKey,
  getListModelEngineYearsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getCarBrands, searchCarBrands, type CarBrandEntry } from "@/lib/car-logos";
import { useTranslation } from "react-i18next";

function brandLogoUrl(name: string, customUrl?: string | null) {
  if (customUrl) return customUrl;
  const CAR_LOGOS_BASE = "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos";
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${CAR_LOGOS_BASE}/thumb/${slug}.png`;
}

function BrandAutocomplete({
  onSelect,
  disabled,
}: {
  onSelect: (entry: CarBrandEntry) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [allBrands, setAllBrands] = useState<CarBrandEntry[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCarBrands().then(setAllBrands);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = query.length >= 1 ? searchCarBrands(query, allBrands, 8) : [];

  return (
    <div ref={ref} className="relative flex-1">
      <Input
        placeholder={t("admin.vehicle.brandPh")}
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query.length >= 1 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {suggestions.map((b) => (
            <button
              key={b.slug}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              onClick={() => {
                onSelect(b);
                setQuery("");
                setOpen(false);
              }}
            >
              <img
                src={b.thumb}
                alt={b.name}
                className="w-8 h-8 object-contain flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="font-medium text-sm">{b.name}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 1 && suggestions.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl p-3 text-sm text-muted-foreground text-center">
          {t("admin.vehicle.noBrandMatch", { query })}
        </div>
      )}
    </div>
  );
}

function TextEntryConfigurator({ entryId }: { entryId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetTextEntryConfig(entryId);
  const { data: allProducts } = useListProducts({ limit: 500 });
  const [pickProduct, setPickProduct] = useState<Record<number, string>>({});
  const patch = usePatchTextEntryCategory({
    mutation: {
      onSuccess: (_d, v) => {
        queryClient.invalidateQueries({ queryKey: getTextEntryConfigQueryKey(v.entryId) });
        queryClient.invalidateQueries({ queryKey: ["/api/vehicle/recommend"] });
      },
    },
  });

  if (isLoading || !config) {
    return <p className="text-sm text-muted-foreground py-2">{t("product.loading")}</p>;
  }

  const productsByCategory = (cid: number) =>
    allProducts?.products.filter((p) => p.categoryId === cid) ?? [];

  const commitProducts = (categoryId: number, productIds: number[]) => {
    patch.mutate({ entryId, categoryId, data: { productIds } });
  };

  return (
    <div className="space-y-4 mt-2">
      <p className="text-xs text-muted-foreground">{t("admin.vehiclePage.textEntryTypesHint")}</p>
      {config.categories.map((cat) => (
        <div key={cat.categoryId} className="rounded-lg border bg-gray-50/50 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">{cat.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{t("admin.vehiclePage.typeActive")}</span>
              <Switch
                checked={cat.isActive}
                onCheckedChange={(v) =>
                  patch.mutate({ entryId, categoryId: cat.categoryId, data: { isActive: v } })
                }
                disabled={patch.isPending}
                aria-label={t("admin.vehiclePage.typeActive")}
              />
            </div>
          </div>
          {cat.isActive && (
            <>
              <div className="flex flex-wrap gap-2">
                {cat.productIds.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">{t("admin.vehiclePage.noProductsInType")}</span>
                )}
                {cat.productIds.map((pid) => {
                  const p = allProducts?.products.find((x) => x.id === pid);
                  return (
                    <Badge key={pid} variant="secondary" className="gap-1 py-1.5 px-2 text-sm">
                      {p ? `${p.name} (${p.brandName})` : `#${pid}`}
                      <button
                        type="button"
                        className="hover:text-destructive"
                        onClick={() =>
                          commitProducts(
                            cat.categoryId,
                            cat.productIds.filter((x) => x !== pid),
                          )
                        }
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center max-w-xl">
                <Select
                  value={pickProduct[cat.categoryId] ?? ""}
                  onValueChange={(v) => setPickProduct((s) => ({ ...s, [cat.categoryId]: v }))}
                >
                  <SelectTrigger className="h-9 flex-1 bg-white">
                    <SelectValue placeholder={t("admin.vehiclePage.addProductPh")} />
                  </SelectTrigger>
                  <SelectContent>
                    {productsByCategory(cat.categoryId)
                      .filter((p) => !cat.productIds.includes(p.id))
                      .map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} ({p.brandName})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!pickProduct[cat.categoryId] || patch.isPending}
                  onClick={() => {
                    const v = pickProduct[cat.categoryId];
                    if (!v) return;
                    commitProducts(cat.categoryId, [...cat.productIds, Number(v)]);
                    setPickProduct((s) => ({ ...s, [cat.categoryId]: "" }));
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function VehicleFilter() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ── Categories ──
  const [catName, setCatName] = useState("");
  const { data: categories } = useListVehicleCategories();
  const createCat = useCreateVehicleCategory({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/categories"] }); setCatName(""); } } });
  const deleteCat = useDeleteVehicleCategory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/categories"] }) } });

  // ── Brands ──
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const { data: brands } = useListVehicleBrands({ vehicleCategoryId: Number(selectedCatId) }, { query: { enabled: !!selectedCatId }});
  const createBrand = useCreateVehicleBrand({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/brands"] }); } } });
  const deleteBrand = useDeleteVehicleBrand({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/brands"] }) } });

  const handleBrandSelect = (entry: CarBrandEntry) => {
    if (!selectedCatId) return;
    createBrand.mutate({
      data: {
        name: entry.name,
        vehicleCategoryId: Number(selectedCatId),
        logoUrl: entry.thumb,
      },
    });
  };

  // ── Models ──
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [modelName, setModelName] = useState("");
  const { data: models } = useListVehicleModels({ vehicleBrandId: Number(selectedBrandId) }, { query: { enabled: !!selectedBrandId }});
  const createModel = useCreateVehicleModel({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/models"] }); setModelName(""); } } });
  const deleteModel = useDeleteVehicleModel({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/models"] }) } });

  // ── Model (tabs 3 & 4) + free-text engine/year entries ──
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [draftEngine, setDraftEngine] = useState("");
  const [draftYear, setDraftYear] = useState("");

  const modelIdNum = selectedModelId ? Number(selectedModelId) : 0;
  const textListParams = { vehicleModelId: modelIdNum };
  const { data: textEntries } = useListModelTextEntries(textListParams, {
    query: { enabled: modelIdNum > 0 },
  });

  const invalidateModelTextQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListModelTextEntriesQueryKey(textListParams) });
    queryClient.invalidateQueries({ queryKey: getListModelEngineYearsQueryKey(textListParams) });
  };

  const createTextEntry = useCreateModelTextEntry({
    mutation: {
      onSuccess: () => {
        invalidateModelTextQueries();
        setDraftEngine("");
        setDraftYear("");
      },
    },
  });

  const deleteTextEntry = useDeleteModelTextEntry({
    mutation: {
      onSuccess: () => {
        invalidateModelTextQueries();
      },
    },
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">{t("admin.vehiclePage.title")}</h1>
        <p className="text-muted-foreground">{t("admin.vehiclePage.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border p-2 sm:p-6">
        <Tabs defaultValue="categories">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-gray-100 p-1 rounded-lg mb-8 gap-1">
            <TabsTrigger value="categories" className="font-bold data-[state=active]:bg-white text-[11px] sm:text-sm leading-tight whitespace-normal py-2 px-2 min-h-12">{t("admin.vehiclePage.tab1")}</TabsTrigger>
            <TabsTrigger value="brands" className="font-bold data-[state=active]:bg-white text-[11px] sm:text-sm leading-tight whitespace-normal py-2 px-2 min-h-12">{t("admin.vehiclePage.tab2")}</TabsTrigger>
            <TabsTrigger value="models" className="font-bold data-[state=active]:bg-white text-[11px] sm:text-sm leading-tight whitespace-normal py-2 px-2 min-h-12">{t("admin.vehiclePage.tab3")}</TabsTrigger>
            <TabsTrigger value="engine-years" className="font-bold data-[state=active]:bg-white text-[11px] sm:text-sm leading-tight whitespace-normal py-2 px-2 min-h-12">{t("admin.vehiclePage.tab4")}</TabsTrigger>
          </TabsList>

          {/* TAB 1 — Categories */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex gap-4 max-w-xl">
              <Input placeholder={t("admin.vehiclePage.newCatPh")} value={catName} onChange={e => setCatName(e.target.value)} />
              <Button onClick={() => createCat.mutate({ data: { name: catName }})} disabled={!catName || createCat.isPending}>{t("admin.vehicle.add")}</Button>
            </div>
            <Table className="max-w-2xl border rounded-lg">
              <TableHeader className="bg-gray-50"><TableRow><TableHead>Nom de la Catégorie</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
              <TableBody>
                {categories?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => deleteCat.mutate({ id: c.id })} className="text-destructive"><Trash2 className="w-4 h-4"/></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* TAB 2 — Brands with logos */}
          <TabsContent value="brands" className="space-y-6">
            <div className="max-w-xl bg-gray-50 p-4 rounded-lg border mb-6">
              <label className="text-sm font-bold block mb-2 text-primary uppercase">{t("admin.vehiclePage.parentCat")}</label>
              <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedCatId && (
              <>
                <div className="max-w-2xl">
                  <label className="text-sm font-bold block mb-1 text-primary">{t("admin.vehiclePage.addBrandHint")}</label>
                  <BrandAutocomplete
                    onSelect={handleBrandSelect}
                    disabled={createBrand.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{t("admin.vehiclePage.brandAutoHint")}</p>
                </div>
                <Table className="max-w-3xl border rounded-lg">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16">{t("admin.vehiclePage.colLogo")}</TableHead>
                      <TableHead>{t("admin.vehiclePage.colBrandName")}</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands?.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-md bg-gray-50 border flex items-center justify-center overflow-hidden">
                            <img
                              src={brandLogoUrl(b.name, b.logoUrl)}
                              alt={b.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteBrand.mutate({ id: b.id })} className="text-destructive">
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>

          {/* TAB 3 — Models */}
          <TabsContent value="models" className="space-y-6">
            <div className="max-w-xl bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">{t("admin.vehiclePage.step1Cat")}</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">{t("admin.vehiclePage.step2Brand")}</label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                  <SelectContent>
                    {brands?.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <span className="flex items-center gap-2">
                          <img src={brandLogoUrl(b.name, b.logoUrl)} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          {b.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedBrandId && (
              <>
                <div className="flex gap-4 max-w-xl">
                  <Input placeholder={t("admin.vehiclePage.newModelSimple")} value={modelName} onChange={e => setModelName(e.target.value)} />
                  <Button onClick={() => createModel.mutate({ data: { name: modelName, vehicleBrandId: Number(selectedBrandId) }})} disabled={!modelName}>{t("admin.vehicle.add")}</Button>
                </div>
                <Table className="max-w-2xl border rounded-lg">
                  <TableHeader className="bg-gray-50"><TableRow><TableHead>{t("admin.vehiclePage.colModelName")}</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {models?.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteModel.mutate({ id: m.id })} className="text-destructive"><Trash2 className="w-4 h-4"/></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>

          {/* TAB 4 — Type et année de moteur (texte libre + types + produits) */}
          <TabsContent value="engine-years" className="space-y-6">
            <p className="text-sm text-muted-foreground max-w-3xl">{t("admin.vehiclePage.tab4Intro")}</p>
            <div className="bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">{t("admin.vehiclePage.step1Cat")}</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); setSelectedModelId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">{t("admin.vehiclePage.step2Brand")}</label>
                <Select value={selectedBrandId} onValueChange={(v) => { setSelectedBrandId(v); setSelectedModelId(""); }} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                  <SelectContent>
                    {brands?.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <span className="flex items-center gap-2">
                          <img src={brandLogoUrl(b.name, b.logoUrl)} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          {b.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">{t("admin.vehiclePage.step3Model")}</label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={!selectedBrandId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder={t("admin.vehiclePage.choosePh")} /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selectedModelId && (
              <>
                <div className="rounded-lg border bg-white p-4 space-y-4 max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{t("admin.vehiclePage.textEntryStepTitle")}</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-sm font-bold block mb-1 text-primary">{t("admin.vehiclePage.engineTextLabel")}</label>
                      <Input
                        placeholder={t("admin.vehiclePage.versionPh")}
                        value={draftEngine}
                        onChange={(e) => setDraftEngine(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-sm font-bold block mb-1 text-primary">{t("admin.vehiclePage.yearTextLabel")}</label>
                      <Input
                        placeholder={t("admin.vehiclePage.yearPh")}
                        value={draftYear}
                        onChange={(e) => setDraftYear(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        createTextEntry.mutate({
                          data: {
                            vehicleModelId: modelIdNum,
                            engineLabel: draftEngine.trim(),
                            yearLabel: draftYear.trim(),
                          },
                        })
                      }
                      disabled={
                        !draftEngine.trim() ||
                        !draftYear.trim() ||
                        createTextEntry.isPending
                      }
                    >
                      {t("admin.vehiclePage.saveTextEntryBtn")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    {t("admin.vehiclePage.textEntryListTitle")}
                  </h3>
                  {!textEntries?.length && (
                    <p className="text-sm text-muted-foreground">{t("admin.vehiclePage.noTextEntries")}</p>
                  )}
                  {textEntries?.map((e) => (
                    <div key={e.id} className="rounded-xl border border-primary/15 shadow-sm overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#001D3D] text-white px-4 py-3">
                        <span className="font-display text-lg font-bold tracking-tight">{e.label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-white hover:text-destructive hover:bg-white/10"
                          onClick={() => deleteTextEntry.mutate({ id: e.id })}
                          aria-label={t("admin.common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50/30">
                        <TextEntryConfigurator entryId={e.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
