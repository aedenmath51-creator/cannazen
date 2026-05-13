import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminProducts() {
  useSeo({ title: "Produits", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: products } = useQuery<any[]>({ queryKey: ["admin", "products"], queryFn: () => apiGet("/admin/products") });
  const { data: categories } = useQuery<any[]>({ queryKey: ["admin", "categories"], queryFn: () => apiGet("/admin/categories") });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (p: any) => p.id ? apiPut(`/admin/products/${p.id}`, p) : apiPost("/admin/products", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); setEditing(null); toast({ title: "Produit enregistré" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); toast({ title: "Produit supprimé" }); },
  });

  return (
    <AdminShell title="Produits" actions={
      <Button onClick={() => setEditing({ name: "", slug: "", price: 0, isActive: true, weightGrams: 50 })} className="rounded-full bg-primary text-primary-foreground" data-testid="admin-new-product">
        <Plus className="h-4 w-4 mr-2" /> Nouveau produit
      </Button>
    }>
      <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden hairline-gold">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b border-border/40">
            <tr>
              <th className="text-left p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">Produit</th>
              <th className="text-left p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">Catégorie</th>
              <th className="text-right p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">Prix</th>
              <th className="text-right p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">Stock</th>
              <th className="text-center p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">État</th>
              <th className="text-right p-4 font-medium text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {products?.map((p) => (
              <tr key={p.id} className="hover:bg-background/30" data-testid={`admin-product-${p.id}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} className="w-10 h-10 rounded object-cover" alt={p.name} />}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{categories?.find((c) => c.id === p.categoryId)?.name ?? "—"}</td>
                <td className="p-4 text-right">{Number(p.price).toFixed(2)} €</td>
                <td className="p-4 text-right">{p.stock ?? "∞"}</td>
                <td className="p-4 text-center">
                  {p.isActive ? <Eye className="h-4 w-4 text-primary inline" /> : <EyeOff className="h-4 w-4 text-muted-foreground inline" />}
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)} data-testid={`admin-edit-${p.id}`}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm(`Supprimer "${p.name}" ?`) && remove.mutate(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl italic">{editing?.id ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nom" v={editing.name} on={(v) => setEditing({ ...editing, name: v })} required />
                <Field label="Slug" v={editing.slug} on={(v) => setEditing({ ...editing, slug: v })} required />
                <Field label="Prix (€)" type="number" step="0.01" v={editing.price} on={(v) => setEditing({ ...editing, price: v })} required />
                <Field label="Stock" type="number" v={editing.stock ?? ""} on={(v) => setEditing({ ...editing, stock: v ? Number(v) : null })} />
                <Field label="Poids (g)" type="number" v={editing.weightGrams ?? 50} on={(v) => setEditing({ ...editing, weightGrams: Number(v) })} />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Catégorie</Label>
                  <select value={editing.categoryId ?? ""} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })} className="w-full h-12 bg-background/50 border border-border/40 rounded-xl px-3">
                    <option value="">—</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field label="Image URL" v={editing.imageUrl ?? ""} on={(v) => setEditing({ ...editing, imageUrl: v })} className="sm:col-span-2" />
                <Field label="Souche / variété" v={editing.strain ?? ""} on={(v) => setEditing({ ...editing, strain: v })} />
                <Field label="N° de lot" v={editing.batchNumber ?? ""} on={(v) => setEditing({ ...editing, batchNumber: v })} />
                <Field label="URL du COA" v={editing.coaPdfUrl ?? ""} on={(v) => setEditing({ ...editing, coaPdfUrl: v })} className="sm:col-span-2" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="min-h-32 bg-background/50 rounded-xl" />
              </div>
              <div className="flex gap-6 flex-wrap">
                <Toggle label="Actif" v={editing.isActive ?? true} on={(v) => setEditing({ ...editing, isActive: v })} />
                <Toggle label="Best-seller" v={editing.isBestseller ?? false} on={(v) => setEditing({ ...editing, isBestseller: v })} />
                <Toggle label="Nouveau" v={editing.isNew ?? false} on={(v) => setEditing({ ...editing, isNew: v })} />
                <Toggle label="Bio" v={editing.isOrganic ?? false} on={(v) => setEditing({ ...editing, isOrganic: v })} />
                <Toggle label="Mis en avant" v={editing.isFeatured ?? false} on={(v) => setEditing({ ...editing, isFeatured: v })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="rounded-full bg-primary text-primary-foreground" data-testid="admin-save-product">Enregistrer</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-full">Annuler</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

interface FieldProps {
  label: string;
  v: string | number;
  on: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  step?: string;
}
function Field({ label, v, on, type = "text", required, className, step }: FieldProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type={type} step={step} value={v} required={required} onChange={(e) => on(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
    </div>
  );
}
interface ToggleProps {
  label: string;
  v: boolean;
  on: (v: boolean) => void;
}
function Toggle({ label, v, on }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={v} onCheckedChange={(c) => on(c === true)} /> {label}
    </label>
  );
}
