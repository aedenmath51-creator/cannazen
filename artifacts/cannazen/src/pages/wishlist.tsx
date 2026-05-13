import { useGetWishlist, useRemoveFromWishlist, useAddToCart, getGetWishlistQueryKey, getGetCartQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { Trash2, ShoppingBag, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Wishlist() {
  const { data: items, isLoading } = useGetWishlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const removeFromWishlist = useRemoveFromWishlist({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() })
    }
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Produits ajoutés", description: "Les produits ont été ajoutés au panier." });
      }
    }
  });

  if (isLoading) return <div className="p-32 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-xl">
        <div className="bg-secondary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border border-secondary/20">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-5xl mb-6 italic text-foreground">Vos favoris sont vides</h1>
        <p className="text-lg text-muted-foreground mb-12 font-sans">Sauvegardez vos créations préférées pour les retrouver plus tard.</p>
        <Button asChild size="lg" className="w-full sm:w-auto bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-14 px-10 rounded-full transition-all duration-500">
          <Link href="/boutique">Découvrir nos créations</Link>
        </Button>
      </div>
    );
  }

  const handleAddAllToCart = () => {
    items.forEach(item => {
      addToCart.mutate({ data: { productId: item.productId, quantity: 1 } });
    });
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-border/40 pb-8 gap-6">
        <div>
          <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-4">Votre collection privée</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Mes <span className="italic text-primary">Favoris</span></h1>
          <p className="text-muted-foreground text-lg">{items.length} création(s) sauvegardée(s)</p>
        </div>
        <Button 
          onClick={handleAddAllToCart}
          disabled={addToCart.isPending}
          size="lg"
          className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full h-14 px-8 tracking-widest uppercase text-xs transition-all duration-300"
        >
          {addToCart.isPending ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" /> : <ShoppingBag className="mr-3 h-4 w-4" />}
          Ajouter tout au panier
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group h-full"
            >
              <ProductCard product={item.product} />
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromWishlist.mutate({ productId: item.productId }); }}
                disabled={removeFromWishlist.isPending}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-background/80 backdrop-blur-md text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 opacity-0 group-hover:opacity-100 hairline-gold shadow-xl"
                title="Retirer des favoris"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
