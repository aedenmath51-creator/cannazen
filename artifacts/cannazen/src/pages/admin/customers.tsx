import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";

export default function AdminCustomers() {
  useSeo({ title: "Clients", noindex: true });
  const { data: customers } = useQuery<any[]>({ queryKey: ["admin", "customers"], queryFn: () => apiGet("/admin/customers") });

  return (
    <AdminShell title="Clients">
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Client</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
              <th className="text-center p-4 text-xs uppercase tracking-widest text-muted-foreground">Niveau</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Points</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Commandes</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Total</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Inscrit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {customers?.map((c) => (
              <tr key={c.id} className="hover:bg-background/30" data-testid={`admin-customer-${c.id}`}>
                <td className="p-4 font-medium">{c.firstName} {c.lastName}</td>
                <td className="p-4 text-muted-foreground">{c.email}{!c.emailVerified && <span className="ml-2 text-xs text-yellow-500">non vérifié</span>}</td>
                <td className="p-4 text-center"><span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{c.loyaltyTier}</span></td>
                <td className="p-4 text-right">{c.loyaltyPoints}</td>
                <td className="p-4 text-right">{c.orderCount ?? 0}</td>
                <td className="p-4 text-right">{c.totalSpent ? `${Number(c.totalSpent).toFixed(2)} €` : "—"}</td>
                <td className="p-4 text-right text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
