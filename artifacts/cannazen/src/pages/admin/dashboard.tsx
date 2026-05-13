import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";
import { TrendingUp, ShoppingBag, Users, Package } from "lucide-react";

export default function AdminDashboard() {
  useSeo({ title: "Tableau de bord", noindex: true });
  const { data } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => apiGet<any>("/admin/dashboard") });

  const cards = [
    { label: "CA 30 jours", value: data ? `${Number(data.revenue30 ?? 0).toFixed(0)} €` : "—", icon: TrendingUp, accent: "text-primary" },
    { label: "CA 7 jours", value: data ? `${Number(data.revenue7 ?? 0).toFixed(0)} €` : "—", icon: TrendingUp, accent: "text-primary" },
    { label: "Total commandes", value: data?.ordersCount ?? "—", icon: ShoppingBag, accent: "" },
    { label: "Clients inscrits", value: data?.usersCount ?? "—", icon: Users, accent: "" },
    { label: "Produits actifs", value: data?.productsCount ?? "—", icon: Package, accent: "" },
    { label: "Panier moyen", value: data ? `${Number(data.averageOrderValue ?? 0).toFixed(2)} €` : "—", icon: TrendingUp, accent: "" },
  ];

  return (
    <AdminShell title="Tableau de bord">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {cards.map((c) => (
          <div key={c.label} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.accent || "text-muted-foreground"}`} />
            </div>
            <div className="font-serif text-3xl text-foreground">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
          <h2 className="font-serif text-xl italic mb-4">Top produits</h2>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <ul className="divide-y divide-border/30">
              {data.topProducts.map((p: any) => (
                <li key={p.id} className="py-3 flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">{p.totalSold} vendus</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucune donnée pour le moment.</p>}
        </div>
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
          <h2 className="font-serif text-xl italic mb-4">Dernières commandes</h2>
          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <ul className="divide-y divide-border/30">
              {data.recentOrders.map((o: any) => (
                <li key={o.id} className="py-3 flex justify-between text-sm">
                  <span className="truncate">{o.orderNumber ?? `#${o.id}`} · {o.email}</span>
                  <span className="text-primary font-medium">{Number(o.total).toFixed(2)} €</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucune commande.</p>}
        </div>
      </div>
    </AdminShell>
  );
}
