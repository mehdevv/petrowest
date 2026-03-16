import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=500&h=500&fit=crop";

  return (
    <Link href={`/shop/${product.slug}`} className="block">
      <div className="group bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-xl hover:border-secondary transition-all duration-300 flex flex-col h-full cursor-pointer">
        <div className="relative aspect-square bg-white p-3 sm:p-6 flex items-center justify-center overflow-hidden">
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold tracking-wider">Rupture</Badge>
            </div>
          )}
        </div>
        
        <div className="p-2.5 sm:p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-1 mb-1 sm:mb-2">
            <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary border-none text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5">
              {product.oilType}
            </Badge>
            <span className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase truncate">{product.brandName}</span>
          </div>
          
          <h3 className="font-display text-sm sm:text-2xl leading-tight text-primary mb-0.5 sm:mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4 truncate">{product.volume} • {product.viscosityGrade}</p>
          
          <div className="mt-auto pt-2 sm:pt-4 border-t flex items-center justify-between">
            <div className="font-display text-base sm:text-2xl font-bold text-primary">
              {product.price.toLocaleString()} <span className="text-[10px] sm:text-lg text-muted-foreground">DA</span>
            </div>
            <Button variant="default" size="sm" className="font-bold hover-elevate hidden sm:inline-flex text-xs">
              Voir
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
