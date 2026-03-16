import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navClass = `fixed top-0 w-full z-50 transition-all duration-300 border-b ${
    isScrolled || !isHome
      ? "bg-primary text-primary-foreground border-primary-foreground/10 py-3 shadow-lg"
      : "bg-transparent text-white border-transparent py-5"
  }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
      {/* Navigation */}
      <nav className={navClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center transform group-hover:rotate-12 transition-transform">
              <span className="text-primary font-display font-bold text-xl leading-none">PW</span>
            </div>
            <span className="font-display text-2xl tracking-widest uppercase">Petro West</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-semibold">
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <Link href="/shop" className="hover:text-secondary transition-colors">Shop</Link>
            <a href="#contact" className="hover:text-secondary transition-colors">Contact</a>
            <Button asChild variant="secondary" className="font-display tracking-wider text-lg px-8 hover-elevate active-elevate-2">
              <Link href="/shop">Shop Now</Link>
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-primary text-white p-6 shadow-2xl animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-10">
              <span className="font-display text-2xl tracking-widest">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-xl font-bold">
              <Link href="/" className="hover:text-secondary">Home</Link>
              <Link href="/shop" className="hover:text-secondary">Shop</Link>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-secondary">Contact</a>
              <Button asChild variant="secondary" className="mt-4 font-display text-xl h-12">
                <Link href="/shop">Shop Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[#001D3D] text-white pt-16 pb-8 border-t-4 border-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                <span className="text-primary font-display font-bold text-xl leading-none">PW</span>
              </div>
              <span className="font-display text-3xl tracking-widest uppercase">Petro West</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Reliable lubricants that protect engines and improve performance. Delivering premium motor oils across all 58 wilayas in Algeria.
            </p>
          </div>
          
          <div>
            <h3 className="font-display text-2xl mb-6 text-secondary">Quick Links</h3>
            <ul className="space-y-3 font-medium text-muted-foreground">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Delivery Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-2xl mb-6 text-secondary">Contact Us</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>Industrial Zone, Route Nationale 5<br/>Algiers, Algeria</p>
              <p className="font-display text-3xl text-secondary pt-2">
                <a href="tel:+213555000000" className="hover:text-white transition-colors">+213 555 00 00 00</a>
              </p>
              <div className="flex gap-4 pt-4">
                <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <Share2 className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-white/50">
          <p>© {new Date().getFullYear()} Petro West. All rights reserved.</p>
          <Link href="/admin/login" className="hover:text-white transition-colors mt-4 md:mt-0">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}
