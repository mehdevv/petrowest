import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useListProducts, useListBrands } from "@workspace/api-client-react";
import { OIL_TYPES } from "@/lib/constants";

export default function Shop() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedOilType, setSelectedOilType] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: brandsData } = useListBrands();
  
  const { data: productsData, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    brand: selectedBrand || undefined,
    oilType: selectedOilType || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    page,
    limit: 12
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedBrand("");
    setSelectedOilType("");
    setPriceRange([0, 15000]);
    setPage(1);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl mb-4 text-primary">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-white" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl mb-4 text-primary">Brand</h3>
        <div className="space-y-3">
          {brandsData?.map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`brand-${brand.id}`} 
                checked={selectedBrand === brand.name}
                onCheckedChange={(checked) => {
                  setSelectedBrand(checked ? brand.name : "");
                  setPage(1);
                }}
              />
              <Label htmlFor={`brand-${brand.id}`} className="text-base cursor-pointer">
                {brand.name} <span className="text-muted-foreground text-sm">({brand.productCount})</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl mb-4 text-primary">Oil Type</h3>
        <div className="space-y-3">
          {OIL_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`type-${type}`}
                checked={selectedOilType === type}
                onCheckedChange={(checked) => {
                  setSelectedOilType(checked ? type : "");
                  setPage(1);
                }}
              />
              <Label htmlFor={`type-${type}`} className="text-base cursor-pointer">{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl mb-4 text-primary flex justify-between">
          Price Range <span className="text-sm font-sans font-normal text-muted-foreground">{priceRange[0]} - {priceRange[1]} DA</span>
        </h3>
        <Slider 
          value={priceRange} 
          min={0} 
          max={15000} 
          step={500} 
          onValueChange={(v) => { setPriceRange(v); setPage(1); }} 
          className="py-4"
        />
      </div>

      <Button variant="outline" className="w-full h-12" onClick={clearFilters}>
        <X className="w-4 h-4 mr-2" /> Clear All Filters
      </Button>
    </div>
  );

  return (
    <PublicLayout>
      {/* Header Banner */}
      <div className="bg-[#001D3D] pt-28 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={`${import.meta.env.BASE_URL}images/pattern-bg.png`} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-2 tracking-wide">Our Shop</h1>
          <p className="text-secondary font-medium">Home / Shop</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <span className="font-bold text-lg">{productsData?.total || 0} products found</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <div className="mt-8"><FilterContent /></div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="hidden md:block mb-6">
            <span className="font-bold text-lg text-muted-foreground">{productsData?.total || 0} products found</span>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed">
              <h3 className="font-display text-3xl text-muted-foreground mb-4">No Products Found</h3>
              <Button onClick={clearFilters} variant="secondary">Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {productsData?.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Pagination */}
              {productsData && productsData.total > 12 && (
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 font-bold text-primary">
                    Page {page} of {Math.ceil(productsData.total / 12)}
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={page >= Math.ceil(productsData.total / 12)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
