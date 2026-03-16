import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useGetProduct, useGetDeliveryPrice, useCreateOrder, useListDeliveryPrices } from "@workspace/api-client-react";
import { ALGERIA_WILAYAS } from "@/lib/constants";
import { CheckCircle2, ShieldCheck, Truck, Package } from "lucide-react";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Valid phone number required"),
  wilayaCode: z.string().min(1, "Wilaya is required"),
  address: z.string().min(5, "Full address required"),
  quantity: z.coerce.number().min(1),
});

export default function ProductDetails() {
  const [, params] = useRoute("/shop/:slug");
  const slug = params?.slug || "";
  
  const { data: product, isLoading, isError } = useGetProduct(slug, { query: { retry: false } });
  const [activeImage, setActiveImage] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      wilayaCode: "",
      address: "",
      quantity: 1,
    }
  });

  const selectedWilayaCode = form.watch("wilayaCode");
  const quantity = form.watch("quantity");

  // Fetch delivery price for selected wilaya
  const { data: deliveryData } = useGetDeliveryPrice(selectedWilayaCode, { 
    query: { enabled: !!selectedWilayaCode } 
  });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: () => {
        setOrderSuccess(true);
      }
    }
  });

  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setActiveImage(0);
    }
  }, [product]);

  if (isLoading) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">Loading...</div></PublicLayout>;
  if (isError || !product) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">Product not found.</div></PublicLayout>;

  const productTotal = product.price * (quantity || 1);
  const deliveryCost = deliveryData?.price || 0;
  const orderTotal = productTotal + deliveryCost;

  const onSubmit = (data: z.infer<typeof orderSchema>) => {
    createOrder.mutate({
      data: {
        productId: product.id,
        ...data
      }
    });
  };

  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=800&h=800&fit=crop"];

  return (
    <PublicLayout>
      <div className="bg-[#EBEBEB] min-h-screen pb-24 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Breadcrumb */}
          <div className="text-sm font-medium text-muted-foreground mb-8">
            Home / Shop / {product.categoryName || 'Oil'} / <span className="text-primary">{product.name}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* Left: Images */}
              <div className="p-8 lg:p-12 lg:border-r border-border bg-gray-50 flex flex-col justify-center">
                <div className="aspect-square bg-white rounded-xl mb-6 flex items-center justify-center p-8 border">
                  <img 
                    src={images[activeImage]} 
                    alt={product.name} 
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveImage(i)}
                        className={`w-20 h-20 bg-white rounded-md border-2 p-2 flex-shrink-0 transition-colors ${activeImage === i ? 'border-primary' : 'border-transparent hover:border-border'}`}
                      >
                        <img src={img} className="w-full h-full object-contain" alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="p-8 lg:p-12 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-secondary text-primary font-bold text-sm px-3 py-1 border-none hover:bg-secondary">
                    {product.oilType}
                  </Badge>
                  {!product.inStock && <Badge variant="destructive">Out of Stock</Badge>}
                </div>
                
                <h1 className="font-display text-4xl lg:text-5xl text-primary mb-2 leading-tight">
                  {product.name}
                </h1>
                <p className="text-xl text-muted-foreground font-bold uppercase tracking-wider mb-6">
                  {product.brandName}
                </p>
                
                <div className="font-display text-5xl font-bold text-primary mb-8 border-b pb-8">
                  {product.price.toLocaleString()} <span className="text-2xl text-muted-foreground">DA</span>
                </div>

                <p className="text-lg leading-relaxed text-gray-700 mb-8">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 bg-gray-50 p-6 rounded-xl border">
                  <div><span className="text-muted-foreground block text-sm mb-1">Volume</span><strong className="text-primary text-lg">{product.volume}</strong></div>
                  <div><span className="text-muted-foreground block text-sm mb-1">Viscosity</span><strong className="text-primary text-lg">{product.viscosityGrade || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground block text-sm mb-1">API Standard</span><strong className="text-primary text-lg">{product.apiStandard || 'N/A'}</strong></div>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm font-medium text-primary"><ShieldCheck className="text-secondary w-5 h-5"/> 100% Genuine Guarantee</div>
                  <div className="flex items-center gap-3 text-sm font-medium text-primary"><Truck className="text-secondary w-5 h-5"/> Delivery to 58 Wilayas</div>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER FORM SECTION */}
          {product.inStock ? (
            <div className="bg-white rounded-2xl shadow-xl border-t-8 border-t-primary overflow-hidden" id="order-form">
              <div className="p-8 lg:p-12 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="font-display text-4xl text-primary mb-2">Order Now</h2>
                  <p className="text-xl text-muted-foreground"><span className="text-secondary font-bold bg-[#001D3D] px-3 py-1 rounded">CASH ON DELIVERY</span> Pay only when you receive.</p>
                </div>

                {orderSuccess ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="font-display text-3xl text-green-700 mb-2">Order Received!</h3>
                    <p className="text-lg text-green-800 mb-8">Thank you, {form.getValues('customerName')}. We will call you shortly to confirm your delivery.</p>
                    
                    <div className="bg-white p-6 rounded-lg border text-left max-w-sm mx-auto">
                      <h4 className="font-bold border-b pb-2 mb-4 text-primary">Order Summary</h4>
                      <div className="flex justify-between mb-2"><span>Product</span><span className="font-bold">{product.name}</span></div>
                      <div className="flex justify-between mb-2"><span>Quantity</span><span className="font-bold">{form.getValues('quantity')}</span></div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t mt-4 text-primary"><span>Total to Pay</span><span>{orderTotal.toLocaleString()} DA</span></div>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="h-14 text-lg" placeholder="Mohamed..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" className="h-14 text-lg" placeholder="0555..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="wilayaCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wilaya</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Select Wilaya" /></SelectTrigger></FormControl>
                              <SelectContent className="max-h-[300px]">
                                {ALGERIA_WILAYAS.map(w => {
                                  const code = w.substring(0, 2);
                                  return <SelectItem key={code} value={code}>{w}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="quantity" render={({ field }) => (
                          <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" min={1} className="h-14 text-lg" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Full Delivery Address</FormLabel><FormControl><Textarea className="text-lg min-h-[100px]" placeholder="Street, Neighborhood, City..." {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="bg-[#001D3D] text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-auto space-y-2">
                          <div className="flex justify-between md:justify-start md:gap-8 text-white/70">
                            <span>Product:</span> <span className="text-white font-bold">{productTotal.toLocaleString()} DA</span>
                          </div>
                          {selectedWilayaCode && (
                            <div className="flex justify-between md:justify-start md:gap-8 text-white/70">
                              <span>Delivery:</span> <span className="text-secondary font-bold">{deliveryCost === 0 ? "Free" : `${deliveryCost.toLocaleString()} DA`}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center md:text-right w-full md:w-auto border-t md:border-t-0 border-white/20 pt-4 md:pt-0">
                          <span className="block text-sm text-secondary font-bold tracking-widest uppercase mb-1">Total to Pay</span>
                          <span className="font-display text-5xl">{orderTotal.toLocaleString()} DA</span>
                        </div>
                      </div>

                      <Button type="submit" size="lg" disabled={createOrder.isPending} className="w-full h-16 text-xl font-display tracking-widest bg-secondary text-primary hover:bg-secondary/90 hover-elevate">
                        {createOrder.isPending ? "Processing..." : "Confirm Order (Cash on Delivery)"}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-3xl text-primary mb-2">Out of Stock</h2>
              <p className="text-lg text-muted-foreground">This product is currently unavailable. Please check back later.</p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
