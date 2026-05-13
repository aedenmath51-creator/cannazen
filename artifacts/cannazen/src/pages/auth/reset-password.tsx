import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  useSeo({ title: "Nouveau mot de passe" });
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const m = useMutation({
    mutationFn: () => apiPost("/auth/reset-password", { token, password }),
    onSuccess: () => { setDone(true); setTimeout(() => setLocation("/connexion"), 1500); },
  });

  return (
    <AuthShell title="Nouveau mot de passe">
      {done ? (
        <p className="text-center text-muted-foreground">Mot de passe modifié. Redirection…</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nouveau mot de passe</Label>
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
          </div>
          {m.isError && <p className="text-sm text-destructive">{(m.error as any).message}</p>}
          <Button type="submit" disabled={m.isPending || !token} className="w-full h-14 rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs">
            Définir mon mot de passe
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/connexion" className="hover:text-primary">Retour à la connexion</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
