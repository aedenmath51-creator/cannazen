import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountShell } from "@/components/account-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, MapPin, Star } from "lucide-react";

type Address = {
  id: number;
  label?: string;
  firstName: string; lastName: string; company?: string;
  street: string; street2?: string; city: string; postalCode: string; country: string; phone?: string;
  isDefaultShipping: boolean; isDefaultBilling: boolean;
};

export default function AccountAddresses() {
  useSeo({ title: "Mes adresses", noindex: true });
  const qc = useQueryClient();
  const { data: addresses } = useQuery({ queryKey: ["me", "addresses"], queryFn: () => apiGet<Address[]>("/me/addresses") });
  const [editing, setEditing] = useState<Partial<Address> | null>(null);

  const create = useMutation({
    mutationFn: (a: Partial<Address>) => apiPost("/me/addresses", a),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me", "addresses"] }); setEditing(null); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...rest }: any) => apiPut(`/me/addresses/${id}`, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me", "addresses"] }); setEditing(null); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/me/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "addresses"] }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if ((editing as any).id) update.mutate(editing as any);
    else create.mutate(editing);
  };

  return (
    <AccountShell title="Mes adresses">
      <div className="space-y-6">
        {addresses && addresses.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold relative" data-testid={`address-${a.id}`}>
                {a.isDefaultShipping && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Livraison
                  </span>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <div className="flex-1">
                    {a.label && <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{a.label}</div>}
                    <div className="font-medium">{a.firstName} {a.lastName}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5 mb-4">
                  <div>{a.street}</div>
                  {a.street2 && <div>{a.street2}</div>}
                  <div>{a.postalCode} {a.city}</div>
                  <div>{a.country}</div>
                  {a.phone && <div>{a.phone}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)} className="rounded-full text-xs">Modifier</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)} className="rounded-full text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/40 border border-dashed border-border/40 rounded-2xl p-12 text-center">
            <MapPin className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-6">Vous n'avez pas encore enregistré d'adresse.</p>
          </div>
        )}

        {!editing ? (
          <Button onClick={() => setEditing({ country: "FR", isDefaultShipping: true })} className="w-full md:w-auto rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground" data-testid="button-add-address">
            <Plus className="h-4 w-4 mr-2" /> Ajouter une adresse
          </Button>
        ) : (
          <form onSubmit={submit} className="bg-card/40 border border-border/40 rounded-2xl p-6 hairline-gold space-y-4">
            <h3 className="font-serif text-xl mb-4 italic">{(editing as any).id ? "Modifier l'adresse" : "Nouvelle adresse"}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Libellé (Maison, Bureau…)" v={editing.label ?? ""} onChange={(v) => setEditing({ ...editing, label: v })} />
              <Field label="Téléphone" v={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
              <Field label="Prénom" required v={editing.firstName ?? ""} onChange={(v) => setEditing({ ...editing, firstName: v })} />
              <Field label="Nom" required v={editing.lastName ?? ""} onChange={(v) => setEditing({ ...editing, lastName: v })} />
              <Field label="Adresse" required v={editing.street ?? ""} onChange={(v) => setEditing({ ...editing, street: v })} className="sm:col-span-2" />
              <Field label="Complément" v={editing.street2 ?? ""} onChange={(v) => setEditing({ ...editing, street2: v })} className="sm:col-span-2" />
              <Field label="Code postal" required v={editing.postalCode ?? ""} onChange={(v) => setEditing({ ...editing, postalCode: v })} />
              <Field label="Ville" required v={editing.city ?? ""} onChange={(v) => setEditing({ ...editing, city: v })} />
              <Field label="Pays" required v={editing.country ?? "FR"} onChange={(v) => setEditing({ ...editing, country: v })} />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!editing.isDefaultShipping} onCheckedChange={(v) => setEditing({ ...editing, isDefaultShipping: !!v })} />
                Adresse de livraison par défaut
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!editing.isDefaultBilling} onCheckedChange={(v) => setEditing({ ...editing, isDefaultBilling: !!v })} />
                Adresse de facturation par défaut
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="rounded-full bg-primary text-primary-foreground" data-testid="button-save-address">Enregistrer</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-full">Annuler</Button>
            </div>
          </form>
        )}
      </div>
    </AccountShell>
  );
}

function Field({ label, v, onChange, required, className }: { label: string; v: string; onChange: (v: string) => void; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input value={v} onChange={(e) => onChange(e.target.value)} required={required} className="h-12 bg-background/50 rounded-xl" />
    </div>
  );
}
