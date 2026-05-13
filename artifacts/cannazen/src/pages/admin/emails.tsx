import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";
import { Mail, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminEmails() {
  useSeo({ title: "Emails sortants", noindex: true });
  const { data: emails } = useQuery<any[]>({ queryKey: ["admin", "emails"], queryFn: () => apiGet("/admin/email-outbox") });
  const [open, setOpen] = useState<any | null>(null);

  return (
    <AdminShell title="Boîte d'envoi">
      <p className="text-xs text-muted-foreground mb-6 italic">Tous les emails déclenchés par la plateforme. En production, ils sont envoyés via Brevo / Mailgun. Ici en mode démo, ils sont seulement journalisés.</p>
      <div className="bg-card/40 border border-border/40 rounded-2xl divide-y divide-border/30 hairline-gold">
        {emails?.map((m) => (
          <button key={m.id} onClick={() => setOpen(m)} className="w-full text-left p-4 flex items-start gap-4 hover:bg-background/30" data-testid={`email-${m.id}`}>
            <Mail className="h-4 w-4 text-primary shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-4">
                <span className="font-medium truncate">{m.subject}</span>
                <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString("fr-FR")}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">→ {m.to} · {m.template} · {m.status}</div>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </button>
        ))}
        {!emails?.length && <div className="p-12 text-center text-muted-foreground">Aucun email envoyé.</div>}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader><DialogTitle className="font-serif text-2xl italic">{open.subject}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>De : <span className="text-foreground">{open.from ?? "noreply@cannazen.fr"}</span></div>
                <div>À : <span className="text-foreground">{open.to}</span></div>
                <div>Template : <span className="text-foreground">{open.template}</span></div>
                <div>Statut : <span className="text-foreground">{open.status}</span></div>
              </div>
              <div className="border-t border-border/40 pt-4 mt-4">
                <iframe srcDoc={open.bodyHtml ?? open.body ?? ""} title="email" className="w-full h-[60vh] bg-white rounded-xl" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
