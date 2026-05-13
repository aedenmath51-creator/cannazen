import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";
import { Award, Package, ShoppingBag, Sparkles } from "lucide-react";

export default function AccountDashboard() {
  useSeo({ title: "Mon compte", noindex: true });
  const { user } = useAuth();
  const { data: orders } = useQuery({ queryKey: ["me", "orders"], queryFn: () => apiGet<any[]>("/me/orders") });
  const { data: loyalty } = useQuery({ queryKey: ["me", "loyalty"], queryFn: () => apiGet<any>("/me/loyalty") });

  return (
    <AccountShell title={`Bonjour ${user?.firstName ?? ""}`}>
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Fidélité</span>
          </div>
          <div className="font-serif text-4xl text-foreground" data-testid="dash-loyalty-points">{loyalty?.points ?? 0}</div>
          <div className="text-sm text-muted-foreground mt-2">points · niveau {loyalty?.tierLabel ?? "Bronze"}</div>
        </div>
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Commandes</span>
          </div>
          <div className="font-serif text-4xl text-foreground">{orders?.length ?? 0}</div>
          <div className="text-sm text-muted-foreground mt-2">commandes passées</div>
        </div>
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Statut</span>
          </div>
          <div className="font-serif text-2xl text-foreground capitalize">{loyalty?.tierLabel ?? "Bronze"}</div>
          {loyalty?.pointsToNext > 0 && <div className="text-sm text-muted-foreground mt-2">{loyalty.pointsToNext} points avant le palier suivant</div>}
        </div>
      </div>

      <div className="bg-card/40 border border-border/40 rounded-2xl p-8 mb-8 hairline-gold">
        <h2 className="font-serif text-2xl italic mb-6">Dernières commandes</h2>
        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 4).map((o) => (
              <Link key={o.id} href={`/confirmation/${o.id}`}>
                <a className="flex items-center justify-between py-4 border-b border-border/30 last:border-0 hover:bg-background/30 px-3 -mx-3 rounded-lg transition" data-testid={`dash-order-${o.id}`}>
                  <div>
                    <div className="font-medium text-foreground">{o.orderNumber ?? `#${o.id}`}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("fr-FR")} · {o.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground">{Number(o.total).toFixed(2)} €</div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-4 opacity-40" />
            <p className="mb-4">Aucune commande pour le moment.</p>
            <Link href="/boutique" className="text-primary hover:underline">Découvrir la boutique →</Link>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
