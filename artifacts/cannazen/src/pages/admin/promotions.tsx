import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminPromotions() {
  useSeo({ title: "Codes promo", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: codes } = useQuery<any[]>({ queryKey: ["admin", "promo"], queryFn: () => apiGet("/admin/promo-codes") });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (p: any) => apiPost("/admin/promo-codes", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "promo"] }); setEditing(null); toast({ title: "Code créé" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/promo-codes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promo"] }),
  });

  return (
    <AdminShell title="Codes promotionnels" actions={
      <Button onClick={() => setEditing({ code: "", type: "percent", value: 10, isActive: true })} className="rounded-full bg-primary text-primary-foreground">
        <Plus className="h-4 w-4 mr-2" /> Nouveau code
      </Button>
    }>
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Code</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Valeur</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Min commande</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Utilisations</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-muted-foreground">Expire</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {codes?.map((c) => (
              <tr key={c.id} className="hover:bg-background/30">
                <td className="p-4 font-mono font-medium">{c.code}</td>
                <td className="p-4 text-muted-foreground">{c.type}</td>
                <td className="p-4 text-right">{c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? `${Number(c.value).toFixed(2)} €` : "Livraison"}</td>
                <td className="p-4 text-right text-muted-foreground">{c.minOrderAmount ? `${Number(c.minOrderAmount).toFixed(2)} €` : "—"}</td>
                <td className="p-4 text-right">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}</td>
                <td className="p-4 text-right text-xs text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="p-4 text-right"><Button size="sm" variant="ghost" onClick={() => confirm("Supprimer ?") && remove.mutate(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
              </tr>
            ))}
            {!codes?.length && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucun code promo créé.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-2xl italic">Nouveau code promo</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Code</Label>
                <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} required className="h-12 bg-background/50 rounded-xl uppercase font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
                  <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="w-full h-12 bg-background/50 border border-border/40 rounded-xl px-3">
                    <option value="percent">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                    <option value="free_shipping">Livraison offerte</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Valeur</Label>
                  <Input type="number" step="0.01" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Min commande (€)</Label>
                  <Input type="number" step="0.01" value={editing.minOrderAmount ?? ""} onChange={(e) => setEditing({ ...editing, minOrderAmount: e.target.value ? Number(e.target.value) : null })} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Utilisations max</Label>
                  <Input type="number" value={editing.maxUses ?? ""} onChange={(e) => setEditing({ ...editing, maxUses: e.target.value ? Number(e.target.value) : null })} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Limite par client</Label>
                  <Input type="number" value={editing.perUserLimit ?? ""} onChange={(e) => setEditing({ ...editing, perUserLimit: e.target.value ? Number(e.target.value) : null })} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Expire le</Label>
                  <Input type="date" value={editing.expiresAt ? editing.expiresAt.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value || null })} className="h-12 bg-background/50 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="rounded-full bg-primary text-primary-foreground">Créer</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-full">Annuler</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
