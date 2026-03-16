import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { useGetProduct, useGetDeliveryPrice, useCreateOrder } from "@workspace/api-client-react";
import { ALGERIA_WILAYAS } from "@/lib/constants";
import { CheckCircle2, ShieldCheck, Truck, Package, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

const orderSchema = z.object({
  customerName: z.string().min(2, "Le nom est requis"),
  phone: z.string().min(8, "Numéro de téléphone valide requis"),
  wilayaCode: z.string().min(1, "La wilaya est requise"),
  address: z.string().min(5, "Adresse complète requise"),
  quantity: z.coerce.number().min(1),
});

export default function ProductDetails() {
  const [, params] = useRoute("/shop/:slug");
  const slug = params?.slug || "";
  
  const { data: product, isLoading, isError } = useGetProduct(slug, { query: { retry: false } });
  const [activeImage, setActiveImage] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  if (isLoading) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">Chargement...</div></PublicLayout>;
  if (isError || !product) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">Produit introuvable.</div></PublicLayout>;

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

  const prevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage(i => (i + 1) % images.length);

  return (
    <PublicLayout>
      {/* ── Lightbox ───────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
              onClick={() => setLightboxOpen(false)}
            >
              <ChevronLeft className="w-6 h-6 rotate-[45deg]" />
            </button>

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              key={activeImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={images[activeImage]}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeImage ? 'bg-secondary scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#EBEBEB] min-h-screen pb-24 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Breadcrumb */}
          <div className="text-sm font-medium text-muted-foreground mb-8">
            Accueil / Boutique / {product.categoryName || 'Huile'} / <span className="text-primary">{product.name}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* Left: Images */}
              <div className="p-8 lg:p-12 lg:border-r border-border bg-gray-50 flex flex-col justify-center">
                {/* Main image with nav arrows + zoom */}
                <div className="relative aspect-square bg-white rounded-xl mb-4 flex items-center justify-center p-8 border group">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      src={images[activeImage]}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </AnimatePresence>

                  {/* Zoom button */}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-md"
                    title="Agrandir"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {/* Left / right arrows (only if multiple images) */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {activeImage + 1} / {images.length}
                    </span>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`flex-shrink-0 w-20 h-20 bg-white rounded-lg border-2 p-1.5 transition-all ${
                          activeImage === i
                            ? 'border-primary shadow-md scale-105'
                            : 'border-transparent hover:border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-contain" alt={`Vue ${i + 1}`} />
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
                  {!product.inStock && <Badge variant="destructive">Rupture de Stock</Badge>}
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
                  <div><span className="text-muted-foreground block text-sm mb-1">Viscosité</span><strong className="text-primary text-lg">{product.viscosityGrade || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground block text-sm mb-1">Norme API</span><strong className="text-primary text-lg">{product.apiStandard || 'N/A'}</strong></div>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm font-medium text-primary"><ShieldCheck className="text-secondary w-5 h-5"/> Garantie 100% Authentique</div>
                  <div className="flex items-center gap-3 text-sm font-medium text-primary"><Truck className="text-secondary w-5 h-5"/> Livraison dans les 58 Wilayas</div>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER FORM SECTION */}
          {product.inStock ? (
            <div className="bg-white rounded-2xl shadow-xl border-t-8 border-t-primary overflow-hidden" id="order-form">
              <div className="p-8 lg:p-12 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="font-display text-4xl text-primary mb-2">Commander Maintenant</h2>
                  <p className="text-xl text-muted-foreground"><span className="text-secondary font-bold bg-[#001D3D] px-3 py-1 rounded">PAIEMENT À LA LIVRAISON</span> Payez uniquement à la réception.</p>
                </div>

                {orderSuccess ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="font-display text-3xl text-green-700 mb-2">Commande Reçue !</h3>
                    <p className="text-lg text-green-800 mb-8">Merci, {form.getValues('customerName')}. Nous vous appellerons bientôt pour confirmer votre livraison.</p>
                    
                    <div className="bg-white p-6 rounded-lg border text-left max-w-sm mx-auto">
                      <h4 className="font-bold border-b pb-2 mb-4 text-primary">Résumé de la Commande</h4>
                      <div className="flex justify-between mb-2"><span>Produit</span><span className="font-bold">{product.name}</span></div>
                      <div className="flex justify-between mb-2"><span>Quantité</span><span className="font-bold">{form.getValues('quantity')}</span></div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t mt-4 text-primary"><span>Total à Payer</span><span>{orderTotal.toLocaleString()} DA</span></div>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem><FormLabel>Nom Complet</FormLabel><FormControl><Input className="h-14 text-lg" placeholder="Mohamed..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Numéro de Téléphone</FormLabel><FormControl><Input type="tel" className="h-14 text-lg" placeholder="0555..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="wilayaCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wilaya</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Sélectionner la Wilaya" /></SelectTrigger></FormControl>
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
                          <FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" min={1} className="h-14 text-lg" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Adresse de Livraison Complète</FormLabel><FormControl><Textarea className="text-lg min-h-[100px]" placeholder="Rue, Quartier, Ville..." {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="bg-[#001D3D] text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-auto space-y-2">
                          <div className="flex justify-between md:justify-start md:gap-8 text-white/70">
                            <span>Produit :</span> <span className="text-white font-bold">{productTotal.toLocaleString()} DA</span>
                          </div>
                          {selectedWilayaCode && (
                            <div className="flex justify-between md:justify-start md:gap-8 text-white/70">
                              <span>Livraison :</span> <span className="text-secondary font-bold">{deliveryCost === 0 ? "Gratuit" : `${deliveryCost.toLocaleString()} DA`}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center md:text-right w-full md:w-auto border-t md:border-t-0 border-white/20 pt-4 md:pt-0">
                          <span className="block text-sm text-secondary font-bold tracking-widest uppercase mb-1">Total à Payer</span>
                          <span className="font-display text-5xl">{orderTotal.toLocaleString()} DA</span>
                        </div>
                      </div>

                      <Button type="submit" size="lg" disabled={createOrder.isPending} className="w-full h-16 text-xl font-display tracking-widest bg-secondary text-primary hover:bg-secondary/90 hover-elevate">
                        {createOrder.isPending ? "Traitement..." : "Confirmer la Commande (Contre Remboursement)"}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-3xl text-primary mb-2">Rupture de Stock</h2>
              <p className="text-lg text-muted-foreground">Ce produit est actuellement indisponible. Veuillez réessayer plus tard.</p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
