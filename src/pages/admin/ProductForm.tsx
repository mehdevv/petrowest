import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useListBrands, useListCategories, useListOilTypes, useCreateProduct, useUpdateProduct, useGetProductById } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToImgBB } from "@/lib/imgbb";
import { ArrowLeft, Upload, Camera, X, Loader2, ImageIcon, Plus, GripVertical } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  brandId: z.coerce.number().min(1, "La marque est requise"),
  categoryId: z.coerce.number().optional().nullable(),
  oilType: z.string().min(1, "Le type d'huile est requis"),
  viscosityGrade: z.string().optional(),
  volume: z.string().min(1, "Le volume est requis"),
  price: z.coerce.number().min(0, "Le prix doit être >= 0"),
  description: z.string().min(5, "La description est requise"),
  apiStandard: z.string().optional(),
  images: z.array(z.string()).optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false)
});

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/products/:id/edit");
  const isEdit = !!params?.id;
  const productId = isEdit ? Number(params!.id) : 0;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();
  const { data: oilTypes } = useListOilTypes();
  const { data: existingProduct, isLoading: productLoading } = useGetProductById(productId, { query: { enabled: isEdit } });

  // Multi-image state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null); // null means "new slot"
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<"file" | "camera" | null>(null);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brandId: 0,
      categoryId: null,
      oilType: "",
      viscosityGrade: "",
      volume: "",
      price: 0,
      description: "",
      apiStandard: "",
      images: [],
      inStock: true,
      featured: false
    }
  });

  useEffect(() => {
    if (isEdit && existingProduct) {
      const existingImages = existingProduct.images || [];
      setImages(existingImages);
      form.reset({
        name: existingProduct.name,
        brandId: existingProduct.brandId,
        categoryId: existingProduct.categoryId,
        oilType: existingProduct.oilType,
        viscosityGrade: existingProduct.viscosityGrade || "",
        volume: existingProduct.volume,
        price: existingProduct.price,
        description: existingProduct.description,
        apiStandard: existingProduct.apiStandard || "",
        images: existingImages,
        inStock: existingProduct.inStock,
        featured: existingProduct.featured
      });
    }
  }, [existingProduct, isEdit, form]);

  // Keep the form in sync with images state
  useEffect(() => {
    form.setValue("images", images);
  }, [images, form]);

  const handleImageUpload = async (file: File, replaceIndex?: number) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Veuillez sélectionner une image valide.", variant: "destructive" });
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      toast({ title: "L'image ne doit pas dépasser 32 Mo.", variant: "destructive" });
      return;
    }

    setUploadingIndex(replaceIndex ?? -1); // -1 = new slot
    try {
      const result = await uploadToImgBB(file);
      if (replaceIndex !== undefined) {
        setImages(prev => {
          const next = [...prev];
          next[replaceIndex] = result.url;
          return next;
        });
        toast({ title: "Image remplacée avec succès." });
      } else {
        setImages(prev => [...prev, result.url]);
        toast({ title: "Image ajoutée avec succès." });
      }
    } catch (error: any) {
      toast({ title: error.message || "Échec du téléchargement.", variant: "destructive" });
    } finally {
      setUploadingIndex(null);
      setPendingSlot(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Produit créé avec succès." });
        setLocation("/admin/products");
      }
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Produit mis à jour avec succès." });
        setLocation("/admin/products");
      }
    }
  });

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    const payload = { ...data, images };
    if (isEdit) {
      updateMutation.mutate({ id: productId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadingIndex !== null;

  if (isEdit && productLoading) return <AdminLayout>Chargement...</AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{isEdit ? "Modifier le Produit" : "Ajouter un Nouveau Produit"}</h1>
          <p className="text-muted-foreground">Remplissez les détails ci-dessous.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 md:p-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Informations de Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nom du Produit</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner la Marque" /></SelectTrigger></FormControl>
                      <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie (Optionnelle)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner la Catégorie" /></SelectTrigger></FormControl>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Spécifications et Tarification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="oilType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'Huile</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner le Type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {oilTypes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (DA)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="volume" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (ex : 1L, 4L, 5L)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="viscosityGrade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade de Viscosité (ex : 5W-30)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="apiStandard" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Normes API / ACEA</FormLabel>
                    <FormControl><Input {...field} placeholder="API SN, ACEA C3..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* ── Multi-Image Gallery Upload ─────────────────────── */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">
                Images du Produit
                <span className="text-sm font-sans font-normal text-muted-foreground ml-3">
                  {images.length} / 8 — La première image est l'image principale
                </span>
              </h3>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Existing images */}
                {images.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 aspect-square">
                    <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-contain p-2" />

                    {/* Main badge */}
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Principale
                      </span>
                    )}

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-2">
                        {idx > 0 && (
                          <button
                            type="button"
                            title="Déplacer vers la gauche"
                            onClick={() => moveImage(idx, idx - 1)}
                            className="bg-white/90 text-primary rounded-full p-1.5 hover:bg-white transition text-xs font-bold"
                          >
                            ←
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button
                            type="button"
                            title="Déplacer vers la droite"
                            onClick={() => moveImage(idx, idx + 1)}
                            className="bg-white/90 text-primary rounded-full p-1.5 hover:bg-white transition text-xs font-bold"
                          >
                            →
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        title="Supprimer l'image"
                        onClick={() => removeImage(idx)}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new image slot (max 8) */}
                {images.length < 8 && (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 relative">
                    {isUploading && uploadingIndex === -1 ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs">Téléchargement...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                        <span className="text-xs text-muted-foreground text-center px-2">Ajouter une image</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            title="Choisir un fichier"
                            disabled={isUploading}
                            onClick={() => { setPendingSlot("file"); fileInputRef.current?.click(); }}
                            className="bg-primary text-white rounded-full p-2 hover:bg-primary/90 transition disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Prendre une photo"
                            disabled={isUploading}
                            onClick={() => { setPendingSlot("camera"); cameraInputRef.current?.click(); }}
                            className="bg-secondary text-primary rounded-full p-2 hover:bg-secondary/90 transition disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

              <p className="text-xs text-muted-foreground">
                Maximum 8 images. Utilisez ← → pour réordonner. La première image est l'image principale affichée dans la boutique.
                Formats acceptés : JPG, PNG, GIF, WebP. Taille max : 32 Mo.
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Paramètres</h3>
              <div className="flex flex-col gap-6 bg-gray-50 p-6 rounded-lg border">
                <FormField control={form.control} name="inStock" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">En Stock</FormLabel>
                      <FormDescription>Le produit est disponible à l'achat.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">Produit Vedette</FormLabel>
                      <FormDescription>Afficher dans la section vedette de la page d'accueil.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" size="lg" className="w-40 font-bold hover-elevate" disabled={isPending || isUploading}>
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setLocation("/admin/products")}>
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
