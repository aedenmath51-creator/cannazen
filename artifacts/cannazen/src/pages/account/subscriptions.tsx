import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountShell } from "@/components/account-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Pause, Play, X, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountSubscriptions() {
  useSeo({ title: "Mes abonnements", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: subs } = useQuery({ queryKey: ["me", "subscriptions"], queryFn: () => apiGet<any[]>("/me/subscriptions") });

  const action = useMutation({
    mutationFn: ({ id, op }: { id: number; op: "pause" | "resume" | "cancel" }) => apiPost(`/me/subscriptions/${id}/${op}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me", "subscriptions"] }); toast({ title: "Abonnement mis à jour" }); },
  });

  return (
    <AccountShell title="Mes abonnements">
      {!subs || subs.length === 0 ? (
        <div className="bg-card/40 border border-dashed border-border/40 rounded-2xl p-12 text-center">
          <Repeat className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-2">Aucun abonnement actif.</p>
          <p className="text-sm text-muted-foreground">Recevez chaque mois une box surprise composée à la main par notre apothicaire.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((s) => (
            <div key={s.id} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl italic">{s.plan?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{Number(s.plan?.monthlyPrice).toFixed(2)} €/mois · {s.plan?.productCount} produits</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Statut : <span className={`uppercase font-medium ${s.status === "active" ? "text-primary" : ""}`}>{s.status}</span>
                    {s.nextBillingAt && s.status === "active" && <> · prochaine facturation le {new Date(s.nextBillingAt).toLocaleDateString("fr-FR")}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => action.mutate({ id: s.id, op: "pause" })} className="rounded-full">
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </Button>
                  )}
                  {s.status === "paused" && (
                    <Button size="sm" variant="outline" onClick={() => action.mutate({ id: s.id, op: "resume" })} className="rounded-full">
                      <Play className="h-3 w-3 mr-1" /> Reprendre
                    </Button>
                  )}
                  {s.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" onClick={() => action.mutate({ id: s.id, op: "cancel" })} className="rounded-full text-destructive hover:text-destructive">
                      <X className="h-3 w-3 mr-1" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
