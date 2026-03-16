import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=500&h=500&fit=crop";

  return (
    <div className="group bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-xl hover:border-secondary transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-square bg-white p-6 flex items-center justify-center overflow-hidden">
        {/* Unsplash placeholder fallback if no image provided */}
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1 font-bold tracking-wider">Rupture de Stock</Badge>
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary border-none">
            {product.oilType}
          </Badge>
          <span className="text-xs font-bold text-muted-foreground uppercase">{product.brandName}</span>
        </div>
        
        <h3 className="font-display text-2xl leading-tight text-primary mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{product.volume} • {product.viscosityGrade}</p>
        
        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <div className="font-display text-2xl font-bold text-primary">
            {product.price.toLocaleString()} <span className="text-lg text-muted-foreground">DA</span>
          </div>
          <Button asChild variant="default" size="sm" className="font-bold hover-elevate">
            <Link href={`/shop/${product.slug}`}>Voir</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
