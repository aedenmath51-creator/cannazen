import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, Leaf } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Shop() {
  const queryString = useSearch();
  const params = new URLSearchParams(queryString);
  const urlCategory = params.get("category") || undefined;
  const urlQuery = params.get("q") || "";

  const [category, setCategory] = useState<string | undefined>(urlCategory);
  const [search, setSearch] = useState<string>(urlQuery);
  const [sort, setSort] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);

  useEffect(() => {
    setSearch(urlQuery);
    setCategory(urlCategory);
  }, [urlQuery, urlCategory]);

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
    sort: sort as any,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="mb-20 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 mx-auto bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center mb-6">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-serif text-6xl mb-6">La Boutique</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Explorez notre sélection de produits au CBD d'exception. Cultivés avec soin, choisis pour leurs vertus.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar for Desktop / Sheet for Mobile */}
        <div className="lg:w-1/4">
          <div className="sticky top-28 space-y-10 bg-card/20 border border-border/40 p-8 rounded-2xl hairline-gold hidden lg:block">
            <h3 className="font-serif text-2xl mb-6 pb-4 border-b border-border/40">Filtres</h3>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-medium mb-4 uppercase tracking-[0.2em] text-muted-foreground">Recherche</h4>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="pl-11 bg-background/50 border-border/60 rounded-full h-12 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-medium mb-4 uppercase tracking-[0.2em] text-muted-foreground">Catégories</h4>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => setCategory("all")}
                      className={`text-sm w-full text-left py-1 hover:text-primary transition-colors flex items-center justify-between group ${!category || category === "all" ? "text-primary font-medium" : "text-muted-foreground"}`}
                    >
                      <span>Toutes les créations</span>
                      <span className="w-4 h-px bg-border group-hover:bg-primary transition-colors hidden sm:block" />
                    </button>
                  </li>
                  {categories?.map(c => (
                    <li key={c.id}>
                      <button 
                        onClick={() => setCategory(c.slug)}
                        className={`text-sm w-full text-left py-1 hover:text-primary transition-colors flex items-center justify-between group ${category === c.slug ? "text-primary font-medium" : "text-muted-foreground"}`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground/50">({c.productCount})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Prix</h4>
                  <span className="text-xs font-medium text-primary">€{priceRange[0]} - €{priceRange[1]}</span>
                </div>
                <Slider 
                  defaultValue={[0, 200]} 
                  max={200} 
                  step={5} 
                  value={[priceRange[0], priceRange[1]]}
                  onValueChange={handlePriceChange}
                  className="mb-2"
                />
              </div>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full lg:hidden mb-8 border-primary/30 text-primary h-14 rounded-full uppercase tracking-widest text-xs font-sans">
                <SlidersHorizontal className="mr-3 h-4 w-4" /> Filtres & Tri
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto bg-card/95 backdrop-blur-xl">
              <SheetTitle className="font-serif text-3xl mb-8">Filtres</SheetTitle>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-muted-foreground">Recherche</h4>
                  <Input 
                    placeholder="Rechercher..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-background rounded-full"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-muted-foreground">Catégories</h4>
                  <ul className="space-y-4">
                    <li>
                      <button onClick={() => setCategory("all")} className={`text-sm ${!category || category === "all" ? "text-primary" : "text-muted-foreground"}`}>Toutes les créations</button>
                    </li>
                    {categories?.map(c => (
                      <li key={c.id}>
                        <button onClick={() => setCategory(c.slug)} className={`text-sm flex justify-between w-full ${category === c.slug ? "text-primary" : "text-muted-foreground"}`}>
                          <span>{c.name}</span>
                          <span>({c.productCount})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex justify-between mb-4 text-xs font-medium text-primary">
                    <span>€{priceRange[0]}</span>
                    <span>€{priceRange[1]}</span>
                  </div>
                  <Slider defaultValue={[0, 200]} max={200} step={5} value={[priceRange[0], priceRange[1]]} onValueChange={handlePriceChange} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border/40">
            <div className="text-muted-foreground text-sm font-medium tracking-wide">
              {products ? `${products.length} produit(s)` : 'Chargement...'}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Trier par:</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[200px] bg-card/50 border-border/60 rounded-full h-10 text-xs tracking-wider">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60">
                  <SelectItem value="newest">Nouveautés</SelectItem>
                  <SelectItem value="bestseller">Meilleures ventes</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse bg-card/40 rounded-2xl aspect-[4/5] border border-border/40" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-card/20 rounded-2xl border border-border/40 border-dashed">
              <Leaf className="w-8 h-8 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-xl text-muted-foreground mb-6 font-serif">Aucune création ne correspond à vos critères.</p>
              <Button variant="outline" className="rounded-full tracking-widest uppercase text-xs" onClick={() => {setCategory("all"); setSearch(""); setPriceRange([0, 200]);}}>Réinitialiser les filtres</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
