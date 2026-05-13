import { Link, useParams } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Confirmation() {
  const { orderId } = useParams();
  const { data: order, isLoading, error } = useGetOrder(Number(orderId));

  if (isLoading) return <div className="p-32 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (error || !order) return (
    <div className="container mx-auto px-6 py-32 text-center min-h-[60vh] flex flex-col justify-center">
      <h1 className="font-serif text-4xl mb-6">Commande introuvable</h1>
      <Button asChild size="lg" className="mx-auto rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 tracking-widest uppercase text-xs h-12 px-8">
        <Link href="/boutique">Retour à la boutique</Link>
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-24 max-w-3xl min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card/40 border border-border/40 p-12 md:p-16 rounded-[2.5rem] hairline-gold inner-shadow-subtle text-center relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px] z-0" />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-10 shadow-[0_0_30px_rgba(201,168,76,0.15)]"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="font-serif text-5xl mb-6 italic text-foreground">Merci pour votre commande</h1>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
            Votre commande <span className="text-primary font-medium">#{order.id.toString().padStart(6, '0')}</span> a bien été enregistrée. Le concierge prépare vos produits avec le plus grand soin.
          </p>

          <div className="bg-background/50 border border-border/40 rounded-2xl p-8 mb-12 text-left">
            <h2 className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">Résumé de la commande</h2>
            
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm group">
                  <div className="flex gap-4 items-center">
                    <span className="text-primary/70 text-[10px] font-medium px-2 py-1 rounded bg-primary/10 border border-primary/20">{item.quantity}x</span>
                    <span className="font-serif text-lg">{item.productName}</span>
                  </div>
                  <span className="font-medium text-foreground">€{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border/40 pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>€{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span>
                <span>{order.shipping === 0 ? "Offerte" : `€${order.shipping?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between items-end pt-6 font-medium border-t border-border/40 mt-6">
                <span className="font-serif text-xl text-muted-foreground">Total réglé</span>
                <span className="text-3xl text-primary font-serif">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg" 
              className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-xs h-14 px-8 rounded-full transition-all duration-300"
            >
              <Link href="/boutique">
                Continuer la visite
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="lg" 
              className="font-sans tracking-widest uppercase text-xs h-14 px-8 rounded-full border-border/60 bg-background/50 hover:bg-card transition-colors"
            >
              <Link href="/mes-commandes">
                <Package className="mr-2 h-4 w-4" /> Suivre la commande
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
