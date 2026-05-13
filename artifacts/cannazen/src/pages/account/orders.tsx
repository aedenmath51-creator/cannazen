import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AccountShell } from "@/components/account-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";
import { Package, ExternalLink } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente paiement",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function AccountOrders() {
  useSeo({ title: "Mes commandes", noindex: true });
  const { data: orders, isLoading } = useQuery({ queryKey: ["me", "orders"], queryFn: () => apiGet<any[]>("/me/orders") });

  return (
    <AccountShell title="Mes commandes">
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Chargement…</div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-6">Aucune commande pour l'instant.</p>
            <Link href="/boutique" className="text-primary underline">Découvrir nos produits</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {orders.map((o) => (
              <div key={o.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-background/30 transition">
                <div>
                  <div className="font-medium text-foreground" data-testid={`order-${o.id}-number`}>{o.orderNumber ?? `Commande #${o.id}`}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">{STATUS_LABELS[o.status] ?? o.status}</span>
                  <span className="font-medium">{Number(o.total).toFixed(2)} €</span>
                  {o.trackingUrl && (
                    <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Suivre <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Link href={`/confirmation/${o.id}`} className="text-xs text-primary hover:underline">Détails</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountShell>
  );
}
