import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";

export default function AdminSubscriptions() {
  useSeo({ title: "Abonnements", noindex: true });
  const { data: subs } = useQuery<any[]>({ queryKey: ["admin", "subs"], queryFn: () => apiGet("/admin/subscriptions") });
  const { data: plans } = useQuery<any[]>({ queryKey: ["admin", "plans"], queryFn: () => apiGet("/admin/subscription-plans") });

  return (
    <AdminShell title="Abonnements">
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {plans?.map((p) => (
          <div key={p.id} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
            <h3 className="font-serif text-xl italic">{p.name}</h3>
            <p className="text-3xl font-serif text-primary mt-2">{Number(p.monthlyPrice).toFixed(2)} <span className="text-base text-muted-foreground">€/mois</span></p>
            <p className="text-xs text-muted-foreground mt-2">{p.productCount} produits · {p.isActive ? "Actif" : "Désactivé"}</p>
          </div>
        ))}
      </div>

      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Client</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Plan</th>
              <th className="text-center p-4 text-xs uppercase tracking-widest text-muted-foreground">Statut</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Prochain prélèvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {subs?.map((s) => (
              <tr key={s.id} className="hover:bg-background/30">
                <td className="p-4">{s.userEmail}</td>
                <td className="p-4">{s.planName}</td>
                <td className="p-4 text-center"><span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">{s.status}</span></td>
                <td className="p-4 text-right text-muted-foreground">{s.nextBillingAt ? new Date(s.nextBillingAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            ))}
            {!subs?.length && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">Aucun abonnement actif.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
