import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  useSeo({ title: "Créer un compte", description: "Rejoignez la communauté CannaZen." });
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState({ firstName: "", lastName: "", email: "", password: "", newsletterOptIn: false, ageConfirm: false, termsConfirm: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.ageConfirm || !data.termsConfirm) {
      toast({ title: "Validation requise", description: "Vous devez confirmer votre âge et accepter les CGV.", variant: "destructive" });
      return;
    }
    signup.mutate({
      email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName, newsletterOptIn: data.newsletterOptIn,
    }, {
      onSuccess: () => {
        toast({ title: "Compte créé", description: "Un email de vérification vient de vous être envoyé." });
        setLocation("/mon-compte");
      },
      onError: (err: any) => toast({ title: "Échec", description: err.message ?? "Inscription impossible.", variant: "destructive" }),
    });
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez le cercle CannaZen"
      footer={<>Déjà inscrit ? <Link href="/connexion" className="text-primary hover:underline">Se connecter</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs uppercase tracking-widest text-muted-foreground">Prénom</Label>
            <Input id="firstName" required value={data.firstName} onChange={(e) => setData({ ...data, firstName: e.target.value })} className="h-12 bg-background/50 rounded-xl" data-testid="input-firstname" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs uppercase tracking-widest text-muted-foreground">Nom</Label>
            <Input id="lastName" required value={data.lastName} onChange={(e) => setData({ ...data, lastName: e.target.value })} className="h-12 bg-background/50 rounded-xl" data-testid="input-lastname" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input id="email" type="email" required value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="h-12 bg-background/50 rounded-xl" data-testid="input-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
          <Input id="password" type="password" required minLength={8} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} className="h-12 bg-background/50 rounded-xl" data-testid="input-password" />
          <p className="text-xs text-muted-foreground">8 caractères minimum</p>
        </div>
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={data.ageConfirm} onCheckedChange={(v) => setData({ ...data, ageConfirm: !!v })} data-testid="checkbox-age" />
            <span className="text-muted-foreground">Je certifie avoir 18 ans ou plus.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={data.termsConfirm} onCheckedChange={(v) => setData({ ...data, termsConfirm: !!v })} data-testid="checkbox-terms" />
            <span className="text-muted-foreground">J'accepte les <Link href="/cgv" className="text-primary underline">CGV</Link> et la <Link href="/confidentialite" className="text-primary underline">politique de confidentialité</Link>.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={data.newsletterOptIn} onCheckedChange={(v) => setData({ ...data, newsletterOptIn: !!v })} />
            <span className="text-muted-foreground">Je souhaite recevoir la newsletter (optionnel).</span>
          </label>
        </div>
        <Button type="submit" disabled={signup.isPending} className="w-full h-14 rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs" data-testid="button-signup">
          {signup.isPending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </AuthShell>
  );
}
