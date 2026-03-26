import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { SpecRichTextSegments } from "@/components/admin/SpecRichTextSegments";
import { ALGERIA_WILAYAS } from "@/lib/constants";
import { CheckCircle2, ShieldCheck, Truck, Package, ChevronLeft, ChevronRight, ZoomIn, X, ShoppingCart, Building2, Home, FileText, Download } from "lucide-react";

type DeliveryType = "stopdesk" | "domicile";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    __PW_FB_PIXELS?: Record<string, true>;
  }
}

function ensureMetaPixel(pixelId: string): boolean {
  if (typeof window === "undefined" || !pixelId.trim()) return false;

  if (!window.fbq) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    const fbqStub = function (...args: unknown[]) {
      const q = fbqStub as any;
      q.queue = q.queue || [];
      q.queue.push(args);
    } as any;
    fbqStub.loaded = true;
    fbqStub.version = "2.0";
    fbqStub.queue = [];
    window.fbq = fbqStub;
    window._fbq = fbqStub;
  }

  window.__PW_FB_PIXELS = window.__PW_FB_PIXELS || {};
  if (!window.__PW_FB_PIXELS[pixelId]) {
    window.fbq?.("init", pixelId);
    window.__PW_FB_PIXELS[pixelId] = true;
  }
  return true;
}

export default function ProductDetails() {
  const { t } = useTranslation();
  const orderSchema = useMemo(
    () =>
      z.object({
        customerName: z.string().min(2, t("product.errors.name")),
        phone: z.string().min(8, t("product.errors.phone")),
        wilayaCode: z.string().min(1, t("product.errors.wilaya")),
        address: z.string().min(5, t("product.errors.address")),
        quantity: z.coerce.number().min(1),
      }),
    [t]
  );

  const [, params] = useRoute("/shop/:slug");
  const slug = params?.slug || "";
  
  const { data: product, isLoading, isError } = useGetProduct(slug, { query: { retry: false } });
  const [activeImage, setActiveImage] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("stopdesk");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema) as any,
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

  if (isLoading) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">{t("product.loading")}</div></PublicLayout>;
  if (isError || !product) return <PublicLayout><div className="pt-32 min-h-screen text-center text-xl">{t("product.notFound")}</div></PublicLayout>;

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
    if (product.metaPixelId && ensureMetaPixel(product.metaPixelId)) {
      window.fbq?.("track", "Purchase", {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: "product",
        currency: "DZD",
        value: product.price,
      });
    }
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

      {/* ── PDF viewer: compact in-page popup (iframe, not a new browser tab) ── */}
      <AnimatePresence>
        {pdfViewerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setPdfViewerUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative flex w-full max-w-[min(96vw,42rem)] sm:max-w-[min(92vw,52rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
              style={{ height: "min(78vh, 640px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <h3 className="font-display truncate text-sm font-semibold text-primary sm:text-base">{pdfViewerTitle}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={pdfViewerUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-gray-200 hover:text-primary"
                    aria-label={t("product.downloadPdfShort")}
                    title={t("product.downloadPdfShort")}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-gray-200 hover:text-gray-900"
                    onClick={() => setPdfViewerUrl(null)}
                    aria-label={t("product.closePdf")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 bg-gray-100">
                <iframe src={pdfViewerUrl} className="h-full w-full border-0" title={pdfViewerTitle} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#EBEBEB] min-h-screen pt-20 sm:pt-24 pb-28 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-8">
          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-4 sm:mb-8 truncate">
            {t("product.breadcrumbPrefix", { category: product.categoryName || t("product.oilFallback") })}<span className="text-primary">{product.name}</span>
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
                  <button onClick={() => setLightboxOpen(true)} className="absolute top-3 right-3 bg-white/80 hover:bg-white text-primary border border-border rounded-full p-2 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-md" title={t("product.zoom")}>
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
                          <img src={img} className="w-full h-full object-contain" alt={t("product.viewN", { n: i + 1 })} />
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
                  {!product.inStock && <Badge variant="destructive" className="text-xs">{t("product.outOfStock")}</Badge>}
                </div>
                <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl text-primary mb-1 sm:mb-2 leading-tight">{product.name}</h1>
                <p className="text-base sm:text-xl text-muted-foreground font-bold uppercase tracking-wider mb-4 sm:mb-6">{product.brandName}</p>
                <div className="font-display text-3xl sm:text-5xl font-bold text-primary mb-5 sm:mb-8 border-b pb-5 sm:pb-8">
                  {product.price.toLocaleString()} <span className="text-lg sm:text-2xl text-muted-foreground">DA</span>
                </div>
                {(() => {
                  const apiRows =
                    product.apiAceaRows && product.apiAceaRows.length > 0
                      ? product.apiAceaRows
                      : product.apiStandard
                        ? [{ name: "", specification: product.apiStandard }]
                        : [];
                  const homoRows = product.homologationRows ?? [];
                  const hasApi = apiRows.some((r) => (r.name || r.specification || "").trim());
                  const hasHomo = homoRows.some((r) => (r.name || r.specification || "").trim());
                  if (!hasApi && !hasHomo) return null;

                  const renderSpecLines = (
                    rows: { name?: string | null; specification?: string | null }[]
                  ) => {
                    const filtered = rows.filter((r) => (r.name || r.specification || "").trim());
                    return (
                      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                        {filtered.map((r, i) => {
                          const name = r.name?.trim() ?? "";
                          const spec = r.specification?.trim() ?? "";
                          return (
                            <p
                              key={i}
                              className="min-w-0 max-w-full break-words text-[11px] sm:text-sm md:text-base leading-relaxed [overflow-wrap:anywhere]"
                            >
                              {name ? (
                                <span className="font-semibold text-primary">
                                  <SpecRichTextSegments text={name} />
                                </span>
                              ) : null}
                              {name && spec ? (
                                <span className="ms-0.5 text-muted-foreground [overflow-wrap:anywhere]">
                                  <SpecRichTextSegments text={spec} />
                                </span>
                              ) : spec ? (
                                <span
                                  className={
                                    name
                                      ? "text-muted-foreground"
                                      : "text-primary font-medium"
                                  }
                                >
                                  <SpecRichTextSegments text={spec} />
                                </span>
                              ) : !name ? (
                                "—"
                              ) : null}
                            </p>
                          );
                        })}
                      </div>
                    );
                  };

                  return (
                    <div className="rounded-xl border bg-white p-3 sm:p-5 mb-5 sm:mb-8">
                      <div
                        className={
                          hasApi && hasHomo
                            ? "grid grid-cols-2 gap-1.5 sm:gap-4 sm:gap-x-5"
                            : "grid grid-cols-1"
                        }
                      >
                        {hasApi && (
                          <div className="space-y-0.5 sm:space-y-1 min-w-0 break-words">
                            <h4 className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary leading-tight">
                              {t("product.specificationsColumn")}
                            </h4>
                            <div>{renderSpecLines(apiRows)}</div>
                          </div>
                        )}
                        {hasHomo && (
                          <div className="space-y-0.5 sm:space-y-1 min-w-0 break-words">
                            <h4 className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary leading-tight">
                              {t("product.tableHomologation")}
                            </h4>
                            <div>{renderSpecLines(homoRows)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {(product.securitySheetUrl || product.technicalSheetUrl) && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5 sm:mb-8">
                    {product.securitySheetUrl && (
                      <div className="flex w-full min-w-0 flex-1 rounded-xl border-2 border-red-200 overflow-hidden bg-red-50/50 shadow-sm sm:min-w-[280px] sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfViewerUrl(product.securitySheetUrl!);
                            setPdfViewerTitle(t("product.safetySheet"));
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-800 transition-colors hover:bg-red-100/80"
                        >
                          <ShieldCheck className="h-5 w-5 shrink-0" />
                          <span className="truncate">{t("product.safetySheet")}</span>
                        </button>
                        <a
                          href={product.securitySheetUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center justify-center border-s-2 border-red-200 bg-white px-3 text-red-700 transition-colors hover:bg-red-50"
                          aria-label={t("product.downloadSafetySheet")}
                          title={t("product.downloadSafetySheet")}
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                    {product.technicalSheetUrl && (
                      <div className="flex w-full min-w-0 flex-1 rounded-xl border-2 border-blue-200 overflow-hidden bg-blue-50/50 shadow-sm sm:min-w-[280px] sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfViewerUrl(product.technicalSheetUrl!);
                            setPdfViewerTitle(t("product.technicalSheet"));
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100/80"
                        >
                          <FileText className="h-5 w-5 shrink-0" />
                          <span className="truncate">{t("product.technicalSheet")}</span>
                        </button>
                        <a
                          href={product.technicalSheetUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center justify-center border-s-2 border-blue-200 bg-white px-3 text-blue-700 transition-colors hover:bg-blue-50"
                          aria-label={t("product.downloadTechnicalSheet")}
                          title={t("product.downloadTechnicalSheet")}
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:gap-y-4 sm:gap-x-8 mb-5 sm:mb-8 bg-gray-50 p-3 sm:p-6 rounded-xl border">
                  <div><span className="text-muted-foreground block text-[10px] sm:text-sm mb-0.5">{t("product.volume")}</span><strong className="text-primary text-xs sm:text-lg">{product.volume}</strong></div>
                  <div><span className="text-muted-foreground block text-[10px] sm:text-sm mb-0.5">{t("product.viscosity")}</span><strong className="text-primary text-xs sm:text-lg">{product.viscosityGrade || t("product.na")}</strong></div>
                </div>
                <div className="space-y-2 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-primary"><ShieldCheck className="text-secondary w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"/> {t("product.authentic")}</div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-primary"><Truck className="text-secondary w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"/> {t("delivery.coverageProduct")}</div>
                </div>
                {product.inStock && (
                  <Button onClick={scrollToOrder} size="lg" className="w-full mt-6 h-14 text-lg font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90 sm:hidden">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t("product.orderCta", { price: product.price.toLocaleString() })}
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
                  <h2 className="font-display text-2xl sm:text-4xl text-primary mb-2">{t("product.orderNow")}</h2>
                  <p className="text-sm sm:text-xl text-muted-foreground">
                    <span className="text-secondary font-bold bg-[#001D3D] px-2 sm:px-3 py-1 rounded text-xs sm:text-base">{t("product.codBadge")}</span>
                    <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">{t("product.codHint")}</span>
                  </p>
                </div>

                {orderSuccess ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5 sm:p-8 text-center animate-in zoom-in duration-500">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl text-green-700 mb-2">{t("product.orderReceived")}</h3>
                    <p className="text-sm sm:text-lg text-green-800 mb-6 sm:mb-8">{t("product.thankYou", { name: form.getValues("customerName") })}</p>
                    <div className="bg-white p-4 sm:p-6 rounded-lg border text-left max-w-sm mx-auto text-sm sm:text-base">
                      <h4 className="font-bold border-b pb-2 mb-3 sm:mb-4 text-primary">{t("product.orderSummary")}</h4>
                      <div className="flex justify-between mb-2"><span>{t("product.productLabel")}</span><span className="font-bold">{product.name}</span></div>
                      <div className="flex justify-between mb-2"><span>{t("product.qtyLabel")}</span><span className="font-bold">{form.getValues('quantity')}</span></div>
                      <div className="flex justify-between mb-2"><span>{t("product.deliveryLabel")}</span><span className="font-bold">{deliveryType === "domicile" ? t("product.homeDelivery") : t("product.stopDesk")}</span></div>
                      <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t mt-3 sm:mt-4 text-primary"><span>{t("product.totalPay")}</span><span>{orderTotal.toLocaleString()} DA</span></div>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("product.fullName")}</FormLabel>
                            <FormControl><Input className="h-12 sm:h-14 text-base sm:text-lg" placeholder={t("product.namePlaceholder")} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("product.phone")}</FormLabel>
                            <FormControl><Input type="tel" className="h-12 sm:h-14 text-base sm:text-lg" placeholder={t("product.phonePh")} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <FormField control={form.control} name="wilayaCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("product.wilaya")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg"><SelectValue placeholder={t("product.wilayaPh")} /></SelectTrigger></FormControl>
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
                            <FormLabel className="text-sm">{t("product.quantity")}</FormLabel>
                            <FormControl><Input type="number" min={1} className="h-12 sm:h-14 text-base sm:text-lg" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>

                      {/* ── Delivery Type Toggle ── */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">{t("product.deliveryType")}</label>
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
                            <span className={`font-bold text-sm sm:text-base ${deliveryType === "stopdesk" ? "text-primary" : "text-gray-600"}`}>{t("product.stopDesk")}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">{t("product.stopDeskHint")}</span>
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
                            <span className={`font-bold text-sm sm:text-base ${deliveryType === "domicile" ? "text-primary" : "text-gray-600"}`}>{t("product.homeDelivery")}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">{t("product.homeDeliveryHint")}</span>
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
                            {deliveryType === "domicile" ? t("product.addrHome") : t("product.addrDesk")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="text-base sm:text-lg min-h-[80px] sm:min-h-[100px]"
                              placeholder={deliveryType === "domicile" ? t("product.addrPhHome") : t("product.addrPhDesk")}
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
                              <span>{t("product.productTotal")}</span> <span className="text-white font-bold">{productTotal.toLocaleString()} DA</span>
                            </div>
                            {selectedWilayaCode && (
                              <div className="flex justify-between sm:justify-start sm:gap-8 text-white/70 text-sm sm:text-base">
                                <span>{t("product.deliveryFee", { type: deliveryType === "domicile" ? t("product.domicile") : t("product.stopDesk") })}</span>
                                <span className="text-secondary font-bold">{deliveryCost === 0 ? t("product.free") : `${deliveryCost.toLocaleString()} DA`}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/20 pt-3 sm:pt-0">
                            <span className="block text-xs sm:text-sm text-secondary font-bold tracking-widest uppercase mb-1">{t("product.totalPay")}</span>
                            <span className="font-display text-3xl sm:text-5xl">{orderTotal.toLocaleString()} DA</span>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" size="lg" disabled={createOrder.isPending} className="w-full h-14 sm:h-16 text-base sm:text-xl font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90 hover-elevate">
                        {createOrder.isPending ? t("product.processing") : t("product.confirmOrder")}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground -mt-2">{t("product.codNote")}</p>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-2xl sm:text-3xl text-primary mb-2">{t("product.outTitle")}</h2>
              <p className="text-sm sm:text-lg text-muted-foreground">{t("product.outDesc")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Mobile Bottom CTA ── */}
      {product.inStock && !orderSuccess && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-3 sm:hidden">
          <Button onClick={scrollToOrder} size="lg" className="w-full h-12 text-base font-display tracking-wider bg-secondary text-primary hover:bg-secondary/90">
            <ShoppingCart className="w-5 h-5 mr-2" />
            {t("product.orderCta", { price: product.price.toLocaleString() })}
          </Button>
        </div>
      )}
    </PublicLayout>
  );
}




