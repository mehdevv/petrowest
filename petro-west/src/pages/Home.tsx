import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ShieldCheck, Star, Tag, CheckCircle2, MapPin } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui-custom/ProductCard";
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
  useGetVehicleRecommendation,
  useListProducts
} from "@workspace/api-client-react";

function VehicleFilter() {
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");

  const { data: categories } = useListVehicleCategories();
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
  const { data: recommendedProduct, isLoading: recommendLoading } = useGetVehicleRecommendation(
    { vehicleVersionId: Number(versionId) }, 
    { query: { enabled: !!versionId, retry: false } }
  );

  const resetFromCategory = () => {
    setBrandId(""); setModelId(""); setVersionId("");
  };
  const resetFromBrand = () => {
    setModelId(""); setVersionId("");
  };
  const resetFromModel = () => {
    setVersionId("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-[#001D3D]/80 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl shadow-2xl">
      {/* Step 1: Categories */}
      <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(cat.id.toString()); resetFromCategory(); }}
              className={`px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                categoryId === cat.id.toString()
                  ? "bg-secondary text-primary shadow-lg shadow-secondary/20 scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Steps 2-4: Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select 
          disabled={!categoryId} 
          value={brandId} 
          onValueChange={(val) => { setBrandId(val); resetFromBrand(); }}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white h-14 rounded-xl text-lg">
            <SelectValue placeholder={brandsLoading ? "Loading..." : "Select Brand"} />
          </SelectTrigger>
          <SelectContent>
            {brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select 
          disabled={!brandId} 
          value={modelId} 
          onValueChange={(val) => { setModelId(val); resetFromModel(); }}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white h-14 rounded-xl text-lg">
            <SelectValue placeholder={modelsLoading ? "Loading..." : "Select Model"} />
          </SelectTrigger>
          <SelectContent>
            {models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select 
          disabled={!modelId} 
          value={versionId} 
          onValueChange={setVersionId}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white h-14 rounded-xl text-lg">
            <SelectValue placeholder={versionsLoading ? "Loading..." : "Select Version/Engine"} />
          </SelectTrigger>
          <SelectContent>
            {versions?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Result Area */}
      <AnimatePresence>
        {versionId && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden mt-6"
          >
            {recommendLoading ? (
              <div className="h-32 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <span className="text-secondary animate-pulse font-display text-xl">Analyzing engine specs...</span>
              </div>
            ) : recommendedProduct ? (
              <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6 shadow-xl border-2 border-secondary">
                <div className="w-32 h-32 bg-gray-100 rounded-lg p-2 flex-shrink-0">
                  <img 
                    src={recommendedProduct.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=200&h=200&fit=crop"} 
                    alt={recommendedProduct.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-bold text-sm uppercase tracking-wide">Perfect Match Found</span>
                  </div>
                  <h3 className="font-display text-3xl text-primary leading-none mb-2">{recommendedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{recommendedProduct.description.substring(0, 100)}...</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <span className="font-display text-3xl text-primary font-bold">
                      {recommendedProduct.price.toLocaleString()} <span className="text-xl text-muted-foreground">DA</span>
                    </span>
                    <Button asChild size="lg" variant="secondary" className="font-display text-xl tracking-wider w-full sm:w-auto h-12">
                      <Link href={`/shop/${recommendedProduct.slug}`}>Buy Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white/70">
                No exact match found. Please contact us for a recommendation.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { data: featuredData } = useListProducts({ featured: true, limit: 6 });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-primary">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Motor oil pouring into engine" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-[#001D3D]/80 to-black/50 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 drop-shadow-lg leading-[0.9]">
              Find the Perfect <span className="text-secondary">Oil</span><br/>For Your Car
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              Select your vehicle and we'll recommend the exact right product to protect your engine.
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
              { icon: Truck, title: "Fast Delivery", text: "Delivered to all 58 wilayas quickly and reliably." },
              { icon: ShieldCheck, title: "100% Genuine", text: "Only certified, authentic engine oils from trusted brands." },
              { icon: Star, title: "Expert Match", text: "Our vehicle filter matches you with the exact right oil." },
              { icon: Tag, title: "Best Prices", text: "Competitive pricing across all of Algeria." },
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
            <h2 className="font-display text-5xl text-primary mb-4">Featured Products</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center">
            <Button asChild size="lg" variant="default" className="font-display text-xl px-12 h-14 tracking-wider">
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-20">
            <h2 className="font-display text-5xl text-primary mb-4">How It Works</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-gray-200 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { num: "01", title: "Select Your Vehicle", text: "Use the smart filter to choose your car brand, model, and engine type." },
                { num: "02", title: "Get Recommendation", text: "Our system instantly shows you the perfect match for your vehicle." },
                { num: "03", title: "Order & Receive", text: "Fill the simple order form. We deliver Cash on Delivery to all 58 wilayas." },
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

      {/* Brands Marquee */}
      <section className="py-16 bg-primary border-y-4 border-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-8">
          <h3 className="font-display text-2xl text-secondary tracking-widest">Premium Brands We Carry</h3>
        </div>
        <div className="flex w-full whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity">
          <div className="animate-marquee inline-block font-display text-6xl text-white/50 tracking-widest gap-16 px-8">
             CASTROL &bull; TOTAL &bull; MOBIL &bull; SHELL &bull; MOTUL &bull; LUKOIL &bull; REPSOL &bull; FUCHS &bull; 
             CASTROL &bull; TOTAL &bull; MOBIL &bull; SHELL &bull; MOTUL &bull; LUKOIL &bull; REPSOL &bull; FUCHS
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-[#001D3D] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="h-[400px] lg:h-auto w-full bg-gray-800">
            {/* landing page map location placeholder */}
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&h=800&fit=crop" alt="Map" className="w-full h-full object-cover opacity-60" />
          </div>
          <div className="p-12 lg:p-24 flex flex-col justify-center">
            <h2 className="font-display text-5xl text-secondary mb-8">Visit Our Shop</h2>
            <div className="space-y-8 text-xl text-gray-300">
              <div>
                <strong className="block text-white mb-2">Address:</strong>
                Industrial Zone, Route Nationale 5<br/>Algiers, Algeria
              </div>
              <div>
                <strong className="block text-white mb-2">Call Us:</strong>
                <a href="tel:+213555000000" className="font-display text-4xl text-secondary hover:text-white transition-colors">+213 555 00 00 00</a>
              </div>
              <div>
                <strong className="block text-white mb-4">Follow Us:</strong>
                <div className="flex gap-4">
                  <a href="#" className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full hover:bg-secondary hover:text-primary transition-colors font-bold">
                    <MapPin className="w-5 h-5" /> @petrowest_dz
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
