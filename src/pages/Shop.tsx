import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useListProducts, useListBrands, useListOilTypes, useListCategories } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

// ─── Collapsible section ──────────────────────────────────────────────────────
function FilterSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2.5 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
          {title}
          {count != null && count > 0 && (
            <span className="ml-1.5 text-secondary font-bold">({count})</span>
          )}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="pb-3 space-y-1">{children}</div>}
    </div>
  );
}

// ─── Single compact checkbox row ─────────────────────────────────────────────
function FilterCheckbox({
  id,
  label,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
        checked ? "bg-primary/8 text-primary" : "hover:bg-gray-50"
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className="flex-shrink-0 w-3.5 h-3.5"
        />
        <Label
          htmlFor={id}
          className="text-sm cursor-pointer leading-none truncate"
        >
          {label}
        </Label>
      </div>
      {count != null && (
        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{count}</span>
      )}
    </div>
  );
}

// ─── Active filter count badge ────────────────────────────────────────────────
function activeCount(
  selectedBrand: string,
  selectedOilType: string,
  selectedCategoryId: number | null,
  priceRange: number[],
  inStockOnly: boolean
) {
  let n = 0;
  if (selectedBrand) n++;
  if (selectedOilType) n++;
  if (selectedCategoryId) n++;
  if (priceRange[0] > 0 || priceRange[1] < 15000) n++;
  if (inStockOnly) n++;
  return n;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Shop() {
  const { t } = useTranslation();
  const [location] = useLocation();

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedOilType, setSelectedOilType] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const initialized = useRef(false);

  // Read URL ?q= param on mount / location change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        setSearch(q);
        setDebouncedSearch(q);
      }
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Data hooks
  const { data: brandsData } = useListBrands();
  const { data: oilTypesData } = useListOilTypes();
  const { data: categoriesData } = useListCategories();

  const { data: productsData, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    brand: selectedBrand || undefined,
    oilType: selectedOilType || undefined,
    categoryId: selectedCategoryId ?? undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 15000 ? priceRange[1] : undefined,
    inStock: inStockOnly ? true : undefined,
    page,
    limit: 12,
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedBrand("");
    setSelectedOilType("");
    setSelectedCategoryId(null);
    setPriceRange([0, 15000]);
    setInStockOnly(false);
    setPage(1);
  };

  const numActive = activeCount(
    selectedBrand,
    selectedOilType,
    selectedCategoryId,
    priceRange,
    inStockOnly
  );

  // ── Filter panel (shared between sidebar and sheet) ──────────────────────
  const FilterPanel = () => (
    <div className="space-y-0 text-sm">
      {/* Top bar: results + clear */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("shop.filters")}
          {numActive > 0 && (
            <Badge className="ml-2 px-1.5 py-0 text-xs bg-secondary text-primary">
              {numActive}
            </Badge>
          )}
        </span>
        {numActive > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> {t("shop.clear")}
          </button>
        )}
      </div>

      {/* In stock toggle */}
      <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
          {t("shop.inStockOnly")}
        </span>
        <Switch
          checked={inStockOnly}
          onCheckedChange={(v) => {
            setInStockOnly(v);
            setPage(1);
          }}
          className="scale-75"
        />
      </div>

      {/* Categories */}
      {categoriesData && categoriesData.length > 0 && (
        <FilterSection title={t("shop.category")} count={selectedCategoryId ? 1 : 0}>
          {categoriesData.map((cat) => (
            <FilterCheckbox
              key={cat.id}
              id={`cat-${cat.id}`}
              label={cat.name}
              count={cat.productCount}
              checked={selectedCategoryId === cat.id}
              onChange={(checked) => {
                setSelectedCategoryId(checked ? cat.id : null);
                setPage(1);
              }}
            />
          ))}
        </FilterSection>
      )}

      {/* Brands */}
      {brandsData && brandsData.length > 0 && (
        <FilterSection title={t("shop.brand")} count={selectedBrand ? 1 : 0}>
          {brandsData.map((brand) => (
            <FilterCheckbox
              key={brand.id}
              id={`brand-${brand.id}`}
              label={brand.name}
              count={brand.productCount}
              checked={selectedBrand === brand.name}
              onChange={(checked) => {
                setSelectedBrand(checked ? brand.name : "");
                setPage(1);
              }}
            />
          ))}
        </FilterSection>
      )}

      {/* Oil types */}
      {oilTypesData && oilTypesData.length > 0 && (
        <FilterSection title={t("shop.oilType")} count={selectedOilType ? 1 : 0}>
          {oilTypesData.map((type) => (
            <FilterCheckbox
              key={type.id}
              id={`type-${type.name}`}
              label={type.name}
              count={type.productCount}
              checked={selectedOilType === type.name}
              onChange={(checked) => {
                setSelectedOilType(checked ? type.name : "");
                setPage(1);
              }}
            />
          ))}
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection
        title={t("shop.priceDa")}
        count={priceRange[0] > 0 || priceRange[1] < 15000 ? 1 : 0}
      >
        <div className="px-2 pt-1 pb-2">
          <Slider
            value={priceRange}
            min={0}
            max={15000}
            step={500}
            onValueChange={(v) => {
              setPriceRange(v);
              setPage(1);
            }}
            className="py-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1 font-medium">
            <span>{priceRange[0].toLocaleString()} DA</span>
            <span>{priceRange[1].toLocaleString()} DA</span>
          </div>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <PublicLayout>
      {/* Header Banner */}
      <div className="bg-[#001D3D] pt-28 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src={`${import.meta.env.BASE_URL}images/pattern-bg.png`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-2 tracking-wide">
            {t("shop.title")}
          </h1>
          <p className="text-secondary font-medium">{t("shop.breadcrumb")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-8">
        {/* ── Mobile Filter Bar ── */}
        <div className="md:hidden flex items-center justify-between mb-2">
          <span className="font-semibold text-base">
            {t("shop.mobileTotal", { count: productsData?.total || 0 })}
          </span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {t("shop.filters")}
                {numActive > 0 && (
                  <Badge className="ml-1 px-1.5 py-0 text-xs bg-secondary text-primary">
                    {numActive}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto pt-8">
              <FilterPanel />
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border p-4 shadow-sm">
            <FilterPanel />
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <div className="flex-1 min-w-0">
          {/* Search bar above products */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-11 bg-white shadow-sm"
              placeholder={t("shop.searchProducts")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="font-semibold text-base text-muted-foreground">
              {(productsData?.total || 0) === 1
                ? t("shop.foundOne", { count: 1 })
                : t("shop.foundMany", { count: productsData?.total || 0 })}
            </span>
            {numActive > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedCategoryId && categoriesData && (
                  <button
                    onClick={() => { setSelectedCategoryId(null); setPage(1); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                  >
                    {categoriesData.find((c) => c.id === selectedCategoryId)?.name}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedBrand && (
                  <button
                    onClick={() => { setSelectedBrand(""); setPage(1); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                  >
                    {selectedBrand} <X className="w-3 h-3" />
                  </button>
                )}
                {selectedOilType && (
                  <button
                    onClick={() => { setSelectedOilType(""); setPage(1); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                  >
                    {selectedOilType} <X className="w-3 h-3" />
                  </button>
                )}
                {inStockOnly && (
                  <button
                    onClick={() => { setInStockOnly(false); setPage(1); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"
                  >
                    {t("shop.inStockChip")} <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 sm:h-96 bg-gray-200 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed">
              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="font-display text-3xl text-muted-foreground mb-4">
                {t("shop.noneFound")}
              </h3>
              <Button onClick={clearFilters} variant="secondary">
                {t("shop.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-12">
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
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("shop.prev")}
                  </Button>
                  <div className="flex items-center px-4 font-bold text-primary">
                    {t("shop.pageOf", { page, total: Math.ceil(productsData.total / 12) })}
                  </div>
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(productsData.total / 12)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("shop.next")}
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
