import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  useSeo({ title: "Console — Connexion", noindex: true });
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, {
      onSuccess: () => setLocation("/console-cz"),
      onError: (err: any) => toast({ title: "Échec", description: err.message ?? "Identifiants invalides.", variant: "destructive" }),
    });
  };

  return (
    <AuthShell title="Console CannaZen" subtitle="Accès administration">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email administrateur</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50 rounded-xl" data-testid="admin-email" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 rounded-xl" data-testid="admin-password" />
        </div>
        <Button type="submit" disabled={login.isPending} className="w-full h-14 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-xs" data-testid="admin-login">
          <ShieldCheck className="h-4 w-4 mr-2" /> Accéder à la console
        </Button>
      </form>
    </AuthShell>
  );
}
