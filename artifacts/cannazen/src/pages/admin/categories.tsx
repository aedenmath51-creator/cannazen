import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function AdminCategories() {
  useSeo({ title: "Catégories", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useQuery<any[]>({ queryKey: ["admin", "categories"], queryFn: () => apiGet("/admin/categories") });

  const save = useMutation({
    mutationFn: ({ id, ...rest }: any) => apiPut(`/admin/categories/${id}`, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "categories"] }); toast({ title: "Mis à jour" }); },
  });

  return (
    <AdminShell title="Catégories">
      <div className="bg-card/40 border border-border/40 rounded-2xl divide-y divide-border/30 hairline-gold">
        {categories?.map((c) => (
          <div key={c.id} className="p-5 flex items-center justify-between gap-4" data-testid={`admin-cat-${c.id}`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">{c.productCount ?? 0}</div>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">/{c.slug} · {c.description ?? ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={c.isActive ?? true} onCheckedChange={(v) => save.mutate({ id: c.id, isActive: v })} data-testid={`toggle-active-${c.id}`} />
                <span className="text-muted-foreground uppercase tracking-widest">Visible</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={!!c.isRestrictable} onCheckedChange={(v) => save.mutate({ id: c.id, isRestrictable: v })} />
                <span className="text-muted-foreground uppercase tracking-widest">Restreint si interdit</span>
              </label>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 italic">Les catégories restreintes (résines, fleurs, etc.) peuvent être désactivées massivement en cas d'évolution réglementaire.</p>
    </AdminShell>
  );
}
