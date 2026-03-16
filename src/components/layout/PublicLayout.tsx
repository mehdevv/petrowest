import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListProducts } from "@workspace/api-client-react";

// ─── Navbar search with live dropdown ────────────────────────────────────────
function NavSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch up to 3 matching products
  const { data: results } = useListProducts(
    { search: query, limit: 3 },
    { query: { enabled: query.trim().length >= 2 } }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      setOpen(false);
      setQuery("");
    }
  };

  const goToProduct = (slug: string) => {
    navigate(`/shop/${slug}`);
    setOpen(false);
    setQuery("");
  };

  const products = results?.products ?? [];
  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher des produits..."
            className="pl-9 pr-8 h-9 text-sm w-full rounded-full bg-white/15 border-white/25 text-white placeholder:text-white/50 focus-visible:ring-secondary/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {products.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Aucun produit trouvé
            </div>
          ) : (
            <>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goToProduct(product.slug)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {product.brandName} · {product.volume}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary flex-shrink-0">
                    {product.price.toLocaleString()} DA
                  </div>
                </button>
              ))}
              {/* "See all results" link */}
              <button
                type="button"
                onClick={() => {
                  navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full px-4 py-2 bg-gray-50 text-xs font-semibold text-primary hover:bg-gray-100 transition-colors border-t flex items-center justify-center gap-1"
              >
                <Search className="w-3 h-3" />
                Voir tous les résultats pour «{query}»
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mobile search bar ────────────────────────────────────────────────────────
function MobileNavSearch({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results } = useListProducts(
    { search: query, limit: 3 },
    { query: { enabled: query.trim().length >= 2 } }
  );

  const products = results?.products ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  const goToProduct = (slug: string) => {
    navigate(`/shop/${slug}`);
    onClose();
  };

  return (
    <div ref={wrapperRef} className="md:hidden bg-primary/97 px-4 pb-3 pt-2 border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des produits..."
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-10"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-10 px-4 flex-shrink-0">
          OK
        </Button>
      </form>

      {query.trim().length >= 2 && (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          {products.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">Aucun produit trouvé</div>
          ) : (
            <>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goToProduct(product.slug)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b last:border-0 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.brandName}</div>
                  </div>
                  <div className="text-xs font-bold text-primary">{product.price.toLocaleString()} DA</div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
                  onClose();
                }}
                className="w-full px-4 py-2 bg-gray-50 text-xs font-semibold text-primary text-center"
              >
                Voir tous les résultats →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function PublicLayout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile search on route change
  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location]);

  const navBg =
    isScrolled || !isHome
      ? "bg-primary text-primary-foreground border-primary-foreground/10 py-2 shadow-lg"
      : "bg-transparent text-white border-transparent py-4";

  return (
    <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Petro West"
              className="h-10 w-auto group-hover:brightness-110 transition"
            />
          </Link>

          {/* Desktop search — centered */}
          <div className="hidden md:flex flex-1">
            <NavSearch />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {/* Mobile search toggle */}
          <button 
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Rechercher"
            >
              {mobileSearchOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
          </button>

            <Button
              asChild
              variant="secondary"
              className="font-display tracking-wider text-base px-6 hover-elevate active-elevate-2"
            >
              <Link href="/shop">Acheter</Link>
              </Button>
          </div>
        </div>

        {/* Mobile search panel */}
        {mobileSearchOpen && (
          <MobileNavSearch onClose={() => setMobileSearchOpen(false)} />
      )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        id="contact"
        className="bg-[#001D3D] text-white pt-16 pb-8 border-t-4 border-secondary"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Petro West"
                className="h-12 w-auto"
              />
            </div>
            <p className="text-muted-foreground max-w-sm">
              Des lubrifiants fiables qui protègent les moteurs et améliorent
              les performances. Livraison d'huiles moteur de qualité supérieure
              dans les 58 wilayas d'Algérie.
            </p>
          </div>
          
          <div>
            <h3 className="font-display text-2xl mb-6 text-secondary">Liens Rapides</h3>
            <ul className="space-y-3 font-medium text-muted-foreground">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">Tous les Produits</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">À Propos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de Livraison</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-2xl mb-6 text-secondary">Contactez-nous</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>Cité Trouville rue n°01 N381<br />Arzew – Oran, Algérie 31200</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                <a href="tel:+213797930554" className="hover:text-white transition-colors">+213 797 93 05 54</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                <a href="tel:+213541035196" className="hover:text-white transition-colors">+213 541 03 51 96</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                <a href="mailto:contact@petrowest.dz" className="hover:text-white transition-colors">contact@petrowest.dz</a>
              </div>
              <div className="flex gap-3 pt-4">
                <a href="https://www.facebook.com/petrowest.dz" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/petrowestdz" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/@petrowest7562" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-8 flex items-center justify-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} Petro West. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
