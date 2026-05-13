import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { data: cart, isLoading } = useGetCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    }
  });

  const removeItem = useRemoveFromCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Produit retiré", description: "Le produit a été retiré de votre panier." });
      }
    }
  });

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    updateItem.mutate({ itemId, data: { quantity } });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId });
  };

  if (isLoading) {
    return <div className="container mx-auto px-6 py-32 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-xl">
        <div className="bg-secondary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border border-secondary/20">
          <Leaf className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-5xl mb-6 italic text-foreground">Votre panier est vide</h1>
        <p className="text-lg text-muted-foreground mb-12 font-sans">Découvrez notre collection de fleurs, huiles et résines pour commencer votre rituel bien-être.</p>
        <Button asChild size="lg" className="w-full sm:w-auto bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-14 px-10 rounded-full transition-all duration-500">
          <Link href="/boutique">Explorer la collection</Link>
        </Button>
      </div>
    );
  }

  const freeShippingThreshold = 49;
  const progressToFreeShipping = Math.min(100, (cart.subtotal / freeShippingThreshold) * 100);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <h1 className="font-serif text-5xl mb-16 text-foreground">Votre <span className="italic text-primary">panier</span></h1>

      <div className="grid lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          {/* Free Shipping Progress */}
          <div className="bg-card/40 border border-border/40 p-6 rounded-2xl hairline-gold inner-shadow-subtle">
            {amountToFreeShipping > 0 ? (
              <p className="text-sm font-medium tracking-wide mb-4">Plus que <span className="text-primary font-bold">€{amountToFreeShipping.toFixed(2)}</span> pour profiter de la livraison gratuite !</p>
            ) : (
              <p className="text-sm font-medium tracking-wide mb-4 text-primary flex items-center gap-2"><Truck className="w-4 h-4"/> Félicitations, la livraison est offerte !</p>
            )}
            <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out relative"
                style={{ width: `${progressToFreeShipping}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-[2px] -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-6">
            <AnimatePresence>
              {cart.items.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex gap-6 py-8 border-b border-border/40 group"
                >
                  <Link href={`/boutique/${item.product.slug}`} className="block w-28 h-32 shrink-0 bg-background/50 rounded-xl overflow-hidden hairline-gold relative">
                    <img 
                      src={item.product.imageUrl || `https://images.unsplash.com/photo-1606166325683-e6deb6979b0c?q=80&w=200&auto=format&fit=crop`} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover mix-blend-lighten transition-transform duration-700 group-hover:scale-110"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-[10px] text-primary uppercase tracking-[0.2em] mb-2 font-medium">{item.product.categoryName}</div>
                        <Link href={`/boutique/${item.product.slug}`} className="font-serif text-2xl hover:text-primary transition-colors leading-tight">
                          {item.product.name}
                        </Link>
                      </div>
                      <div className="text-xl font-serif text-primary shrink-0">€{item.totalPrice.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border/60 rounded-full bg-background/50 h-10">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updateItem.isPending}
                          className="px-3 text-muted-foreground hover:text-primary transition-colors h-full flex items-center justify-center"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updateItem.isPending}
                          className="px-3 text-muted-foreground hover:text-primary transition-colors h-full flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        disabled={removeItem.isPending}
                        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card/40 border border-border/40 p-8 rounded-3xl sticky top-28 hairline-gold inner-shadow-subtle">
            <h2 className="font-serif text-3xl mb-8 pb-6 border-b border-border/40">Résumé</h2>
            
            <div className="space-y-5 mb-8 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total ({cart.itemCount} articles)</span>
                <span className="font-medium text-foreground">€{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span>
                <span className="font-medium text-foreground">{cart.shipping === 0 ? "Offerte" : `€${cart.shipping?.toFixed(2) || "4.90"}`}</span>
              </div>
              {cart.discount && cart.discount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Réduction</span>
                  <span>-€{cart.discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end mb-10 pt-6 border-t border-border/40">
              <span className="font-serif text-xl text-muted-foreground">Total</span>
              <span className="text-4xl font-serif text-primary">€{cart.total.toFixed(2)}</span>
            </div>

            <Button 
              size="lg" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-full font-sans uppercase tracking-widest text-sm mb-6 transition-all duration-300"
              onClick={() => setLocation("/commande")}
            >
              Commander <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
            
            <div className="mt-8 pt-8 border-t border-border/40">
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Code promo</p>
              <div className="flex gap-2">
                <Input placeholder="Code" className="bg-background/50 border-border/60 rounded-full h-12 text-sm text-center tracking-widest uppercase" />
                <Button variant="outline" className="rounded-full h-12 px-6 tracking-widest uppercase text-[10px] border-border/60">OK</Button>
              </div>
            </div>

            <div className="mt-8 space-y-3 p-4 rounded-xl bg-background/30 border border-border/30">
              <div className="flex gap-3 text-xs text-muted-foreground leading-snug">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" /> 
                <span>Paiement 100% sécurisé (CB, Crypto)</span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground leading-snug">
                <Truck className="h-4 w-4 text-primary shrink-0" /> 
                <span>Expédition sous 24h, colis neutre</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
