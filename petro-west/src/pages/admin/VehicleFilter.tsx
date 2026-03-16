import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { 
  useListVehicleCategories, useCreateVehicleCategory, useDeleteVehicleCategory,
  useListVehicleBrands, useCreateVehicleBrand, useDeleteVehicleBrand,
  useListVehicleModels, useCreateVehicleModel, useDeleteVehicleModel,
  useListVehicleVersions, useCreateVehicleVersion, useDeleteVehicleVersion, useUpdateVehicleVersion,
  useListProducts
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function VehicleFilter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [catName, setCatName] = useState("");
  const { data: categories } = useListVehicleCategories();
  const createCat = useCreateVehicleCategory({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/categories"] }); setCatName(""); }});
  const deleteCat = useDeleteVehicleCategory({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/categories"] }) });

  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [brandName, setBrandName] = useState("");
  const { data: brands } = useListVehicleBrands({ vehicleCategoryId: Number(selectedCatId) }, { query: { enabled: !!selectedCatId }});
  const createBrand = useCreateVehicleBrand({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/brands"] }); setBrandName(""); }});
  const deleteBrand = useDeleteVehicleBrand({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/brands"] }) });

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [modelName, setModelName] = useState("");
  const { data: models } = useListVehicleModels({ vehicleBrandId: Number(selectedBrandId) }, { query: { enabled: !!selectedBrandId }});
  const createModel = useCreateVehicleModel({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/models"] }); setModelName(""); }});
  const deleteModel = useDeleteVehicleModel({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/models"] }) });

  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [versionName, setVersionName] = useState("");
  const { data: versions } = useListVehicleVersions({ vehicleModelId: Number(selectedModelId) }, { query: { enabled: !!selectedModelId }});
  const createVersion = useCreateVehicleVersion({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/versions"] }); setVersionName(""); }});
  const updateVersion = useUpdateVehicleVersion({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicle/versions"] }); toast({ title: "Mapping saved." }); }});
  const deleteVersion = useDeleteVehicleVersion({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vehicle/versions"] }) });

  const { data: products } = useListProducts({ limit: 500 });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">Vehicle Filter Logic</h1>
        <p className="text-muted-foreground">Manage the hierarchy: Category → Brand → Model → Version → Oil Mapping</p>
      </div>

      <div className="bg-white rounded-xl border p-2 sm:p-6">
        <Tabs defaultValue="categories">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-100 p-1 rounded-lg mb-8">
            <TabsTrigger value="categories" className="font-bold data-[state=active]:bg-white">1. Categories</TabsTrigger>
            <TabsTrigger value="brands" className="font-bold data-[state=active]:bg-white">2. Brands</TabsTrigger>
            <TabsTrigger value="models" className="font-bold data-[state=active]:bg-white">3. Models</TabsTrigger>
            <TabsTrigger value="versions" className="font-bold data-[state=active]:bg-white">4. Versions & Oil</TabsTrigger>
          </TabsList>

          {/* TAB 1 */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex gap-4 max-w-xl">
              <Input placeholder="New Category (e.g. Passenger Cars)" value={catName} onChange={e => setCatName(e.target.value)} />
              <Button onClick={() => createCat.mutate({ data: { name: catName }})} disabled={!catName || createCat.isPending}>Add</Button>
            </div>
            <Table className="max-w-2xl border rounded-lg">
              <TableHeader className="bg-gray-50"><TableRow><TableHead>Category Name</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
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

          {/* TAB 2 */}
          <TabsContent value="brands" className="space-y-6">
            <div className="max-w-xl bg-gray-50 p-4 rounded-lg border mb-6">
              <label className="text-sm font-bold block mb-2 text-primary uppercase">Select Parent Category</label>
              <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedCatId && (
              <>
                <div className="flex gap-4 max-w-xl">
                  <Input placeholder="New Brand (e.g. Peugeot)" value={brandName} onChange={e => setBrandName(e.target.value)} />
                  <Button onClick={() => createBrand.mutate({ data: { name: brandName, vehicleCategoryId: Number(selectedCatId) }})} disabled={!brandName}>Add</Button>
                </div>
                <Table className="max-w-2xl border rounded-lg">
                  <TableHeader className="bg-gray-50"><TableRow><TableHead>Brand Name</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {brands?.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBrand.mutate({ id: b.id })} className="text-destructive"><Trash2 className="w-4 h-4"/></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>

          {/* TAB 3 */}
          <TabsContent value="models" className="space-y-6">
            <div className="max-w-xl bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">1. Category</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">2. Brand</label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {selectedBrandId && (
              <>
                <div className="flex gap-4 max-w-xl">
                  <Input placeholder="New Model (e.g. 208)" value={modelName} onChange={e => setModelName(e.target.value)} />
                  <Button onClick={() => createModel.mutate({ data: { name: modelName, vehicleBrandId: Number(selectedBrandId) }})} disabled={!modelName}>Add</Button>
                </div>
                <Table className="max-w-2xl border rounded-lg">
                  <TableHeader className="bg-gray-50"><TableRow><TableHead>Model Name</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
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

          {/* TAB 4 - MAPPING */}
          <TabsContent value="versions" className="space-y-6">
            <div className="max-w-3xl bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">1. Category</label>
                <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedBrandId(""); setSelectedModelId(""); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">2. Brand</label>
                <Select value={selectedBrandId} onValueChange={(v) => { setSelectedBrandId(v); setSelectedModelId(""); }} disabled={!selectedCatId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-primary">3. Model</label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={!selectedBrandId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selectedModelId && (
              <>
                <div className="flex gap-4 mb-8">
                  <Input className="max-w-sm" placeholder="New Version (e.g. 1.6 HDi 2018)" value={versionName} onChange={e => setVersionName(e.target.value)} />
                  <Button onClick={() => createVersion.mutate({ data: { name: versionName, vehicleModelId: Number(selectedModelId) }})} disabled={!versionName}>Add Version</Button>
                </div>
                
                <Table className="border rounded-lg shadow-sm">
                  <TableHeader className="bg-[#001D3D] hover:bg-[#001D3D]">
                    <TableRow>
                      <TableHead className="text-white">Version / Engine</TableHead>
                      <TableHead className="text-white w-96">Recommended Product Mapping</TableHead>
                      <TableHead className="text-right text-white w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions?.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-bold">{v.name}</TableCell>
                        <TableCell>
                          <Select 
                            value={v.recommendedProductId?.toString() || "0"} 
                            onValueChange={(val) => {
                              const pId = val === "0" ? null : Number(val);
                              updateVersion.mutate({ id: v.id, data: { recommendedProductId: pId }});
                            }}
                          >
                            <SelectTrigger className="border-primary/20">
                              <SelectValue placeholder="Select Oil Product..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0" className="text-muted-foreground italic">None</SelectItem>
                              {products?.products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.brandName})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
