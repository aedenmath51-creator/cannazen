import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_unconfigured: "La connexion Google n'est pas encore configurée.",
  oauth_state: "Lien Google invalide ou expiré. Réessayez.",
  oauth_token: "Échec de l'échange Google. Réessayez.",
  oauth_userinfo: "Impossible de récupérer votre profil Google.",
  oauth_no_email: "Aucune adresse email associée à ce compte Google.",
  oauth_email_unverified: "Votre adresse Google n'est pas vérifiée. Vérifiez-la sur Google puis réessayez.",
  oauth_unknown: "Connexion Google indisponible. Réessayez plus tard.",
};

export default function LoginPage() {
  useSeo({ title: "Connexion", description: "Accédez à votre espace personnel CannaZen." });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const err = params.get("error");
    if (err && OAUTH_ERROR_MESSAGES[err]) {
      toast({ title: "Connexion Google", description: OAUTH_ERROR_MESSAGES[err], variant: "destructive" });
    }
  }, [search, toast]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, {
      onSuccess: () => {
        toast({ title: "Bienvenue", description: "Connexion réussie." });
        setLocation("/mon-compte");
      },
      onError: (err: any) => toast({ title: "Échec", description: err.message ?? "Email ou mot de passe invalide.", variant: "destructive" }),
    });
  };

  return (
    <AuthShell
      title="Connexion"
      subtitle="Bon retour parmi nous"
      footer={
        <>Pas encore de compte ? <Link href="/inscription" className="text-primary hover:underline" data-testid="link-signup">Créer un compte</Link></>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50 rounded-xl" data-testid="input-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 rounded-xl" data-testid="input-password" />
        </div>
        <div className="text-right text-xs">
          <Link href="/mot-de-passe-oublie" className="text-muted-foreground hover:text-primary">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" disabled={login.isPending} className="w-full h-14 rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs" data-testid="button-login">
          {login.isPending ? "Connexion…" : "Se connecter"}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">ou</span>
          </div>
        </div>

        <a
          href="/api/auth/google"
          className="w-full h-12 rounded-full bg-background/60 border border-border/60 hover:border-primary/40 hover:bg-background flex items-center justify-center gap-3 text-sm text-foreground transition-colors"
          data-testid="button-google-login"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Continuer avec Google
        </a>
      </form>
    </AuthShell>
  );
}
