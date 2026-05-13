import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCart, getGetCartQueryKey, useAddToWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: "Ajouté au panier",
          description: `${product.name} a été ajouté à votre panier.`,
        });
      },
    }
  });

  const addToWishlist = useAddToWishlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({
          title: "Ajouté aux favoris",
          description: `${product.name} a été ajouté à vos favoris.`,
        });
      }
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    addToWishlist.mutate({ data: { productId: product.id } });
  };

  return (
    <Link href={`/boutique/${product.slug}`} className="block group">
      <div className="relative bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden hairline-gold inner-shadow-subtle transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(201,168,76,0.15)] flex flex-col h-full">
        <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {product.isNew && (
              <div className="px-3 py-1 bg-background/80 backdrop-blur-md text-foreground text-xs font-medium tracking-widest uppercase rounded-full hairline-gold">
                Nouveau
              </div>
            )}
            {product.isBestseller && !product.isNew && (
              <div className="px-3 py-1 bg-background/80 backdrop-blur-md text-primary text-xs font-medium tracking-widest uppercase rounded-full hairline-gold flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary" /> Best-seller
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAddToWishlist}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-background/50 backdrop-blur-md text-muted-foreground hover:text-primary hover:bg-background/80 transition-all duration-300 opacity-0 group-hover:opacity-100 hairline-gold translate-y-2 group-hover:translate-y-0"
          >
            <Heart className="h-4 w-4" />
          </button>
          
          {/* Subtle gradient overlay to ensure text legibility if we placed text over image */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 z-0" />
          
          <img 
            src={product.imageUrl || `https://images.unsplash.com/photo-1606166325683-e6deb6979b0c?q=80&w=800&auto=format&fit=crop`} 
            alt={product.name}
            loading="lazy"
            className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110 mix-blend-lighten opacity-80"
          />
        </div>
        
        <div className="p-6 flex flex-col flex-1 relative z-10">
          <div className="text-[10px] text-primary uppercase tracking-[0.2em] mb-2 font-medium">
            {product.categoryName}
          </div>
          
          <h3 className="font-serif text-2xl text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="flex gap-2 mb-4 text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            {product.strain && <span className="px-2 py-1 bg-background/50 rounded hairline-gold">{product.strain}</span>}
            {(product.cbdContent || product.thcContent) && (
              <span className="px-2 py-1 bg-background/50 rounded hairline-gold flex items-center gap-2">
                {product.cbdContent && <span>CBD {product.cbdContent}</span>}
                {product.cbdContent && product.thcContent && <span className="w-1 h-1 rounded-full bg-border" />}
                {product.thcContent && <span>THC {product.thcContent}</span>}
              </span>
            )}
          </div>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through mb-0.5">€{product.compareAtPrice.toFixed(2)}</span>
              )}
              <span className="text-xl font-serif text-primary">
                {product.price.toFixed(2)}€
              </span>
            </div>
            
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full bg-background/50 border border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
            >
              {addToCart.isPending ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs font-medium tracking-widest uppercase px-4 h-full flex items-center w-auto">Ajouter</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}