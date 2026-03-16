import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListBrands, useCreateBrand, useUpdateBrand, useDeleteBrand,
  useListOilTypes, useCreateOilType, useUpdateOilType, useDeleteOilType,
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check, Tag, Droplets, FolderOpen, Upload, Loader2, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToImgBB } from "@/lib/imgbb";

type TabType = "brands" | "oilTypes" | "categories";

export default function Catalogue() {
  const [activeTab, setActiveTab] = useState<TabType>("brands");

  const TABS = [
    { id: "brands" as TabType, label: "Marques", icon: Tag },
    { id: "oilTypes" as TabType, label: "Types d'Huile", icon: Droplets },
    { id: "categories" as TabType, label: "Catégories", icon: FolderOpen },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">Catalogue</h1>
        <p className="text-muted-foreground">
          Gérer les marques, les types d'huile et les catégories de produits.
        </p>
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
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  SHARED: Simple CRUD table for name-only items
// ═══════════════════════════════════════════════════════════

interface CrudRow {
  id: number;
  name: string;
  productCount?: number;
}

// ═══════════════════════════════════════════════════════════
//  BRANDS TAB
// ═══════════════════════════════════════════════════════════

function BrandsTab() {
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
        toast({ title: "Marque ajoutée avec succès." });
      },
      onError: () => toast({ title: "Erreur lors de l'ajout.", variant: "destructive" }),
    },
  });

  const updateMut = useUpdateBrand({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
        setEditingId(null);
        toast({ title: "Marque mise à jour." });
      },
    },
  });

  const deleteMut = useDeleteBrand({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
        toast({ title: "Marque supprimée." });
      },
      onError: () => toast({ title: "Impossible de supprimer une marque avec des produits.", variant: "destructive" }),
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
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">
            Ajouter une Nouvelle Marque
          </label>
          <Input placeholder="ex : Castrol, Total, Shell..." value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !brands?.length ? (
          <div className="p-8 text-center text-muted-foreground">Aucune marque trouvée.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Nom de la Marque</TableHead>
                <TableHead className="text-center w-32">Produits</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
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
        toast({ title: "Type d'huile ajouté avec succès." });
      },
      onError: () => toast({ title: "Erreur lors de l'ajout.", variant: "destructive" }),
    },
  });

  const updateMut = useUpdateOilType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/oil-types"] });
        setEditingId(null);
        toast({ title: "Type d'huile mis à jour." });
      },
    },
  });

  const deleteMut = useDeleteOilType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/oil-types"] });
        toast({ title: "Type d'huile supprimé." });
      },
      onError: () => toast({ title: "Impossible de supprimer ce type (utilisé par des produits).", variant: "destructive" }),
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
          <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">
            Ajouter un Nouveau Type d'Huile
          </label>
          <Input placeholder="ex : Motor Oil, Gear Oil, Coolant..." value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 px-6 hover-elevate" disabled={createMut.isPending || !newName.trim()}>
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !oilTypes?.length ? (
          <div className="p-8 text-center text-muted-foreground">Aucun type d'huile trouvé.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Nom du Type</TableHead>
                <TableHead className="text-center w-32">Produits</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
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
//  CATEGORIES TAB (with image upload)
// ═══════════════════════════════════════════════════════════

function CategoriesTab() {
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const newImageRef = useRef<HTMLInputElement>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useListCategories();

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setNewCatName("");
        setNewCatImage(null);
        toast({ title: "Catégorie ajoutée." });
      },
      onError: () => toast({ title: "Erreur lors de l'ajout.", variant: "destructive" }),
    },
  });

  const updateMut = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setEditingId(null);
        setEditImage(null);
        toast({ title: "Catégorie mise à jour." });
      },
    },
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: "Catégorie supprimée." });
      },
      onError: () => toast({ title: "Impossible de supprimer une catégorie avec des produits.", variant: "destructive" }),
    },
  });

  const handleImageFile = async (
    file: File,
    setImg: (url: string | null) => void,
    setLoading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fichier invalide. Sélectionnez une image.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await uploadToImgBB(file);
      setImg(result.url);
      toast({ title: "Image téléchargée." });
    } catch (err: any) {
      toast({ title: err.message || "Échec du téléchargement.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMut.mutate({ data: { name: newCatName.trim(), image: newCatImage } });
  };

  const saveEdit = (cat: any) => {
    if (!editName.trim()) return;
    // editImage === null means "keep original"; editImage === "" means "remove"
    const image = editImage === null ? cat.image : (editImage === "" ? null : editImage);
    updateMut.mutate({ id: cat.id, data: { name: editName.trim(), image } });
  };

  return (
    <div className="max-w-4xl">
      {/* Add Form */}
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8">
        <label className="text-sm font-bold text-primary mb-4 block uppercase tracking-wider">
          Ajouter une Nouvelle Catégorie
        </label>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="ex : Huiles Moteur, Lubrifiants..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Image thumbnail or upload button */}
          <input
            ref={newImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file, setNewCatImage, setUploadingNew);
              e.target.value = "";
            }}
          />
          {newCatImage ? (
            <div className="relative flex-shrink-0">
              <img src={newCatImage} alt="Aperçu" className="w-12 h-12 rounded-lg object-cover border-2 border-primary/30" />
              <button
                type="button"
                onClick={() => setNewCatImage(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 flex-shrink-0"
              onClick={() => newImageRef.current?.click()}
              disabled={uploadingNew}
              title="Ajouter une image"
            >
              {uploadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          )}

          <Button type="submit" className="h-12 px-6 hover-elevate flex-shrink-0" disabled={createMut.isPending || !newCatName.trim()}>
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !categories?.length ? (
          <div className="p-8 text-center text-muted-foreground">Aucune catégorie trouvée.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Nom de la Catégorie</TableHead>
                <TableHead className="text-center w-32">Produits</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  {/* Image cell */}
                  <TableCell>
                    {editingId === cat.id ? (
                      <>
                        <input
                          ref={editImageRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFile(file, setEditImage, setUploadingEdit);
                            e.target.value = "";
                          }}
                        />
                        {(editImage ?? cat.image) ? (
                          <div className="relative inline-block">
                            <img
                              src={(editImage !== null ? editImage : cat.image) || ""}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border cursor-pointer hover:opacity-80"
                              onClick={() => editImageRef.current?.click()}
                              title="Cliquer pour changer l'image"
                            />
                            <button
                              type="button"
                              onClick={() => setEditImage("")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => editImageRef.current?.click()}
                            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            disabled={uploadingEdit}
                          >
                            {uploadingEdit ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        )}
                      </>
                    ) : (
                      cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )
                    )}
                  </TableCell>

                  {/* Name cell */}
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat); if (e.key === "Escape") { setEditingId(null); setEditImage(null); } }}
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
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setEditImage(null); }}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditImage(null); }}
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
