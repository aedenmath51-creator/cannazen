import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";

export default function AdminAudit() {
  useSeo({ title: "Audit", noindex: true });
  const { data: logs } = useQuery<any[]>({ queryKey: ["admin", "audit"], queryFn: () => apiGet("/admin/audit-logs") });

  return (
    <AdminShell title="Journal d'audit">
      <p className="text-xs text-muted-foreground mb-6 italic">Traçabilité des actions sensibles (RGPD, conformité).</p>
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-3 text-xs uppercase tracking-widest text-muted-foreground">Date</th>
              <th className="text-left p-3 text-xs uppercase tracking-widest text-muted-foreground">Action</th>
              <th className="text-left p-3 text-xs uppercase tracking-widest text-muted-foreground">Acteur</th>
              <th className="text-left p-3 text-xs uppercase tracking-widest text-muted-foreground">Cible</th>
              <th className="text-left p-3 text-xs uppercase tracking-widest text-muted-foreground">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {logs?.map((l) => (
              <tr key={l.id} className="hover:bg-background/30">
                <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(l.createdAt).toLocaleString("fr-FR")}</td>
                <td className="p-3 font-mono">{l.action}</td>
                <td className="p-3">{l.actorEmail ?? "système"}</td>
                <td className="p-3 text-muted-foreground">{l.targetType ? `${l.targetType}#${l.targetId}` : "—"}</td>
                <td className="p-3 text-muted-foreground font-mono">{l.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {!logs?.length && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Journal vide.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
