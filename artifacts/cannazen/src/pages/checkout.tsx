import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Leaf, ShieldCheck, Lock, Truck, MapPin, CheckCircle2, Tag, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ShippingOption = {
  id: string; label: string; carrier: string; service: string; minDays: number; maxDays: number;
  basePrice: number; freeFromAmount: number | null; finalPrice: number; requiresPickupPoint?: boolean;
};

type PickupPoint = { id: string; name: string; address: string; city: string; postalCode: string };

export default function Checkout() {
  useSeo({ title: "Paiement sécurisé", noindex: true });
  const [, setLocation] = useLocation();
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [contact, setContact] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", street2: "", city: "", postalCode: "", country: "FR",
  });
  const [carrier, setCarrier] = useState<string>("colissimo_home");
  const [pickupPointId, setPickupPointId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; freeShipping: boolean } | null>(null);
  const [acceptCgv, setAcceptCgv] = useState(false);

  useEffect(() => {
    if (user) {
      setContact((c) => ({ ...c, firstName: user.firstName ?? c.firstName, lastName: user.lastName ?? c.lastName, email: user.email ?? c.email, phone: user.phone ?? c.phone }));
    }
  }, [user]);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) setLocation("/panier");
  }, [cart, cartLoading, setLocation]);

  const subtotal = cart?.subtotal ?? 0;
  const totalWeight = cart?.items.reduce((s, i) => s + (i.product as any).weightGrams * i.quantity, 0) ?? 0;

  const { data: shippingOptions } = useQuery<ShippingOption[]>({
    queryKey: ["shipping", "options", subtotal, totalWeight, contact.country],
    queryFn: () => apiGet(`/shipping/options?subtotal=${subtotal}&weightGrams=${totalWeight}&country=${contact.country}`),
    enabled: subtotal > 0,
  });

  const selectedOption = shippingOptions?.find((o) => o.id === carrier);
  const requiresPickup = selectedOption?.requiresPickupPoint;

  const { data: pickupPoints } = useQuery<PickupPoint[]>({
    queryKey: ["shipping", "pickup", carrier, contact.postalCode],
    queryFn: () => apiGet(`/shipping/pickup-points?carrier=${carrier}&postalCode=${contact.postalCode}`),
    enabled: !!requiresPickup,
  });

  const shippingPrice = appliedPromo?.freeShipping ? 0 : (selectedOption?.finalPrice ?? 0);
  const discount = appliedPromo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + shippingPrice);

  const validatePromo = useMutation({
    mutationFn: () => apiPost("/promo/validate", { code: promoInput, subtotal }),
    onSuccess: (res: any) => {
      setAppliedPromo({ code: res.code, discount: res.discount, freeShipping: res.freeShipping });
      toast({ title: "Code appliqué", description: `Réduction de ${res.discount.toFixed(2)} €` });
      setPromoInput("");
    },
    onError: (err: any) => toast({ title: "Code invalide", description: err.message, variant: "destructive" }),
  });

  const createOrder = useMutation({
    mutationFn: () => apiPost("/orders", {
      firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone,
      shippingAddress: `${contact.address}${contact.street2 ? ", " + contact.street2 : ""}, ${contact.postalCode} ${contact.city}, ${contact.country}`,
      paymentMethod,
      shippingCarrier: carrier,
      shippingPickupPoint: pickupPointId || undefined,
      promoCode: appliedPromo?.code,
      ageConfirmed: true,
      acceptTerms: true,
    }),
    onSuccess: (order: any) => {
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      if (order.paymentHostedUrl) {
        const url = order.paymentHostedUrl.startsWith("/")
          ? `${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}${order.paymentHostedUrl}`
          : order.paymentHostedUrl;
        setLocation(url.replace((import.meta.env.BASE_URL || "/").replace(/\/$/, ""), ""));
      } else {
        setLocation(`/confirmation/${order.id}`);
      }
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message ?? "Commande impossible.", variant: "destructive" }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptCgv) { toast({ title: "CGV", description: "Vous devez accepter les conditions générales.", variant: "destructive" }); return; }
    if (requiresPickup && !pickupPointId) { toast({ title: "Point relais", description: "Sélectionnez un point relais.", variant: "destructive" }); return; }
    createOrder.mutate();
  };

  if (cartLoading) return <div className="p-32 text-center"><div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!cart || cart.items.length === 0) return null;

  const steps = [
    { n: 1, label: "Infos" },
    { n: 2, label: "Adresse" },
    { n: 3, label: "Livraison" },
    { n: 4, label: "Paiement" },
  ];

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <h1 className="font-serif text-5xl mb-10 text-center text-foreground">Paiement <span className="italic text-primary">sécurisé</span></h1>

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-0 mb-16 max-w-md mx-auto">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i === 3 ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-primary/10 text-primary"}`}>
                {s.n}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 hidden sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-primary/20 mx-1" />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-16">
        <form onSubmit={submit} className="lg:col-span-3 space-y-12">
          <Section step="I." title="Informations personnelles">
            <Grid>
              <Field label="Prénom" required v={contact.firstName} on={(v) => setContact({ ...contact, firstName: v })} testId="checkout-firstname" />
              <Field label="Nom" required v={contact.lastName} on={(v) => setContact({ ...contact, lastName: v })} testId="checkout-lastname" />
              <Field label="Email" type="email" required v={contact.email} on={(v) => setContact({ ...contact, email: v })} className="md:col-span-2" testId="checkout-email" />
              <Field label="Téléphone" type="tel" v={contact.phone} on={(v) => setContact({ ...contact, phone: v })} className="md:col-span-2" />
            </Grid>
          </Section>

          <Section step="II." title="Adresse de livraison">
            <Grid>
              <Field label="Adresse" required v={contact.address} on={(v) => setContact({ ...contact, address: v })} className="md:col-span-2" testId="checkout-address" />
              <Field label="Complément (étage, bât.)" v={contact.street2} on={(v) => setContact({ ...contact, street2: v })} className="md:col-span-2" />
              <Field label="Ville" required v={contact.city} on={(v) => setContact({ ...contact, city: v })} testId="checkout-city" />
              <Field label="Code postal" required v={contact.postalCode} on={(v) => setContact({ ...contact, postalCode: v })} testId="checkout-postal" />
            </Grid>
          </Section>

          <Section step="III." title="Mode de livraison">
            <RadioGroup value={carrier} onValueChange={(v) => { setCarrier(v); setPickupPointId(""); }} className="space-y-3">
              {shippingOptions?.map((o) => (
                <label key={o.id} htmlFor={`ship-${o.id}`} className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${carrier === o.id ? "border-primary bg-primary/5 hairline-gold" : "border-border/40 bg-card/40 hover:border-primary/50"}`} data-testid={`shipping-${o.id}`}>
                  <RadioGroupItem value={o.id} id={`ship-${o.id}`} className="text-primary" />
                  <Truck className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-foreground">{o.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{o.minDays === o.maxDays ? `${o.minDays} j` : `${o.minDays}–${o.maxDays} j`} ouvré(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{o.finalPrice === 0 ? "Offert" : `${o.finalPrice.toFixed(2)} €`}</div>
                      {o.freeFromAmount && o.finalPrice > 0 && <div className="text-[10px] text-muted-foreground">offert dès {o.freeFromAmount}€</div>}
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>

            {requiresPickup && pickupPoints && pickupPoints.length > 0 && (
              <div className="mt-6 space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Choisir un point relais</Label>
                <RadioGroup value={pickupPointId} onValueChange={setPickupPointId} className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {pickupPoints.map((p) => (
                    <label key={p.id} htmlFor={`pp-${p.id}`} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${pickupPointId === p.id ? "border-primary bg-primary/5" : "border-border/40"}`} data-testid={`pickup-${p.id}`}>
                      <RadioGroupItem value={p.id} id={`pp-${p.id}`} className="text-primary mt-1" />
                      <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.address} · {p.postalCode} {p.city}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </Section>

          <Section step="IV." title="Paiement">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              {[
                { v: "card", label: "Carte bancaire", note: "Visa, Mastercard, AmEx — 3D Secure" },
                { v: "card_3x", label: "Paiement en 3× sans frais", note: "Pour les paniers > 100 €" },
                { v: "apple_pay", label: "Apple Pay", note: "Authentification biométrique" },
                { v: "google_pay", label: "Google Pay", note: "Paiement express" },
              ].map((p) => (
                <label key={p.v} htmlFor={`pay-${p.v}`} className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer ${paymentMethod === p.v ? "border-primary bg-primary/5 hairline-gold" : "border-border/40 bg-card/40 hover:border-primary/50"}`} data-testid={`payment-${p.v}`}>
                  <RadioGroupItem value={p.v} id={`pay-${p.v}`} className="text-primary" />
                  <div className="flex-1">
                    <div className="font-serif text-lg">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.note}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </Section>

          <div className="space-y-5 pt-4">
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input type="checkbox" checked={acceptCgv} onChange={(e) => setAcceptCgv(e.target.checked)} className="mt-1" data-testid="checkout-cgv" />
              <span>J'ai lu et j'accepte les <a href="/cgv" className="text-primary underline" target="_blank" rel="noopener noreferrer">conditions générales de vente</a> et certifie avoir 18 ans révolus.</span>
            </label>
            <Button type="submit" disabled={createOrder.isPending} size="lg" className="w-full h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(201,168,76,0.3)]" data-testid="button-place-order">
              {createOrder.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Traitement…</span>
              ) : `Régler ${total.toFixed(2)} €`}
            </Button>
            <p className="text-[10px] tracking-widest uppercase text-center text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-3 w-3 text-primary" /> Transactions 100 % sécurisées et chiffrées
            </p>
          </div>
        </form>

        <aside className="lg:col-span-2">
          <div className="bg-card/40 border border-border/40 p-8 rounded-3xl sticky top-28 hairline-gold inner-shadow-subtle">
            <h2 className="font-serif text-2xl mb-8 pb-6 border-b border-border/40">Le panier</h2>
            <div className="space-y-5 mb-8 max-h-[300px] overflow-y-auto pr-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-14 h-16 bg-background/50 rounded-lg overflow-hidden shrink-0 border border-border/40 relative">
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary/20 text-[8px] flex items-center justify-center text-primary font-bold">{item.quantity}</span>
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-primary uppercase tracking-widest">{item.product.categoryName}</div>
                      <div className="font-serif text-base leading-tight truncate">{item.product.name}</div>
                    </div>
                  </div>
                  <div className="text-muted-foreground shrink-0">{item.totalPrice.toFixed(2)} €</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/40 mb-4">
              {!appliedPromo ? (
                <div className="flex gap-2">
                  <Input placeholder="Code promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} className="h-11 bg-background/50 rounded-xl text-sm" data-testid="input-promo" />
                  <Button type="button" variant="outline" onClick={() => validatePromo.mutate()} disabled={!promoInput || validatePromo.isPending} className="h-11 rounded-xl" data-testid="button-apply-promo">
                    <Tag className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {appliedPromo.code}</span>
                  <button type="button" onClick={() => setAppliedPromo(null)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/40 text-sm">
              <Row label="Sous-total" v={`${subtotal.toFixed(2)} €`} />
              {discount > 0 && <Row label="Réduction" v={`-${discount.toFixed(2)} €`} accent />}
              <Row label="Livraison" v={shippingPrice === 0 ? "Offerte" : `${shippingPrice.toFixed(2)} €`} />
            </div>

            <div className="flex justify-between items-end mt-6 pt-4 border-t border-border/40">
              <span className="font-serif text-xl text-muted-foreground">Total</span>
              <span className="text-3xl font-serif text-primary" data-testid="checkout-total">{total.toFixed(2)} €</span>
            </div>

            <div className="mt-8 space-y-3 bg-background/30 p-4 rounded-2xl border border-border/30 text-xs text-muted-foreground">
              <div className="flex gap-2 items-start"><ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span><strong className="text-foreground">Colis discret.</strong> Emballage neutre, sans mention.</span></div>
              <div className="flex gap-2 items-start"><Leaf className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span><strong className="text-foreground">Produits certifiés.</strong> COA disponibles, THC &lt; 0,3 %.</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="relative">
      <div className="absolute -left-10 top-0 text-sm font-serif italic text-primary hidden md:block">{step}</div>
      <h2 className="font-serif text-3xl mb-8 border-b border-border/40 pb-4">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid md:grid-cols-2 gap-5">{children}</div>; }
interface CheckoutFieldProps {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  testId?: string;
}
function Field({ label, v, on, type = "text", required, className, testId }: CheckoutFieldProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type={type} value={v} required={required} onChange={(e) => on(e.target.value)} className="h-12 bg-background/50 rounded-xl" data-testid={testId} />
    </div>
  );
}
function Row({ label, v, accent }: { label: string; v: string | React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={accent ? "text-primary font-medium" : "text-foreground"}>{v}</span></div>
  );
}
