import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminBlog() {
  useSeo({ title: "Blog", noindex: true });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: posts } = useQuery<any[]>({ queryKey: ["admin", "blog", "posts"], queryFn: () => apiGet("/admin/blog/posts") });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (p: any) => p.id ? apiPut(`/admin/blog/posts/${p.id}`, p) : apiPost("/admin/blog/posts", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "blog", "posts"] }); setEditing(null); toast({ title: "Article enregistré" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/blog/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "blog", "posts"] }),
  });

  return (
    <AdminShell title="Articles du blog" actions={
      <Button onClick={() => setEditing({ title: "", slug: "", content: "", status: "draft" })} className="rounded-full bg-primary text-primary-foreground" data-testid="admin-new-post">
        <Plus className="h-4 w-4 mr-2" /> Nouvel article
      </Button>
    }>
      <div className="bg-card/40 border border-border/40 rounded-2xl divide-y divide-border/30 hairline-gold">
        {posts?.map((p) => (
          <div key={p.id} className="p-5 flex items-center justify-between gap-4" data-testid={`admin-post-${p.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {p.status === "published" ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium truncate">{p.title}</span>
              </div>
              <div className="text-xs text-muted-foreground">/{p.slug} · {p.status}{p.publishedAt && ` · publié le ${new Date(p.publishedAt).toLocaleDateString("fr-FR")}`}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Edit className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Supprimer ?") && remove.mutate(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {!posts?.length && <p className="p-12 text-center text-muted-foreground">Aucun article. Créez votre premier post.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl italic">{editing?.id ? "Modifier" : "Nouvel"} article</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
              <Field label="Titre" v={editing.title} on={(v: string) => setEditing({ ...editing, title: v, slug: editing.id ? editing.slug : v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") })} required />
              <Field label="Slug" v={editing.slug} on={(v: string) => setEditing({ ...editing, slug: v })} required />
              <Field label="Image de couverture (URL)" v={editing.coverImageUrl ?? ""} on={(v: string) => setEditing({ ...editing, coverImageUrl: v })} />
              <Field label="Auteur" v={editing.authorName ?? ""} on={(v: string) => setEditing({ ...editing, authorName: v })} />
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Extrait</Label>
                <Textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className="bg-background/50 rounded-xl min-h-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Contenu (HTML)</Label>
                <Textarea value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="bg-background/50 rounded-xl min-h-64 font-mono text-xs" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Statut</Label>
                  <select value={editing.status ?? "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full h-12 bg-background/50 border border-border/40 rounded-xl px-3">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <Field label="Meta-description" v={editing.metaDescription ?? ""} on={(v: string) => setEditing({ ...editing, metaDescription: v })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="rounded-full bg-primary text-primary-foreground" data-testid="admin-save-post">Enregistrer</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-full">Annuler</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({ label, v, on, type = "text", required }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type={type} value={v} required={required} onChange={(e) => on(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
    </div>
  );
}
