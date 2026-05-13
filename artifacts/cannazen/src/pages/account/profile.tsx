import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AccountProfile() {
  useSeo({ title: "Mon profil", noindex: true });
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", birthday: "", newsletterOptIn: false, marketingOptIn: false });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    if (user) setProfile({
      firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone: user.phone ?? "",
      birthday: user.birthday ? user.birthday.slice(0, 10) : "", newsletterOptIn: user.newsletterOptIn, marketingOptIn: user.marketingOptIn,
    });
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => apiPut("/me/profile", profile),
    onSuccess: () => { toast({ title: "Profil mis à jour" }); qc.invalidateQueries({ queryKey: ["auth", "me"] }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const changePwd = useMutation({
    mutationFn: () => apiPost("/auth/change-password", pwd),
    onSuccess: () => { toast({ title: "Mot de passe changé" }); setPwd({ currentPassword: "", newPassword: "" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <AccountShell title="Mon profil">
      <div className="space-y-8">
        <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="bg-card/40 border border-border/40 rounded-2xl p-8 hairline-gold space-y-5">
          <h2 className="font-serif text-2xl italic mb-4">Informations personnelles</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Prénom</Label>
              <Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nom</Label>
              <Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Téléphone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Date de naissance</Label>
              <Input type="date" value={profile.birthday} onChange={(e) => setProfile({ ...profile, birthday: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={profile.newsletterOptIn} onCheckedChange={(v) => setProfile({ ...profile, newsletterOptIn: !!v })} />
              <span className="text-muted-foreground">Je souhaite recevoir la newsletter</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={profile.marketingOptIn} onCheckedChange={(v) => setProfile({ ...profile, marketingOptIn: !!v })} />
              <span className="text-muted-foreground">J'accepte les offres marketing personnalisées</span>
            </label>
          </div>
          <Button type="submit" className="rounded-full bg-primary text-primary-foreground" data-testid="button-save-profile">Enregistrer</Button>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); changePwd.mutate(); }} className="bg-card/40 border border-border/40 rounded-2xl p-8 hairline-gold space-y-5">
          <h2 className="font-serif text-2xl italic mb-4">Changer mon mot de passe</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Mot de passe actuel</Label>
              <Input type="password" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nouveau mot de passe</Label>
              <Input type="password" required minLength={8} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} className="h-12 bg-background/50 rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="rounded-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground">Mettre à jour</Button>
        </form>
      </div>
    </AccountShell>
  );
}
