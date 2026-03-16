import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ShieldCheck, Star, Tag, CheckCircle2, ArrowRight } from "lucide-react";
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
  const [searched, setSearched] = useState(false);

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
    { query: { enabled: searched && !!versionId, retry: false } }
  );

  const resetFromCategory = () => {
    setBrandId(""); setModelId(""); setVersionId(""); setSearched(false);
  };
  const resetFromBrand = () => {
    setModelId(""); setVersionId(""); setSearched(false);
  };
  const resetFromModel = () => {
    setVersionId(""); setSearched(false);
  };

  const handleFindOil = () => {
    if (versionId) {
      setSearched(true);
    }
  };

  // Fallback category labels when API is not available
  const defaultCategories = [
    { id: "car", name: "Voiture" },
    { id: "moto", name: "Moto" },
    { id: "truck", name: "Camion" },
  ];
  const displayCategories = categories?.length ? categories : defaultCategories;

  return (
    <div className="w-full max-w-6xl mx-auto mt-10">
      <div className="bg-[#001D3D]/90 backdrop-blur-xl border-2 border-secondary rounded-xl shadow-2xl overflow-hidden">
        {/* Filter Row */}
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* 1. Vehicle Type */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                1. Type de Véhicule
              </label>
              <div className="flex h-11 rounded-md overflow-hidden border border-white/20">
                {displayCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategoryId(cat.id.toString()); resetFromCategory(); }}
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
            </div>

            {/* 2. Brand */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                2. Marque
              </label>
              <Select 
                disabled={!categoryId} 
                value={brandId} 
                onValueChange={(val) => { setBrandId(val); resetFromBrand(); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={brandsLoading ? "Chargement..." : "Sélectionner la Marque"} />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Model */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                3. Modèle
              </label>
              <Select 
                disabled={!brandId} 
                value={modelId} 
                onValueChange={(val) => { setModelId(val); resetFromModel(); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={modelsLoading ? "Chargement..." : "Sélectionner le Modèle"} />
                </SelectTrigger>
                <SelectContent>
                  {models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Engine / Version */}
            <div>
              <label className="text-secondary/80 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 block">
                4. Type de Moteur
              </label>
              <Select 
                disabled={!modelId} 
                value={versionId} 
                onValueChange={(val) => { setVersionId(val); setSearched(false); }}
              >
                <SelectTrigger className="bg-primary/80 border-white/20 text-white h-11 rounded-md text-sm font-medium [&>svg]:text-white/60">
                  <SelectValue placeholder={versionsLoading ? "Chargement..." : "Moteur"} />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* FIND MY OIL Button */}
        <button
          onClick={handleFindOil}
          disabled={!versionId}
          className="w-full bg-secondary hover:bg-yellow-400 disabled:bg-secondary/50 disabled:cursor-not-allowed text-primary font-display text-2xl md:text-3xl tracking-wider py-4 flex items-center justify-center gap-3 transition-colors duration-200"
        >
          TROUVER MON HUILE <ArrowRight className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>

      {/* Result Area — slides down below the filter box */}
      <AnimatePresence>
        {searched && versionId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            {recommendLoading ? (
              <div className="h-28 flex items-center justify-center bg-[#001D3D]/80 backdrop-blur-xl rounded-xl border-2 border-secondary/40">
                <span className="text-secondary animate-pulse font-display text-xl tracking-wider">Analyse des spécifications moteur...</span>
              </div>
            ) : recommendedProduct ? (
              <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 shadow-xl border-2 border-secondary">
                <div className="w-28 h-28 bg-gray-100 rounded-lg p-2 flex-shrink-0">
                  <img 
                    src={recommendedProduct.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=200&h=200&fit=crop"} 
                    alt={recommendedProduct.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-bold text-xs uppercase tracking-widest">Correspondance Parfaite</span>
                  </div>
                  <h3 className="font-display text-3xl text-primary leading-none mb-2">{recommendedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{recommendedProduct.description?.substring(0, 100)}...</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <span className="font-display text-3xl text-primary font-bold">
                      {recommendedProduct.price?.toLocaleString()} <span className="text-lg text-muted-foreground">DA</span>
                    </span>
                    <Button asChild size="lg" variant="secondary" className="font-display text-xl tracking-wider w-full sm:w-auto h-12">
                      <Link href={`/shop/${recommendedProduct.slug}`}>Acheter</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-[#001D3D]/80 backdrop-blur-xl rounded-xl border border-white/20 text-white/80 font-medium">
                Aucune correspondance trouvée. Contactez-nous pour une recommandation.
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
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-primary">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Huile moteur versée dans un moteur" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-[#001D3D]/80 to-black/50 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 drop-shadow-lg leading-[0.9]">
              Trouvez l'<span className="text-secondary">Huile</span> Parfaite<br/>Pour Votre Véhicule
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              Sélectionnez votre véhicule et nous vous recommanderons le produit idéal pour protéger votre moteur.
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
              { icon: Truck, title: "Livraison Rapide", text: "Livraison rapide et fiable vers les 58 wilayas d'Algérie." },
              { icon: ShieldCheck, title: "100% Authentique", text: "Uniquement des huiles moteur certifiées de marques reconnues." },
              { icon: Star, title: "Correspondance Expert", text: "Notre filtre véhicule vous trouve l'huile exacte qu'il vous faut." },
              { icon: Tag, title: "Meilleurs Prix", text: "Des prix compétitifs dans toute l'Algérie." },
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
            <h2 className="font-display text-5xl text-primary mb-4">Produits Vedettes</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center">
            <Button asChild size="lg" variant="default" className="font-display text-xl px-12 h-14 tracking-wider">
              <Link href="/shop">Voir Tous les Produits</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-20">
            <h2 className="font-display text-5xl text-primary mb-4">Comment Ça Marche</h2>
            <div className="w-24 h-1.5 bg-secondary rounded-full"></div>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-gray-200 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { num: "01", title: "Sélectionnez Votre Véhicule", text: "Utilisez le filtre intelligent pour choisir la marque, le modèle et le type de moteur." },
                { num: "02", title: "Obtenez une Recommandation", text: "Notre système vous montre instantanément le produit idéal pour votre véhicule." },
                { num: "03", title: "Commandez et Recevez", text: "Remplissez le formulaire de commande. Livraison contre remboursement vers les 58 wilayas." },
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

      {/* Our Reference — seamless infinite scrolling logos */}
      <section className="py-16 bg-primary border-y-4 border-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-10">
          <h3 className="font-display text-3xl text-secondary tracking-widest">Nos Références</h3>
        </div>
        {/* 4 identical copies → animation moves -25% (= 1 copy width) per cycle.
            Using 4 copies guarantees the repeat is always off-screen on any monitor width. */}
        <div className="relative w-full overflow-hidden">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" style={{ willChange: 'transform' }}>
            {[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
              11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29].map((n, i) => (
              /* Fixed-width container ensures -25% is always exactly one copy wide */
              <div key={i} className="flex-shrink-0 mx-4 w-32 h-28 bg-white rounded-lg p-2 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}our referance/${n}.png`}
                  alt={`Référence ${n}`}
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
              title="Emplacement PetroWest"
            />
          </div>
          <div className="p-12 lg:p-20 flex flex-col justify-center">
            <h2 className="font-display text-5xl text-secondary mb-8">Visitez Notre Boutique</h2>
            <div className="space-y-6 text-lg text-gray-300">
              <div>
                <strong className="block text-white mb-2">Adresse :</strong>
                Cité Trouville rue n°01 N381<br/>Arzew – Oran, Algérie 31200
              </div>
              <div>
                <strong className="block text-white mb-2">Appelez-nous :</strong>
                <div className="space-y-1">
                  <a href="tel:+213797930554" className="block font-display text-3xl text-secondary hover:text-white transition-colors">+213 797 93 05 54</a>
                  <a href="tel:+213541035196" className="block font-display text-3xl text-secondary hover:text-white transition-colors">+213 541 03 51 96</a>
                </div>
              </div>
              <div>
                <strong className="block text-white mb-2">E-mail :</strong>
                <a href="mailto:contact@petrowest.dz" className="text-secondary hover:text-white transition-colors font-medium">contact@petrowest.dz</a>
              </div>
              <div>
                <strong className="block text-white mb-3">Suivez-nous :</strong>
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
