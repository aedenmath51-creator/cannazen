import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Star, Check, X, ShieldCheck } from "lucide-react";

export default function AdminReviews() {
  useSeo({ title: "Avis", noindex: true });
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const { data: reviews } = useQuery<any[]>({ queryKey: ["admin", "reviews", filter], queryFn: () => apiGet(`/admin/reviews?status=${filter}`) });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiPost(`/admin/reviews/${id}/moderate`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  return (
    <AdminShell title="Modération des avis" actions={
      <div className="flex gap-2">
        {["pending", "approved", "rejected"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="rounded-full text-xs">{f}</Button>
        ))}
      </div>
    }>
      <div className="space-y-4">
        {reviews?.map((r) => (
          <div key={r.id} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold" data-testid={`admin-review-${r.id}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{r.authorName ?? "Anonyme"}</span>
                  {r.isVerifiedBuyer && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Vérifié</span>}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted"}`} />)}
                </div>
                {r.title && <div className="font-medium mb-1">{r.title}</div>}
                <p className="text-sm text-muted-foreground">{r.comment}</p>
                <div className="text-xs text-muted-foreground/60 mt-2">Produit #{r.productId} · {new Date(r.createdAt).toLocaleString("fr-FR")}</div>
              </div>
              {filter === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, status: "approved" })} className="rounded-full"><Check className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, status: "rejected" })} className="rounded-full text-destructive"><X className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!reviews?.length && <div className="bg-card/40 border border-dashed border-border/40 rounded-2xl p-12 text-center text-muted-foreground">Aucun avis {filter === "pending" ? "en attente" : filter}.</div>}
      </div>
    </AdminShell>
  );
}
