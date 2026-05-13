import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConsent } from "@/hooks/use-consent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, X, Settings2 } from "lucide-react";
import { Link } from "wouter";

export function CookieBanner() {
  const { hasResponded, loaded, save } = useConsent();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!loaded || hasResponded) return null;

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => save({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => save({ necessary: true, analytics, marketing });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-[80] p-4 md:p-6"
        data-testid="cookie-banner"
      >
        <div className="container mx-auto max-w-5xl bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40 hairline-gold">
          {!open ? (
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30 flex-shrink-0">
                  <Cookie className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-2 italic text-foreground">Vos préférences cookies</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nous utilisons des cookies pour assurer le fonctionnement du site (panier, session) et, avec votre accord,
                    mesurer notre audience et personnaliser nos contenus.{" "}
                    <Link href="/cookies" className="underline hover:text-primary">En savoir plus</Link>
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-xs uppercase tracking-widest" data-testid="cookies-customize">
                  <Settings2 className="h-3 w-3 mr-2" /> Personnaliser
                </Button>
                <Button variant="outline" size="sm" onClick={rejectAll} className="rounded-full text-xs uppercase tracking-widest border-muted/50" data-testid="cookies-reject">
                  Tout refuser
                </Button>
                <Button size="sm" onClick={acceptAll} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-widest" data-testid="cookies-accept-all">
                  Tout accepter
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl italic text-foreground">Personnaliser mes cookies</h3>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-start justify-between gap-4 p-4 bg-background/40 rounded-xl border border-border/40">
                  <div>
                    <div className="font-medium text-foreground mb-1">Cookies nécessaires</div>
                    <div className="text-xs text-muted-foreground">Indispensables au fonctionnement (panier, session, sécurité). Toujours actifs.</div>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-background/40 rounded-xl border border-border/40">
                  <div>
                    <div className="font-medium text-foreground mb-1">Mesure d'audience</div>
                    <div className="text-xs text-muted-foreground">Statistiques anonymisées de fréquentation pour améliorer le site.</div>
                  </div>
                  <Switch checked={analytics} onCheckedChange={setAnalytics} data-testid="toggle-analytics" />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-background/40 rounded-xl border border-border/40">
                  <div>
                    <div className="font-medium text-foreground mb-1">Marketing & personnalisation</div>
                    <div className="text-xs text-muted-foreground">Pour vous proposer des contenus et offres adaptés.</div>
                  </div>
                  <Switch checked={marketing} onCheckedChange={setMarketing} data-testid="toggle-marketing" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={rejectAll} className="rounded-full text-xs uppercase tracking-widest">Tout refuser</Button>
                <Button size="sm" onClick={saveCustom} className="rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-widest" data-testid="cookies-save">Enregistrer mes choix</Button>
                <Button size="sm" onClick={acceptAll} className="rounded-full bg-secondary text-secondary-foreground text-xs uppercase tracking-widest">Tout accepter</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
