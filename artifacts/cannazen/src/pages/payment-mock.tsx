import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Lock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentMock() {
  useSeo({ title: "Paiement sécurisé", noindex: true });
  const { intentId } = useParams();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderId = Number(params.get("orderId"));

  const webhook = useMutation({ mutationFn: (outcome: "succeeded" | "failed") => apiPost("/payment/mock-webhook", { orderId, intentId, outcome }) });
  const [outcome, setOutcome] = useState<"succeeded" | "failed" | null>(null);

  const submit = (result: "succeeded" | "failed") => {
    webhook.mutate(result, {
      onSuccess: () => {
        setOutcome(result);
        if (result === "succeeded") setTimeout(() => setLocation(`/confirmation/${orderId}`), 1500);
      },
    });
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-xl min-h-[80vh]">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-center gap-2">
          <Lock className="h-3 w-3" /> Mode démo / preview
        </p>
        <h1 className="font-serif text-4xl italic text-foreground">Paiement</h1>
      </div>

      {!outcome ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/40 border border-border/40 rounded-3xl p-8 hairline-gold">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Page démonstration</p>
              <p className="text-sm">Sélectionnez le résultat à simuler ci-dessous</p>
            </div>
          </div>
          <div className="space-y-3 mb-8 text-sm text-muted-foreground bg-background/30 p-4 rounded-xl border border-border/30">
            <div className="flex justify-between"><span>Transaction</span><span className="font-mono text-xs">{intentId}</span></div>
            <div className="flex justify-between"><span>Commande</span><span>#{orderId}</span></div>
          </div>
          <div className="space-y-3">
            <Button disabled={webhook.isPending} onClick={() => submit("succeeded")} className="w-full h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 tracking-widest uppercase text-xs" data-testid="button-pay-success">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Simuler paiement réussi
            </Button>
            <Button disabled={webhook.isPending} onClick={() => submit("failed")} variant="outline" className="w-full h-14 rounded-full tracking-widest uppercase text-xs" data-testid="button-pay-fail">
              <XCircle className="h-4 w-4 mr-2" /> Simuler échec
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6 flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> En production : intégration PayPlug, Stripe ou équivalent
          </p>
        </motion.div>
      ) : outcome === "succeeded" ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card/40 border border-border/40 rounded-3xl p-12 text-center hairline-gold">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="font-serif text-3xl italic text-foreground mb-3">Paiement confirmé</h2>
          <p className="text-muted-foreground">Redirection vers votre commande…</p>
        </motion.div>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card/40 border border-border/40 rounded-3xl p-12 text-center hairline-gold">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="font-serif text-3xl italic text-foreground mb-3">Paiement refusé</h2>
          <p className="text-muted-foreground mb-6">La transaction n'a pas abouti.</p>
          <Button onClick={() => setLocation("/panier")} variant="outline" className="rounded-full">Retour au panier</Button>
        </motion.div>
      )}
    </div>
  );
}
