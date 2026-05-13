import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  if (isLoading) return <div className="p-32 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-xl">
        <div className="bg-secondary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border border-secondary/20">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-5xl mb-6 italic text-foreground">Aucune commande</h1>
        <p className="text-lg text-muted-foreground mb-12 font-sans">Vous n'avez pas encore passé de commande chez l'apothicaire.</p>
        <Button asChild size="lg" className="w-full sm:w-auto bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-14 px-10 rounded-full transition-all duration-500">
          <Link href="/boutique">Découvrir nos créations</Link>
        </Button>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': return { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
      case 'confirmed': return { label: 'Confirmée', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 };
      case 'shipped': return { label: 'Expédiée', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Truck };
      case 'delivered': return { label: 'Livrée', color: 'bg-secondary/20 text-secondary-foreground border-secondary/30', icon: CheckCircle2 };
      case 'cancelled': return { label: 'Annulée', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle };
      default: return { label: status, color: 'bg-muted/50 text-muted-foreground border-border', icon: Package };
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-5xl">
      <div className="mb-16 pb-8 border-b border-border/40 text-center md:text-left">
        <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-4">Votre historique</div>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground">Mes <span className="italic text-primary">Commandes</span></h1>
      </div>

      <div className="space-y-8">
        {orders.map((order, i) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card/40 border border-border/40 rounded-3xl overflow-hidden transition-all duration-500 hover:border-primary/30 hairline-gold inner-shadow-subtle"
            >
              <div className="p-8 border-b border-border/40 bg-background/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="grid grid-cols-2 md:flex md:gap-12 gap-y-6 w-full md:w-auto">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Commande du</p>
                    <p className="font-serif text-xl">{format(new Date(order.createdAt), "d MMM yyyy", { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Total</p>
                    <p className="font-serif text-xl text-primary">€{order.total.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Numéro</p>
                    <p className="font-medium text-muted-foreground">#{order.id.toString().padStart(6, '0')}</p>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-medium tracking-widest uppercase ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" /> {statusConfig.label}
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex gap-6 overflow-x-auto pb-6 mb-2 custom-scrollbar">
                  {order.items.map(item => (
                    <div key={item.id} className="w-28 shrink-0 group">
                      <div className="w-28 h-32 bg-background/50 rounded-xl overflow-hidden mb-4 border border-border/50 hairline-gold relative">
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold flex items-center justify-center border border-border">
                          x{item.quantity}
                        </div>
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover mix-blend-lighten transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <Leaf className="w-8 h-8 m-auto mt-12 text-muted-foreground/30" />
                        )}
                      </div>
                      <p className="text-sm font-serif truncate hover:text-primary transition-colors cursor-default" title={item.productName}>{item.productName}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-6 border-t border-border/40">
                  <Button asChild variant="outline" className="rounded-full h-12 px-8 border-border/60 hover:bg-card hover:text-primary tracking-widest uppercase text-xs transition-colors">
                    <Link href={`/confirmation/${order.id}`}>
                      Détails de la commande <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
