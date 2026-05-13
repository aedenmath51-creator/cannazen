import { useQuery } from "@tanstack/react-query";
import { AccountShell } from "@/components/account-shell";
import { useSeo } from "@/hooks/use-seo";
import { apiGet } from "@/lib/api";
import { Award, Gift, Plus } from "lucide-react";

const TIER_PERKS: Record<string, string[]> = {
  bronze: ["1€ dépensé = 1 point", "Newsletter exclusive", "Cadeau anniversaire"],
  silver: ["Tous les avantages Bronze", "5% sur toute la boutique", "Livraison offerte dès 39€"],
  gold: ["Tous les avantages Argent", "10% sur toute la boutique", "Précommandes en avant-première", "Coffret découverte annuel"],
};

export default function AccountLoyalty() {
  useSeo({ title: "Programme fidélité", noindex: true });
  const { data: loyalty } = useQuery({ queryKey: ["me", "loyalty"], queryFn: () => apiGet<any>("/me/loyalty") });

  const points = loyalty?.points ?? 0;
  const tier = loyalty?.tier ?? "bronze";
  const tierLabel = loyalty?.tierLabel ?? "Bronze";
  const nextThreshold = loyalty?.nextThreshold;
  const progress = nextThreshold ? Math.min(100, (points / nextThreshold) * 100) : 100;

  return (
    <AccountShell title="Programme fidélité">
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 rounded-3xl p-10 hairline-gold">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Niveau actuel</p>
              <h2 className="font-serif text-3xl italic text-foreground">{tierLabel}</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Mes points</div>
              <div className="font-serif text-5xl text-foreground" data-testid="loyalty-points">{points}</div>
            </div>
            {nextThreshold && (
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Vers le prochain palier</div>
                <div className="font-serif text-2xl text-foreground mb-2">{nextThreshold - points} points</div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-serif text-lg mb-4">Vos avantages</h3>
            <ul className="space-y-2">
              {(TIER_PERKS[tier] ?? []).map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Gift className="h-4 w-4 text-primary" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-card/40 border border-border/40 rounded-2xl p-8 hairline-gold">
          <h3 className="font-serif text-2xl italic mb-6">Historique des points</h3>
          {loyalty?.transactions && loyalty.transactions.length > 0 ? (
            <div className="divide-y divide-border/30">
              {loyalty.transactions.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-foreground">{t.reason}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div className={`font-medium ${t.points >= 0 ? "text-primary" : "text-destructive"}`}>
                    {t.points >= 0 ? "+" : ""}{t.points}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-3 opacity-40" />
              Passez votre première commande pour gagner vos premiers points.
            </p>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
