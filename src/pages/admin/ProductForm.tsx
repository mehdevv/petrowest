import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  useListBrands,
  useListCategories,
  useListOilTypes,
  useListProductVolumes,
  useListViscosityGrades,
  useCreateProduct,
  useUpdateProduct,
  useGetProductById,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToImgBB } from "@/lib/imgbb";
import { uploadProductPdf } from "@/lib/upload-pdf";
import { ArrowLeft, Upload, Camera, X, Loader2, ImageIcon, Plus, GripVertical, FileText, ShieldCheck } from "lucide-react";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product";
}

function buildProductSchema(t: (k: string) => string) {
  return z.object({
    name: z.string().min(2, t("admin.productForm.errors.name")),
    brandId: z.coerce.number().min(1, t("admin.productForm.errors.brand")),
    categoryId: z.coerce.number().optional().nullable(),
    oilType: z.string().min(1, t("admin.productForm.errors.oilType")),
    viscosityGrade: z.string().optional(),
    volume: z.string().min(1, t("admin.productForm.errors.volume")),
    price: z.coerce.number().min(0, t("admin.productForm.errors.price")),
    description: z.string().min(5, t("admin.productForm.errors.description")),
    apiStandard: z.string().optional(),
    images: z.array(z.string()).optional(),
    metaPixelId: z.string().optional(),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
  });
}

export default function ProductForm() {
  const { t } = useTranslation();
  const productSchema = useMemo(() => buildProductSchema(t), [t]);
  type ProductFormValues = z.infer<ReturnType<typeof buildProductSchema>>;
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/products/:id/edit");
  const isEdit = !!params?.id;
  const productId = isEdit ? Number(params!.id) : 0;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();
  const { data: oilTypes } = useListOilTypes();
  const { data: productVolumes } = useListProductVolumes();
  const { data: viscosityGrades } = useListViscosityGrades();
  const { data: existingProduct, isLoading: productLoading } = useGetProductById(productId, { query: { enabled: isEdit } });

  // Multi-image state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null); // null means "new slot"
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<"file" | "camera" | null>(null);

  // PDF sheet state
  const [securitySheetUrl, setSecuritySheetUrl] = useState<string | null>(null);
  const [technicalSheetUrl, setTechnicalSheetUrl] = useState<string | null>(null);
  const [uploadingSecurity, setUploadingSecurity] = useState(false);
  const [uploadingTechnical, setUploadingTechnical] = useState(false);
  const securityInputRef = useRef<HTMLInputElement>(null);
  const technicalInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
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
      metaPixelId: "",
      inStock: true,
      featured: false
    }
  });

  useEffect(() => {
    if (isEdit && existingProduct) {
      const existingImages = existingProduct.images || [];
      setImages(existingImages);
      setSecuritySheetUrl(existingProduct.securitySheetUrl ?? null);
      setTechnicalSheetUrl(existingProduct.technicalSheetUrl ?? null);
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
        metaPixelId: existingProduct.metaPixelId || "",
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
      toast({ title: t("admin.productForm.toastPickImage"), variant: "destructive" });
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      toast({ title: t("admin.productForm.toastImage32"), variant: "destructive" });
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
        toast({ title: t("admin.productForm.toastImageReplaced") });
      } else {
        setImages(prev => [...prev, result.url]);
        toast({ title: t("admin.productForm.toastImageAddedOk") });
      }
    } catch (error: any) {
      toast({ title: error.message || t("admin.categories.toastUploadErr"), variant: "destructive" });
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

  const handlePdfUpload = async (file: File, type: "security" | "technical") => {
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Seuls les fichiers PDF sont acceptés.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Le fichier ne doit pas dépasser 10 Mo.", variant: "destructive" });
      return;
    }

    const slug = form.getValues("name") ? slugify(form.getValues("name")) : "product";
    const setter = type === "security" ? setSecuritySheetUrl : setTechnicalSheetUrl;
    const setLoading = type === "security" ? setUploadingSecurity : setUploadingTechnical;

    setLoading(true);
    try {
      const url = await uploadProductPdf(file, slug, type);
      setter(url);
      toast({ title: type === "security" ? t("admin.productForm.toastSecurityAdded") : t("admin.productForm.toastTechnicalAdded") });
    } catch (error: any) {
      toast({ title: error.message || t("admin.productForm.toastPdfErr"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: t("admin.productForm.toastCreateOk") });
        setLocation("/admin/products");
      }
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: t("admin.productForm.toastUpdateOk") });
        setLocation("/admin/products");
      }
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    const payload = {
      ...data,
      images,
      metaPixelId: data.metaPixelId?.trim() ? data.metaPixelId.trim() : null,
      securitySheetUrl: securitySheetUrl || null,
      technicalSheetUrl: technicalSheetUrl || null,
    };
    if (isEdit) {
      updateMutation.mutate({ id: productId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadingIndex !== null || uploadingSecurity || uploadingTechnical;

  if (isEdit && productLoading) return <AdminLayout>{t("admin.common.loading")}</AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{isEdit ? t("admin.productForm.editTitle") : t("admin.productForm.newTitle")}</h1>
          <p className="text-muted-foreground">{isEdit ? t("admin.productForm.subtitleEdit") : t("admin.productForm.subtitleForm")}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 md:p-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">{t("admin.productForm.basicInfo")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("admin.productForm.name")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productForm.brand")}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("admin.productForm.selectBrand")} /></SelectTrigger></FormControl>
                      <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productForm.categoryOptional")}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("admin.productForm.selectCategory")} /></SelectTrigger></FormControl>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">{t("admin.productForm.sectionSpecs")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="oilType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productForm.oilType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("admin.productForm.selectOilType")} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {oilTypes?.map((ot) => (
                          <SelectItem key={ot.id} value={ot.name}>
                            {ot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productForm.price")}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="volume" render={({ field }) => {
                  const volNames = new Set((productVolumes ?? []).map((v) => v.name));
                  const volOrphan = !!field.value && !volNames.has(field.value);
                  return (
                    <FormItem>
                      <FormLabel>{t("admin.productForm.volumeLabel")}</FormLabel>
                      {productVolumes && productVolumes.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.productForm.selectVolume")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {volOrphan && (
                              <SelectItem value={field.value}>
                                {field.value} ({t("admin.productForm.legacyCatalogValue")})
                              </SelectItem>
                            )}
                            {productVolumes.map((v) => (
                              <SelectItem key={v.id} value={v.name}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input {...field} placeholder={t("admin.productForm.volumePh")} /></FormControl>
                      )}
                      <FormDescription>
                        {productVolumes && productVolumes.length > 0
                          ? t("admin.productForm.volumeCatalogHint")
                          : t("admin.productForm.volumeFreeTextHint")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}/>

                <FormField control={form.control} name="viscosityGrade" render={({ field }) => {
                  const visNames = new Set((viscosityGrades ?? []).map((g) => g.name));
                  const visOrphan = !!field.value && !visNames.has(field.value);
                  const noneSentinel = "__pw_no_viscosity__";
                  return (
                    <FormItem>
                      <FormLabel>{t("admin.productForm.viscosityLabel")}</FormLabel>
                      {viscosityGrades && viscosityGrades.length > 0 ? (
                        <Select
                          onValueChange={(v) => field.onChange(v === noneSentinel ? "" : v)}
                          value={field.value ? field.value : noneSentinel}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.productForm.selectViscosity")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={noneSentinel}>{t("admin.productForm.noneViscosity")}</SelectItem>
                            {visOrphan && field.value && (
                              <SelectItem value={field.value}>
                                {field.value} ({t("admin.productForm.legacyCatalogValue")})
                              </SelectItem>
                            )}
                            {viscosityGrades.map((g) => (
                              <SelectItem key={g.id} value={g.name}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input {...field} placeholder={t("admin.productForm.viscosityPh")} /></FormControl>
                      )}
                      <FormDescription>
                        {viscosityGrades && viscosityGrades.length > 0
                          ? t("admin.productForm.viscosityCatalogHint")
                          : t("admin.productForm.viscosityFreeTextHint")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}/>

                <FormField control={form.control} name="apiStandard" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("admin.productForm.apiLabel")}</FormLabel>
                    <FormControl><Input {...field} placeholder={`${t("admin.productForm.apiPh")}…`} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("admin.productForm.description")}</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* ── Multi-Image Gallery Upload ─────────────────────── */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">
                {t("admin.productForm.imagesHeading")}
                <span className="text-sm font-sans font-normal text-muted-foreground ms-3">
                  {t("admin.productForm.imagesCounter", { count: images.length })}
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
                        {t("admin.productForm.mainBadge")}
                      </span>
                    )}

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-2">
                        {idx > 0 && (
                          <button
                            type="button"
                            title={t("admin.productForm.moveLeft")}
                            onClick={() => moveImage(idx, idx - 1)}
                            className="bg-white/90 text-primary rounded-full p-1.5 hover:bg-white transition text-xs font-bold"
                          >
                            ←
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button
                            type="button"
                            title={t("admin.productForm.moveRight")}
                            onClick={() => moveImage(idx, idx + 1)}
                            className="bg-white/90 text-primary rounded-full p-1.5 hover:bg-white transition text-xs font-bold"
                          >
                            →
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        title={t("admin.productForm.removeImage")}
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
                        <span className="text-xs">{t("admin.productForm.uploading")}</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                        <span className="text-xs text-muted-foreground text-center px-2">Ajouter une image</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            title={t("admin.productForm.chooseFile")}
                            disabled={isUploading}
                            onClick={() => { setPendingSlot("file"); fileInputRef.current?.click(); }}
                            className="bg-primary text-white rounded-full p-2 hover:bg-primary/90 transition disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title={t("admin.productForm.takePhoto")}
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

              <p className="text-xs text-muted-foreground">{t("admin.productForm.imagesHelp")}</p>
            </div>

            {/* ── PDF Sheets Upload ─────────────────────── */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">
                {t("admin.productForm.pdfBlockTitle")}
                <span className="text-sm font-sans font-normal text-muted-foreground ms-3">{t("admin.productForm.pdfBlockSub")}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Sheet */}
                <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                    {t("admin.productForm.securityHeading")}
                  </div>
                  {securitySheetUrl ? (
                    <div className="flex items-center gap-3 bg-white rounded-lg border p-3">
                      <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{t("admin.productForm.fileSecurity")}</p>
                        <a href={securitySheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {t("admin.productForm.viewFile")}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSecuritySheetUrl(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t("admin.productForm.removeShort")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingSecurity}
                      onClick={() => securityInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingSecurity ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploadingSecurity ? t("admin.productForm.uploading") : t("admin.productForm.clickPdf")}
                      </span>
                    </button>
                  )}
                  <input
                    ref={securityInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfUpload(file, "security");
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Technical Sheet */}
                <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <FileText className="w-5 h-5 text-blue-500" />
                    {t("admin.productForm.technicalHeading")}
                  </div>
                  {technicalSheetUrl ? (
                    <div className="flex items-center gap-3 bg-white rounded-lg border p-3">
                      <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{t("admin.productForm.fileTechnical")}</p>
                        <a href={technicalSheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {t("admin.productForm.viewFile")}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTechnicalSheetUrl(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t("admin.productForm.removeShort")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingTechnical}
                      onClick={() => technicalInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingTechnical ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploadingTechnical ? t("admin.productForm.uploading") : t("admin.productForm.clickPdf")}
                      </span>
                    </button>
                  )}
                  <input
                    ref={technicalInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfUpload(file, "technical");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t("admin.productForm.pdfHelp")}</p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">{t("admin.productForm.settingsHeading")}</h3>
              <div className="flex flex-col gap-6 bg-gray-50 p-6 rounded-lg border">
                <FormField control={form.control} name="metaPixelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productForm.metaPixelId")}</FormLabel>
                    <FormControl><Input placeholder={t("admin.productForm.metaPixelIdPh")} {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription>{t("admin.productForm.metaPixelIdHelp")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="inStock" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">{t("admin.productForm.inStock")}</FormLabel>
                      <FormDescription>{t("admin.productForm.inStockDesc")}</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">{t("admin.productForm.featured")}</FormLabel>
                      <FormDescription>{t("admin.productForm.featuredDesc")}</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" size="lg" className="w-40 font-bold hover-elevate" disabled={isPending || isUploading}>
                {isPending ? t("admin.productForm.savePending") : isEdit ? t("admin.productForm.submitEdit") : t("admin.productForm.submitNew")}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setLocation("/admin/products")}>
                {t("admin.common.cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
