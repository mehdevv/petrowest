import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ShieldCheck, Star, Tag, CheckCircle2, ArrowRight, Building2, Send, FileText, Loader2, ChevronDown } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useListVehicleCategories, 
  useListVehicleBrands, 
  useListVehicleModels, 
  useListVehicleVersions,
  useListVehicleYears,
  useGetVehicleRecommendation,
  useListProducts,
  useCreateB2BMessage,
} from "@workspace/api-client-react";

const CAR_LOGOS_BASE = "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos";

function brandLogoUrl(name: string, customUrl?: string | null) {
  if (customUrl) return customUrl;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${CAR_LOGOS_BASE}/thumb/${slug}.png`;
}

function VehicleFilter() {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");
  const [yearId, setYearId] = useState<string>("");
  const [searched, setSearched] = useState(false);

  const { data: categories, isPending: categoriesPending } = useListVehicleCategories();
  const { data: brands, isLoading: brandsLoading } = useListVehicleBrands(
    { vehicleCategoryId: Number(categoryId) }, 
    { query: { enabled: !!categoryId } }
  );
  const { data: models, isLoading: modelsLoading } = useListVehicleModels(
    { vehicleBrandId: Number(brandId) }, 
    { query: { enabled: !!brandId } }
  );
  const { data: versions, isLoading: versionsLoading } = useListVehicleVersions(
    { vehicleModelId: Number(modelId) }, 
    { query: { enabled: !!modelId } }
  );
  const { data: years, isLoading: yearsLoading } = useListVehicleYears(
    { vehicleVersionId: Number(versionId) },
    { query: { enabled: !!versionId } }
  );
  const { data: recommendedProducts, isLoading: recommendLoading } = useGetVehicleRecommendation(
    { vehicleYearId: Number(yearId) }, 
    { query: { enabled: searched && !!yearId, retry: false } }
  );

  const resetFromCategory = () => {
    setBrandId(""); setModelId(""); setVersionId(""); setYearId(""); setSearched(false);
  };
  const resetFromBrand = () => {
    setModelId(""); setVersionId(""); setYearId(""); setSearched(false);
  };
  const resetFromModel = () => {
    setVersionId(""); setYearId(""); setSearched(false);
  };
  const resetFromVersion = () => {
    setYearId(""); setSearched(false);
  };

  const handleFindOil = () => {
    if (yearId) {
      setSearched(true);
    }
  };

  const selectedBrand = brands?.find(b => b.id.toString() === brandId);

  const categoryList = categories ?? [];
  const useCategoryDropdown = categoryList.length > 3;

  return (
    <div className="w-full max-w-6xl mx-auto mt-10">
      <div className="bg-[#001D3D]/90 backdrop-blur-xl border-2 border-secondary rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5">
          {/* Row 1: Category + Brand with logo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-4">
            {/* 1. Vehicle Type */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                {t("home.vehicleType")}
              </label>
              {categoriesPending ? (
                <div
                  className="flex h-11 w-full cursor-default items-center justify-between whitespace-nowrap rounded-md border border-white/20 bg-primary/80 px-3 py-2 text-sm font-medium shadow-sm select-none [&>span]:line-clamp-1 animate-pulse"
                  aria-busy="true"
                  aria-label={t("product.loading")}
                >
                  <span className="line-clamp-1 text-white/45">{t("home.selectVehicleType")}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-white/60" />
                </div>
              ) : categoryList.length === 0 ? (
                <div
                  className="flex h-11 w-full cursor-not-allowed items-center justify-between whitespace-nowrap rounded-md border border-white/20 bg-primary/80 px-3 py-2 text-sm font-medium opacity-60 shadow-sm [&>span]:line-clamp-1"
                  aria-disabled
                >
                  <span className="line-clamp-1 text-white/50">{t("home.selectVehicleType")}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-white/60" />
                </div>
              ) : useCategoryDropdown ? (
                <Select
                  value={categoryId || undefined}
                  onValueChange={(val) => {
                    setCategoryId(val);
                    resetFromCategory();
                  }}
                >
                  <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                    <SelectValue placeholder={t("home.selectVehicleType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryList.map((cat) => (
                      <SelectItem key={String(cat.id)} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-11 rounded-md overflow-hidden border border-white/20">
                  {categoryList.map((cat, i) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id.toString());
                        resetFromCategory();
                      }}
                      className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        i > 0 ? "border-l border-white/20" : ""
                      } ${
                        categoryId === cat.id.toString()
                          ? "bg-secondary text-primary"
                          : "bg-white/5 text-white hover:bg-white/15"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Brand with logo */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                {t("home.vehicleBrand")}
              </label>
              <Select 
                disabled={!categoryId} 
                value={brandId} 
                onValueChange={(val) => { setBrandId(val); resetFromBrand(); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={brandsLoading ? t("product.loading") : t("home.selectBrand")} />
                </SelectTrigger>
                  <SelectContent>
                    {brands?.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <span className="flex items-center gap-2">
                          <img
                            src={brandLogoUrl(b.name, b.logoUrl)}
                            alt=""
                            className="w-5 h-5 object-contain inline-block"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          {b.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>

          {/* Row 2: Model + Engine + Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* 3. Model */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                {t("home.vehicleModel")}
              </label>
              <Select 
                disabled={!brandId} 
                value={modelId} 
                onValueChange={(val) => { setModelId(val); resetFromModel(); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={modelsLoading ? t("product.loading") : t("home.selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Engine / Version */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                {t("home.vehicleEngine")}
              </label>
              <Select 
                disabled={!modelId} 
                value={versionId} 
                onValueChange={(val) => { setVersionId(val); resetFromVersion(); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={versionsLoading ? t("product.loading") : t("home.enginePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 5. Year */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                {t("home.vehicleYear")}
              </label>
              <Select 
                disabled={!versionId} 
                value={yearId} 
                onValueChange={(val) => { setYearId(val); setSearched(false); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={yearsLoading ? t("product.loading") : t("home.yearPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {years?.map(y => <SelectItem key={y.id} value={y.id.toString()}>{y.year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* FIND MY OIL Button */}
        <button
          onClick={handleFindOil}
          disabled={!yearId}
          className="w-full bg-secondary hover:bg-yellow-400 disabled:bg-secondary/50 disabled:cursor-not-allowed text-primary font-display text-2xl md:text-3xl tracking-wider py-4 flex items-center justify-center gap-3 transition-colors duration-200"
        >
          {t("home.findOil")} <ArrowRight className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>

      {/* Result Area */}
      <AnimatePresence>
        {searched && yearId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            {recommendLoading ? (
              <div className="h-28 flex items-center justify-center bg-[#001D3D]/80 backdrop-blur-xl rounded-xl border-2 border-secondary/40">
                <span className="text-secondary animate-pulse font-display text-xl tracking-wider">{t("home.analyzing")}</span>
              </div>
            ) : recommendedProducts && recommendedProducts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-white font-bold text-sm uppercase tracking-widest">
                    {recommendedProducts.length > 1
                      ? t("home.recommendedOilsMany", { count: recommendedProducts.length })
                      : t("home.recommendedOilsOne", { count: recommendedProducts.length })}
                  </span>
                </div>
                {recommendedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 shadow-xl border-2 border-secondary">
                    <div className="w-28 h-28 bg-gray-100 rounded-lg p-2 flex-shrink-0">
                      <img 
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=200&h=200&fit=crop"} 
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-bold text-xs uppercase tracking-widest">{t("home.perfectMatch")}</span>
                      </div>
                      <h3 className="font-display text-3xl text-primary leading-none mb-2">{product.name}</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <span className="font-display text-3xl text-primary font-bold">
                          {product.price?.toLocaleString()} <span className="text-lg text-muted-foreground">DA</span>
                        </span>
                        <Button asChild size="lg" variant="secondary" className="font-display text-xl tracking-wider w-full sm:w-auto h-12">
                          <Link href={`/shop/${product.slug}`}>{t("nav.buy")}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-[#001D3D]/80 backdrop-blur-xl rounded-xl border border-white/20 text-white/80 font-medium">
                {t("home.noMatch")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function B2BSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const servicePdfUrl = `${import.meta.env.BASE_URL}PETROWEST.pdf`;
  const [form, setForm] = useState({ company: "", phone: "", email: "", message: "" });
  const createMessage = useCreateB2BMessage({
    mutation: {
      onSuccess: () => {
        toast({ title: t("home.toastOkTitle"), description: t("home.toastOkDesc") });
        setForm({ company: "", phone: "", email: "", message: "" });
      },
      onError: () => {
        toast({ title: t("home.toastErrTitle"), description: t("home.toastErrDesc"), variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.phone || !form.email || !form.message) return;
    createMessage.mutate({ data: form });
  };

  return (
    <section className="relative py-24 bg-[#EBEBEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-secondary" />
            <h2 className="font-display text-5xl text-primary">{t("home.b2bTitle")}</h2>
          </div>
          <div className="w-24 h-1.5 bg-secondary rounded-full mb-4"></div>
          <p className="text-muted-foreground text-lg text-center max-w-2xl">
            {t("home.b2bSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Left — Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-border p-8 lg:p-10 flex flex-col">
            <h3 className="font-display text-3xl text-primary mb-6">{t("home.b2bFormTitle")}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
              <div>
                <label className="text-sm font-semibold text-primary mb-1.5 block">{t("home.companyName")}</label>
                <Input
                  placeholder={t("home.companyPlaceholder")}
                  value={form.company}
                  onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                  required
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-primary mb-1.5 block">{t("home.phoneLabel")}</label>
                  <Input
                    type="tel"
                    placeholder={t("home.phonePlaceholder")}
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary mb-1.5 block">{t("home.emailField")}</label>
                  <Input
                    type="email"
                    placeholder={t("home.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-semibold text-primary mb-1.5 block">{t("home.messageLabel")}</label>
                <Textarea
                  placeholder={t("home.messagePlaceholder")}
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="flex-1 min-h-[120px] resize-none"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={createMessage.isPending}
                className="font-display text-xl tracking-wider h-14 w-full"
              >
                {createMessage.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t("home.sending")}</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> {t("home.sendMessage")}</>
                )}
              </Button>
            </form>
          </div>

          {/* Right — Service offer PDF (embedded in page) */}
          <div className="bg-white rounded-2xl shadow-xl border border-border p-6 lg:p-8 flex flex-col gap-4 min-h-0">
            <div className="flex items-start gap-3 shrink-0">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-2xl text-primary leading-tight">{t("home.techSheetTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.techSheetSubtitle")}</p>
              </div>
            </div>
            <div
              className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-gray-100"
              style={{ height: "min(70vh, 640px)" }}
            >
              <iframe
                src={servicePdfUrl}
                className="h-full w-full border-0"
                title={t("home.techSheetIframe")}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "").startsWith("ar");
  const { data: featuredData } = useListProducts({ featured: true, limit: 6 });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-primary">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Huile moteur versée dans un moteur" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-[#001D3D]/80 to-black/50 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 origin-top scale-[0.9]">
          <div className="text-center max-w-3xl mx-auto mb-8">
            {isArabic ? (
              <h1 className="font-display text-[3.1rem] md:text-[5.3rem] lg:text-[6.4rem] text-white mb-10 md:mb-12 drop-shadow-lg leading-[1.02] tracking-normal">
                <span>{t("home.heroTitle1")}</span>
                <span className="text-secondary">{t("home.heroTitleOil")}</span>
                <span>{t("home.heroTitle2")} {t("home.heroTitleBreak")}</span>
              </h1>
            ) : (
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 drop-shadow-lg leading-[0.9]">
                {t("home.heroTitle1")}
                <span className="text-secondary">{t("home.heroTitleOil")}</span>
                {t("home.heroTitle2")}
                <br />
                {t("home.heroTitleBreak")}
              </h1>
            )}
            <p className={`text-xl md:text-2xl text-white/90 font-medium ${isArabic ? "mt-0" : ""}`}>
              {t("home.heroSubtitle")}
            </p>
          </div>
          
          <VehicleFilter />
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: t("home.features.deliveryTitle"), text: t("home.features.deliveryText") },
              { icon: ShieldCheck, title: t("home.features.authenticTitle"), text: t("home.features.authenticText") },
              { icon: Star, title: t("home.features.matchTitle"), text: t("home.features.matchText") },
              { icon: Tag, title: t("home.features.priceTitle"), text: t("home.features.priceText") },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-border hover:border-secondary hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl group">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-display text-2xl text-primary mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-[#EBEBEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-16">
            <h2 className="font-display text-5xl text-primary mb-4">{t("home.featured")}</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center">
            <Button asChild size="lg" variant="default" className="font-display text-xl px-12 h-14 tracking-wider">
              <Link href="/shop">{t("home.seeAllProducts")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-20">
            <h2 className="font-display text-5xl text-primary mb-4">{t("home.howItWorks")}</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-gray-200 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { num: "01", title: t("home.step1Title"), text: t("home.step1Text") },
                { num: "02", title: t("home.step2Title"), text: t("home.step2Text") },
                { num: "03", title: t("home.step3Title"), text: t("home.step3Text") },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-secondary text-primary border-8 border-white flex items-center justify-center font-display text-4xl font-bold mb-8 shadow-xl">
                    {step.num}
                  </div>
                  <h3 className="font-display text-3xl text-primary mb-4">{step.title}</h3>
                  <p className="text-muted-foreground text-lg px-4">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <B2BSection />

      {/* Our Reference — seamless infinite scrolling logos */}
      <section className="py-16 bg-primary border-y-4 border-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-10">
          <h3 className="font-display text-3xl text-secondary tracking-widest">{t("home.references")}</h3>
        </div>
        {/* 4 identical copies → animation moves -25% (= 1 copy width) per cycle.
            Using 4 copies guarantees the repeat is always off-screen on any monitor width. */}
        <div className="relative w-full overflow-hidden">
          <div
            className={`flex w-max ${isArabic ? "flex-row-reverse animate-marquee-rtl" : "animate-marquee"} hover:[animation-play-state:paused]`}
            style={{ willChange: "transform" }}
          >
            {[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29].map((n, i) => (
              /* Fixed-width container ensures -25% is always exactly one copy wide */
              <div key={i} className="flex-shrink-0 mx-4 w-40 md:w-44 h-28 bg-white rounded-lg p-3 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}our referance/${n}.png`}
                  alt={t("home.referenceAlt", { n })}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-[#001D3D] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="h-[400px] lg:h-auto w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3234.0019023180816!2d-0.31686519999999996!3d35.84895689999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd7e75670232bffb%3A0xc50a8fcd00df45a0!2sPetroWest!5e0!3m2!1sen!2sdz!4v1773623330965!5m2!1sen!2sdz"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("home.mapTitle")}
            />
          </div>
          <div className="p-12 lg:p-20 flex flex-col justify-center">
            <h2 className="font-display text-5xl text-secondary mb-8">{t("home.visitTitle")}</h2>
            <div className="space-y-6 text-lg text-gray-300">
              <div>
                <strong className="block text-white mb-2">{t("home.addressLabel")}</strong>
                Cité Trouville rue n°01 N381<br/>Arzew – Oran, Algérie 31200
              </div>
              <div>
                <strong className="block text-white mb-2">{t("home.callLabel")}</strong>
                <div className="space-y-1">
                  <a href="tel:+213797930554" className="block font-display text-3xl text-secondary hover:text-white transition-colors">+213 797 93 05 54</a>
                  <a href="tel:+213541035196" className="block font-display text-3xl text-secondary hover:text-white transition-colors">+213 541 03 51 96</a>
                </div>
              </div>
              <div>
                <strong className="block text-white mb-2">{t("home.emailLabel")}</strong>
                <a href="mailto:contact@petrowest.dz" className="text-secondary hover:text-white transition-colors font-medium">contact@petrowest.dz</a>
              </div>
              <div>
                <strong className="block text-white mb-3">{t("home.followLabel")}</strong>
                <div className="flex gap-3">
                  <a href="https://www.facebook.com/petrowest.dz" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors" title="Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/petrowestdz" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors" title="Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://www.youtube.com/@petrowest7562" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors" title="YouTube">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
