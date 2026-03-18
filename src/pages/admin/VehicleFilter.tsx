import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";
import { 
  useListVehicleCategories, useCreateVehicleCategory, useDeleteVehicleCategory,
  useListVehicleBrands, useCreateVehicleBrand, useDeleteVehicleBrand,
  useListVehicleModels, useCreateVehicleModel, useDeleteVehicleModel,
  useListVehicleVersions, useCreateVehicleVersion, useDeleteVehicleVersion,
  useListVehicleYears, useCreateVehicleYear, useDeleteVehicleYear,
  useGetVehicleYearProducts, useSetVehicleYearProducts,
  useListProducts
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getCarBrands, searchCarBrands, type CarBrandEntry } from "@/lib/car-logos";

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
        placeholder="Taper le nom de la marque..."
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
          Aucune marque trouvée pour "{query}"
        </div>
      )}
    </div>
  );
}

function MultiProductSelect({ yearId }: { yearId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: currentProducts } = useGetVehicleYearProducts(yearId, { query: { enabled: !!yearId } });
  const { data: allProducts } = useListProducts({ limit: 500 });
  const setProducts = useSetVehicleYearProducts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/vehicle/years/${yearId}/products`] });
        toast({ title: "Produits mis à jour." });
      },
    },
  });

  const selectedIds = (currentProducts || []).map((p) => p.productId);
  const [addingId, setAddingId] = useState<string>("");

  const handleAdd = () => {
    if (!addingId) return;
    const newIds = [...selectedIds, Number(addingId)];
    setProducts.mutate({ yearId, data: { productIds: newIds } });
    setAddingId("");
  };

  const handleRemove = (pid: number) => {
    const newIds = selectedIds.filter((id) => id !== pid);
    setProducts.mutate({ yearId, data: { productIds: newIds } });
  };

  const availableProducts = allProducts?.products.filter((p) => !selectedIds.includes(p.id)) || [];

  return (
    <div className="space-y-2">
      {/* Current selections */}
      <div className="flex flex-wrap gap-2">
        {(currentProducts || []).map((cp) => (
          <Badge key={cp.id} variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
            {cp.productName} ({cp.productBrandName})
            <button onClick={() => handleRemove(cp.productId)} className="ml-1 hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </Badge>
        ))}
        {selectedIds.length === 0 && (
          <span className="text-sm text-muted-foreground italic">Aucun produit assigné</span>
        )}
      </div>
      {/* Add product */}
      <div className="flex gap-2 items-center">
        <Select value={addingId} onValueChange={setAddingId}>
          <SelectTrigger className="flex-1 h-9 text-sm border-primary/20">
            <SelectValue placeholder="Ajouter un produit..." />
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name} ({p.brandName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!addingId || setProducts.isPending}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function VehicleFilter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // ── Versions ──
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [versionName, setVersionName] = useState("");
  const { data: versions } = useListVehicleVersions({ vehicleModelId: Number(selectedModelId) }, { query: { enabled: !!selectedModelId }});
  const createVersion = useCreateVehicleVersion({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/versions"] }); setVersionName(""); } } });
  const deleteVersion = useDeleteVehicleVersion({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/versions"] }) } });

  // ── Years ──
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [yearMode, setYearMode] = useState<"single" | "range">("single");
  const [yearValue, setYearValue] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const { data: years } = useListVehicleYears({ vehicleVersionId: Number(selectedVersionId) }, { query: { enabled: !!selectedVersionId }});
  const createYear = useCreateVehicleYear({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/years"] }); } } });
  const deleteYear = useDeleteVehicleYear({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/years"] }) } });
  const [rangeAdding, setRangeAdding] = useState(false);

  const handleAddSingleYear = () => {
    if (!yearValue || !selectedVersionId) return;
    createYear.mutate({ data: { year: Number(yearValue), vehicleVersionId: Number(selectedVersionId) } });
    setYearValue("");
  };

  const handleAddRange = async () => {
    const from = Number(yearFrom);
    const to = Number(yearTo);
    if (!from || !to || from > to || !selectedVersionId) return;
    setRangeAdding(true);
    const existingYears = new Set((years || []).map(y => y.year));
    for (let y = from; y <= to; y++) {
      if (!existingYears.has(y)) {
        await createYear.mutateAsync({ data: { year: y, vehicleVersionId: Number(selectedVersionId) } });
      }
    }
    setRangeAdding(false);
    setYearFrom("");
    setYearTo("");
    queryClient.invalidateQueries({ queryKey: ["/api/vehicle/years"] });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">Logique du Filtre Véhicule</h1>
        <p className="text-muted-foreground">Gérer la hiérarchie : Catégorie → Marque → Modèle → Moteur → Année → Huiles Recommandées</p>
      </div>

      <div className="bg-white rounded-xl border p-2 sm:p-6">
        <Tabs defaultValue="categories">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-gray-100 p-1 rounded-lg mb-8">
            <TabsTrigger value="categories" className="font-bold data-[state=active]:bg-white text-xs sm:text-sm">1. Catégories</TabsTrigger>
            <TabsTrigger value="brands" className="font-bold data-[state=active]:bg-white text-xs sm:text-sm">2. Marques</TabsTrigger>
            <TabsTrigger value="models" className="font-bold data-[state=active]:bg-white text-xs sm:text-sm">3. Modèles</TabsTrigger>
            <TabsTrigger value="versions" className="font-bold data-[state=active]:bg-white text-xs sm:text-sm">4. Moteurs</TabsTrigger>
            <TabsTrigger value="years" className="font-bold data-[state=active]:bg-white text-xs sm:text-sm">5. Années & Huiles</TabsTrigger>
          </TabsList>

          {/* TAB 1 — Categories */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex gap-4 max-w-xl">
              <Input placeholder="Nouvelle Catégorie (ex : Voitures)" value={catName} onChange={e => setCatName(e.target.value)} />
              <Button onClick={() => createCat.mutate({ data: { name: catName }})} disabled={!catName || createCat.isPending}>Ajouter</Button>
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
              <label className="text-sm font-bold block mb-2 text-primary uppercase">Sélectionner la Catégorie Parent</label>
              <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedCatId && (
              <>
                <div className="max-w-2xl">
                  <label className="text-sm font-bold block mb-1 text-primary">Ajouter une Marque (taper pour chercher)</label>
                  <BrandAutocomplete
                    onSelect={handleBrandSelect}
                    disabled={createBrand.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Tapez le nom — les suggestions apparaissent automatiquement avec le logo correct.</p>
                </div>
                <Table className="max-w-3xl border rounded-lg">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16">Logo</TableHead>
                      <TableHead>Nom de la Marque</TableHead>
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
                <label className="text-sm font-bold block mb-2 text-primary">1. Catégorie</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">2. Marque</label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
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
                  <Input placeholder="Nouveau Modèle (ex : 208)" value={modelName} onChange={e => setModelName(e.target.value)} />
                  <Button onClick={() => createModel.mutate({ data: { name: modelName, vehicleBrandId: Number(selectedBrandId) }})} disabled={!modelName}>Ajouter</Button>
                </div>
                <Table className="max-w-2xl border rounded-lg">
                  <TableHeader className="bg-gray-50"><TableRow><TableHead>Nom du Modèle</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
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

          {/* TAB 4 — Versions (engines) */}
          <TabsContent value="versions" className="space-y-6">
            <div className="max-w-3xl bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">1. Catégorie</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); setSelectedModelId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">2. Marque</label>
                <Select value={selectedBrandId} onValueChange={(v) => { setSelectedBrandId(v); setSelectedModelId(""); }} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
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
                <label className="text-sm font-bold block mb-2 text-primary">3. Modèle</label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={!selectedBrandId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selectedModelId && (
              <>
                <div className="flex gap-4 mb-8">
                  <Input className="max-w-sm" placeholder="Nouveau Moteur (ex : 1.6 HDi)" value={versionName} onChange={e => setVersionName(e.target.value)} />
                  <Button onClick={() => createVersion.mutate({ data: { name: versionName, vehicleModelId: Number(selectedModelId) }})} disabled={!versionName}>Ajouter un Moteur</Button>
                </div>
                
                <Table className="border rounded-lg shadow-sm">
                  <TableHeader className="bg-[#001D3D] hover:bg-[#001D3D]">
                    <TableRow>
                      <TableHead className="text-white">Version / Moteur</TableHead>
                      <TableHead className="text-right text-white w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions?.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-bold">{v.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteVersion.mutate({ id: v.id })} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>

          {/* TAB 5 — Years & Oil Mapping (multi-product) */}
          <TabsContent value="years" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">1. Catégorie</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); setSelectedModelId(""); setSelectedVersionId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">2. Marque</label>
                <Select value={selectedBrandId} onValueChange={(v) => { setSelectedBrandId(v); setSelectedModelId(""); setSelectedVersionId(""); }} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
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
                <label className="text-sm font-bold block mb-2 text-primary">3. Modèle</label>
                <Select value={selectedModelId} onValueChange={(v) => { setSelectedModelId(v); setSelectedVersionId(""); }} disabled={!selectedBrandId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">4. Moteur</label>
                <Select value={selectedVersionId} onValueChange={setSelectedVersionId} disabled={!selectedModelId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{versions?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selectedVersionId && (
              <>
                <div className="mb-8 space-y-4">
                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={yearMode === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setYearMode("single")}
                    >
                      Année unique
                    </Button>
                    <Button
                      variant={yearMode === "range" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setYearMode("range")}
                    >
                      Intervalle d'années
                    </Button>
                  </div>

                  {yearMode === "single" ? (
                    <div className="flex gap-4 items-end">
                      <div>
                        <label className="text-sm font-bold block mb-1 text-primary">Année</label>
                        <Input
                          type="number"
                          className="w-40"
                          placeholder="Ex : 2022"
                          min={1990}
                          max={2030}
                          value={yearValue}
                          onChange={e => setYearValue(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddSingleYear} disabled={!yearValue || createYear.isPending}>
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-end">
                      <div>
                        <label className="text-sm font-bold block mb-1 text-primary">De</label>
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="2015"
                          min={1990}
                          max={2030}
                          value={yearFrom}
                          onChange={e => setYearFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold block mb-1 text-primary">À</label>
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="2024"
                          min={1990}
                          max={2030}
                          value={yearTo}
                          onChange={e => setYearTo(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAddRange}
                        disabled={!yearFrom || !yearTo || Number(yearFrom) > Number(yearTo) || rangeAdding}
                      >
                        {rangeAdding ? "Ajout en cours..." : `Ajouter ${yearFrom && yearTo && Number(yearTo) >= Number(yearFrom) ? Number(yearTo) - Number(yearFrom) + 1 : 0} années`}
                      </Button>
                    </div>
                  )}
                </div>
                
                <Table className="border rounded-lg shadow-sm">
                  <TableHeader className="bg-[#001D3D] hover:bg-[#001D3D]">
                    <TableRow>
                      <TableHead className="text-white w-28">Année</TableHead>
                      <TableHead className="text-white">Huiles Recommandées</TableHead>
                      <TableHead className="text-right text-white w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {years?.map(y => (
                      <TableRow key={y.id}>
                        <TableCell className="font-display text-2xl font-bold text-primary">{y.year}</TableCell>
                        <TableCell>
                          <MultiProductSelect yearId={y.id} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteYear.mutate({ id: y.id })} className="text-destructive">
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!years || years.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Aucune année ajoutée pour ce moteur.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
