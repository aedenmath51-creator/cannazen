import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-muted/50 text-muted-foreground border-border",
};

export default function AdminOrders() {
  useSeo({ title: "Commandes", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: orders } = useQuery<any[]>({ queryKey: ["admin", "orders"], queryFn: () => apiGet("/admin/orders") });
  const [open, setOpen] = useState<number | null>(null);
  const { data: detail } = useQuery<any>({ queryKey: ["admin", "order", open], queryFn: () => apiGet(`/admin/orders/${open}`), enabled: !!open });

  const action = useMutation({
    mutationFn: ({ id, op }: { id: number; op: string }) => apiPost(`/admin/orders/${id}/${op}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "orders"] }); qc.invalidateQueries({ queryKey: ["admin", "order"] }); toast({ title: "Mis à jour" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminShell title="Commandes">
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">N° / Date</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Client</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Total</th>
              <th className="text-center p-4 text-xs uppercase tracking-widest text-muted-foreground">Statut</th>
              <th className="text-center p-4 text-xs uppercase tracking-widest text-muted-foreground">Paiement</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-background/30 cursor-pointer" onClick={() => setOpen(o.id)} data-testid={`admin-order-${o.id}`}>
                <td className="p-4">
                  <div className="font-medium">{o.orderNumber ?? `#${o.id}`}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("fr-FR")}</div>
                </td>
                <td className="p-4">{o.firstName} {o.lastName}<div className="text-xs text-muted-foreground">{o.email}</div></td>
                <td className="p-4 text-right font-medium">{Number(o.total).toFixed(2)} €</td>
                <td className="p-4 text-center"><span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[o.status] ?? "border-border"}`}>{o.status}</span></td>
                <td className="p-4 text-center text-xs text-muted-foreground">{o.paymentStatus ?? "—"}</td>
                <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  {o.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => action.mutate({ id: o.id, op: "ship" })} title="Expédier"><Truck className="h-3 w-3" /></Button>}
                  {o.status === "shipped" && <Button size="sm" variant="outline" onClick={() => action.mutate({ id: o.id, op: "deliver" })} title="Marquer livré"><CheckCircle2 className="h-3 w-3" /></Button>}
                  {!["delivered", "cancelled", "refunded"].includes(o.status) && (
                    <Button size="sm" variant="ghost" onClick={() => confirm("Annuler ?") && action.mutate({ id: o.id, op: "cancel" })}><XCircle className="h-3 w-3 text-destructive" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-serif text-2xl italic">Commande {detail.orderNumber ?? `#${detail.id}`}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Box label="Client"><div>{detail.firstName} {detail.lastName}</div><div className="text-xs text-muted-foreground">{detail.email}</div>{detail.phone && <div className="text-xs text-muted-foreground">{detail.phone}</div>}</Box>
                  <Box label="Adresse de livraison">{detail.shippingAddress}</Box>
                  <Box label="Transporteur">{detail.shippingService ?? "—"}{detail.trackingNumber && <div className="text-xs text-primary">Tracking : {detail.trackingNumber}</div>}</Box>
                  <Box label="Paiement">{detail.paymentMethod} · {detail.paymentStatus}</Box>
                </div>
                <Box label="Articles">
                  <ul className="divide-y divide-border/30">
                    {detail.items?.map((it: any) => (
                      <li key={it.id} className="flex justify-between py-2"><span>{it.quantity}× {it.productName}</span><span>{Number(it.totalPrice).toFixed(2)} €</span></li>
                    ))}
                  </ul>
                </Box>
                <Box label="Totaux">
                  <div className="flex justify-between text-muted-foreground"><span>Sous-total</span><span>{Number(detail.subtotal).toFixed(2)} €</span></div>
                  {Number(detail.discount ?? 0) > 0 && <div className="flex justify-between text-primary"><span>Réduction {detail.promoCode}</span><span>-{Number(detail.discount).toFixed(2)} €</span></div>}
                  <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>{Number(detail.shipping).toFixed(2)} €</span></div>
                  <div className="flex justify-between font-medium pt-2 border-t border-border/30 mt-2"><span>Total</span><span className="text-primary">{Number(detail.total).toFixed(2)} €</span></div>
                </Box>
                {detail.paymentStatus === "paid" && detail.status !== "refunded" && (
                  <Button variant="outline" onClick={() => confirm("Rembourser ?") && action.mutate({ id: detail.id, op: "refund" })} className="rounded-full">
                    <RefreshCw className="h-3 w-3 mr-2" /> Rembourser
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Box({ label, children }: any) {
  return (
    <div className="bg-background/30 p-4 rounded-xl border border-border/30">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}
