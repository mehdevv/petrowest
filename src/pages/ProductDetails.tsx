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
import { CheckCircle2, ShieldCheck, Truck, Package, ChevronLeft, ChevronRight, ZoomIn, X, ShoppingCart, Building2, Home } from "lucide-react";

const orderSchema = z.object({
  customerName: z.string().min(2, "Le nom est requis"),
  phone: z.string().min(8, "Numéro de téléphone valide requis"),
  wilayaCode: z.string().min(1, "La wilaya est requise"),
  address: z.string().min(5, "Adresse complète requise"),
  quantity: z.coerce.number().min(1),
});

type DeliveryType = "stopdesk" | "domicile";

export default function ProductDetails() {
  const [, params] = useRoute("/shop/:slug");
  const slug = params?.slug || "";
  
  const { data: product, isLoading, isError } = useGetProduct(slug, { query: { retry: false } });
  const [activeImage, setActiveImage] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("stopdesk");

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
  const deliveryCost = deliveryData
    ? (deliveryType === "domicile" ? (deliveryData.domicilePrice || 0) : (deliveryData.price || 0))
    : 0;
  const orderTotal = productTotal + deliveryCost;

  const onSubmit = (data: z.infer<typeof orderSchema>) => {
    createOrder.mutate({
      data: {
        productId: product.id,
        ...data,
        deliveryType,
      }
    });
  };

  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=800&h=800&fit=crop"];

  const prevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage(i => (i + 1) % images.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
    setTouchStart(null);
  };

  const scrollToOrder = () => {
    document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PublicLayout>
      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            {images.length > 1 && (
              <>
                <button className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition z-10" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition z-10" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
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
              className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
            {images.length > 1 && (
              <div className="absolute bottom-6 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImage(i); }} className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeImage ? 'bg-secondary scale-125' : 'bg-white/40 hover:bg-white/60'}`} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#EBEBEB] min-h-screen pt-20 sm:pt-24 pb-28 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-8">
          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-4 sm:mb-8 truncate">
            Accueil / Boutique / {product.categoryName || 'Huile'} / <span className="text-primary">{product.name}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden mb-6 sm:mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* ── Image Gallery ── */}
              <div className="p-4 sm:p-8 lg:p-12 lg:border-r border-border bg-gray-50 flex flex-col justify-center">
                <div
                  className="relative aspect-square bg-white rounded-xl mb-3 sm:mb-4 flex items-center justify-center p-4 sm:p-8 border group overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
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
                  <button onClick={() => setLightboxOpen(true)} className="absolute top-3 right-3 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-2 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-md" title="Agrandir">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-1.5 sm:p-2 shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-1.5 sm:p-2 shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    </>
                  )}
                  {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-medium px-2 py-1 rounded-full">{activeImage + 1} / {images.length}</span>
                  )}
                </div>
                {images.length > 1 && (
                  <>
                    <div className="flex sm:hidden justify-center gap-2 pb-1">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setActiveImage(i)} className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? 'bg-primary scale-125 w-5' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                    <div className="hidden sm:flex gap-3 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-lg border-2 p-1.5 transition-all ${activeImage === i ? 'border-primary shadow-md scale-105' : 'border-transparent hover:border-border opacity-70 hover:opacity-100'}`}>
                          <img src={img} className="w-full h-full object-contain" alt={`Vue ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── Product Info ── */}
              <div className="p-5 sm:p-8 lg:p-12 flex flex-col">
                <div className="flex justify-between items-start mb-2 sm:mb-4">
                  <Badge className="bg-secondary text-primary font-bold text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 border-none hover:bg-secondary">{product.oilType}</Badge>
                  {!product.inStock && <Badge variant="destructive" className="text-xs">Rupture de Stock</Badge>}
                </div>
                <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl text-primary mb-1 sm:mb-2 leading-tight">{product.name}</h1>
                <p className="text-base sm:text-xl text-muted-foreground font-bold uppercase tracking-wider mb-4 sm:mb-6">{product.brandName}</p>
                <div className="font-display text-3xl sm:text-5xl font-bold text-primary mb-5 sm:mb-8 border-b pb-5 sm:pb-8">
                  {product.price.toLocaleString()} <span className="text-lg sm:text-2xl text-muted-foreground">DA</span>
                </div>
                <p className="text-sm sm:text-lg leading-relaxed text-gray-700 mb-5 sm:mb-8">{product.description}</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-y-4 sm:gap-x-8 mb-5 sm:mb-8 bg-gray-50 p-3 sm:p-6 rounded-xl border">
                  <div><span className="text-muted-foreground block text-[10px] sm:text-sm mb-0.5">Volume</span><strong className="text-primary text-xs sm:text-lg">{product.volume}</strong></div>
                  <div><span className="text-muted-foreground block text-[10px] sm:text-sm mb-0.5">Viscosité</span><strong className="text-primary text-xs sm:text-lg">{product.viscosityGrade || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground block text-[10px] sm:text-sm mb-0.5">Norme API</span><strong className="text-primary text-xs sm:text-lg">{product.apiStandard || 'N/A'}</strong></div>
                </div>
                <div className="space-y-2 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-primary"><ShieldCheck className="text-secondary w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"/> Garantie 100% Authentique</div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-primary"><Truck className="text-secondary w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"/> Livraison dans les 58 Wilayas</div>
                </div>
                {product.inStock && (
                  <Button onClick={scrollToOrder} size="lg" className="w-full mt-6 h-14 text-lg font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90 sm:hidden">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Commander — {product.price.toLocaleString()} DA
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── ORDER FORM ── */}
          {product.inStock ? (
            <div className="bg-white rounded-2xl shadow-xl border-t-8 border-t-primary overflow-hidden" id="order-form">
              <div className="p-5 sm:p-8 lg:p-12 max-w-4xl mx-auto">
                <div className="text-center mb-6 sm:mb-10">
                  <h2 className="font-display text-2xl sm:text-4xl text-primary mb-2">Commander Maintenant</h2>
                  <p className="text-sm sm:text-xl text-muted-foreground">
                    <span className="text-secondary font-bold bg-[#001D3D] px-2 sm:px-3 py-1 rounded text-xs sm:text-base">PAIEMENT À LA LIVRAISON</span>
                    <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">Payez uniquement à la réception.</span>
                  </p>
                </div>

                {orderSuccess ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5 sm:p-8 text-center animate-in zoom-in duration-500">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl text-green-700 mb-2">Commande Reçue !</h3>
                    <p className="text-sm sm:text-lg text-green-800 mb-6 sm:mb-8">Merci, {form.getValues('customerName')}. Nous vous appellerons bientôt pour confirmer votre livraison.</p>
                    <div className="bg-white p-4 sm:p-6 rounded-lg border text-left max-w-sm mx-auto text-sm sm:text-base">
                      <h4 className="font-bold border-b pb-2 mb-3 sm:mb-4 text-primary">Résumé de la Commande</h4>
                      <div className="flex justify-between mb-2"><span>Produit</span><span className="font-bold">{product.name}</span></div>
                      <div className="flex justify-between mb-2"><span>Quantité</span><span className="font-bold">{form.getValues('quantity')}</span></div>
                      <div className="flex justify-between mb-2"><span>Livraison</span><span className="font-bold">{deliveryType === "domicile" ? "À Domicile" : "Stop Desk"}</span></div>
                      <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t mt-3 sm:mt-4 text-primary"><span>Total à Payer</span><span>{orderTotal.toLocaleString()} DA</span></div>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Nom Complet</FormLabel>
                            <FormControl><Input className="h-12 sm:h-14 text-base sm:text-lg" placeholder="Mohamed..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Numéro de Téléphone</FormLabel>
                            <FormControl><Input type="tel" className="h-12 sm:h-14 text-base sm:text-lg" placeholder="0555..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <FormField control={form.control} name="wilayaCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Wilaya</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg"><SelectValue placeholder="Sélectionner la Wilaya" /></SelectTrigger></FormControl>
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
                          <FormItem>
                            <FormLabel className="text-sm">Quantité</FormLabel>
                            <FormControl><Input type="number" min={1} className="h-12 sm:h-14 text-base sm:text-lg" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>

                      {/* ── Delivery Type Toggle ── */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">Type de Livraison</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setDeliveryType("stopdesk")}
                            className={`relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all ${
                              deliveryType === "stopdesk"
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {deliveryType === "stopdesk" && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                            <Building2 className={`w-7 h-7 sm:w-8 sm:h-8 ${deliveryType === "stopdesk" ? "text-primary" : "text-gray-400"}`} />
                            <span className={`font-bold text-sm sm:text-base ${deliveryType === "stopdesk" ? "text-primary" : "text-gray-600"}`}>Stop Desk</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">Retrait au bureau de livraison</span>
                            {selectedWilayaCode && deliveryData && (
                              <span className={`font-display font-bold text-base sm:text-lg ${deliveryType === "stopdesk" ? "text-secondary" : "text-gray-500"}`}>
                                {deliveryData.price.toLocaleString()} DA
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeliveryType("domicile")}
                            className={`relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all ${
                              deliveryType === "domicile"
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {deliveryType === "domicile" && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                            <Home className={`w-7 h-7 sm:w-8 sm:h-8 ${deliveryType === "domicile" ? "text-primary" : "text-gray-400"}`} />
                            <span className={`font-bold text-sm sm:text-base ${deliveryType === "domicile" ? "text-primary" : "text-gray-600"}`}>À Domicile</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">Livraison à votre porte</span>
                            {selectedWilayaCode && deliveryData && (
                              <span className={`font-display font-bold text-base sm:text-lg ${deliveryType === "domicile" ? "text-secondary" : "text-gray-500"}`}>
                                {deliveryData.domicilePrice.toLocaleString()} DA
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            {deliveryType === "domicile" ? "Adresse de Livraison Complète" : "Point de Relais / Adresse"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="text-base sm:text-lg min-h-[80px] sm:min-h-[100px]"
                              placeholder={deliveryType === "domicile" ? "Rue, Quartier, Ville..." : "Bureau de livraison le plus proche ou votre adresse..."}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>

                      {/* Price summary */}
                      <div className="bg-[#001D3D] text-white p-4 sm:p-6 md:p-8 rounded-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                          <div className="w-full sm:w-auto space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between sm:justify-start sm:gap-8 text-white/70 text-sm sm:text-base">
                              <span>Produit :</span> <span className="text-white font-bold">{productTotal.toLocaleString()} DA</span>
                            </div>
                            {selectedWilayaCode && (
                              <div className="flex justify-between sm:justify-start sm:gap-8 text-white/70 text-sm sm:text-base">
                                <span>Livraison ({deliveryType === "domicile" ? "Domicile" : "Stop Desk"}) :</span>
                                <span className="text-secondary font-bold">{deliveryCost === 0 ? "Gratuit" : `${deliveryCost.toLocaleString()} DA`}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/20 pt-3 sm:pt-0">
                            <span className="block text-xs sm:text-sm text-secondary font-bold tracking-widest uppercase mb-1">Total à Payer</span>
                            <span className="font-display text-3xl sm:text-5xl">{orderTotal.toLocaleString()} DA</span>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" size="lg" disabled={createOrder.isPending} className="w-full h-14 sm:h-16 text-base sm:text-xl font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90 hover-elevate">
                        {createOrder.isPending ? "Traitement..." : "Confirmer la Commande"}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground -mt-2">Paiement à la livraison — Aucun prépaiement requis</p>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-2xl sm:text-3xl text-primary mb-2">Rupture de Stock</h2>
              <p className="text-sm sm:text-lg text-muted-foreground">Ce produit est actuellement indisponible. Veuillez réessayer plus tard.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Mobile Bottom CTA ── */}
      {product.inStock && !orderSuccess && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-3 sm:hidden">
          <Button onClick={scrollToOrder} size="lg" className="w-full h-12 text-base font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Commander — {product.price.toLocaleString()} DA
          </Button>
        </div>
      )}
    </PublicLayout>
  );
}

