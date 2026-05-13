import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  useSeo({ title: "Mot de passe oublié" });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const m = useMutation({ mutationFn: (e: string) => apiPost("/auth/request-password-reset", { email: e }) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    m.mutate(email, { onSuccess: () => setSent(true), onError: () => setSent(true) });
  };

  return (
    <AuthShell title="Mot de passe oublié" subtitle={sent ? "Vérifiez votre boîte mail" : "Entrez votre email"}>
      {sent ? (
        <p className="text-center text-muted-foreground">Si un compte existe pour cette adresse, vous recevrez un lien de réinitialisation valable 1 heure.</p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
          </div>
          <Button type="submit" disabled={m.isPending} className="w-full h-14 rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs">
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
