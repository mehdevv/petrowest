import { useEffect } from "react";
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
import { useListBrands, useListCategories, useCreateProduct, useUpdateProduct, useGetProductById } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { OIL_TYPES } from "@/lib/constants";
import { ArrowLeft, Plus, X } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  brandId: z.coerce.number().min(1, "Brand required"),
  categoryId: z.coerce.number().optional().nullable(),
  oilType: z.string().min(1, "Oil type required"),
  viscosityGrade: z.string().optional(),
  volume: z.string().min(1, "Volume required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  description: z.string().min(5, "Description required"),
  apiStandard: z.string().optional(),
  images: z.array(z.string()).optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false)
});

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/products/:id/edit");
  const isEdit = !!params?.id;
  const productId = isEdit ? Number(params.id) : 0;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();
  const { data: existingProduct, isLoading: productLoading } = useGetProductById(productId, { query: { enabled: isEdit } });

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
        images: existingProduct.images || [],
        inStock: existingProduct.inStock,
        featured: existingProduct.featured
      });
    }
  }, [existingProduct, isEdit, form]);

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Product created successfully" });
        setLocation("/admin/products");
      }
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Product updated successfully" });
        setLocation("/admin/products");
      }
    }
  });

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (isEdit) {
      updateMutation.mutate({ id: productId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && productLoading) return <AdminLayout>Loading...</AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-muted-foreground">Fill in the details below.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 md:p-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger></FormControl>
                      <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Specifications & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="oilType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oil Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                      <SelectContent>{OIL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (DA)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="volume" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (e.g. 1L, 4L, 5L)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="viscosityGrade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Viscosity Grade (e.g. 5W-30)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="apiStandard" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>API / ACEA Standards</FormLabel>
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

            {/* Images (Simplified as single URL for this implementation context) */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Images</h3>
              <FormField control={form.control} name="images" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Primary)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      value={field.value?.[0] || ""} 
                      onChange={(e) => field.onChange([e.target.value])} 
                    />
                  </FormControl>
                  <FormDescription>For demo purposes, provide a direct URL to the image (e.g. Unsplash).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="font-display text-xl border-b pb-2 text-primary">Settings</h3>
              <div className="flex flex-col gap-6 bg-gray-50 p-6 rounded-lg border">
                <FormField control={form.control} name="inStock" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">In Stock</FormLabel>
                      <FormDescription>Product is available for purchase.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                
                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel className="text-base">Featured Product</FormLabel>
                      <FormDescription>Show on the homepage featured section.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" size="lg" className="w-40 font-bold hover-elevate" disabled={isPending}>
                {isPending ? "Saving..." : "Save Product"}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setLocation("/admin/products")}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
