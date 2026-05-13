import { Link, useLocation } from "wouter";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";

const CONTENT: Record<string, { title: string; subtitle: string; body: string }> = {
  "/a-propos": {
    title: "À propos",
    subtitle: "L'apothicaire botanique",
    body:
      "CannaZen est née d'une conviction : le cannabis légal français mérite la même exigence qu'un grand cru. Nous sélectionnons chaque variété, chaque résine et chaque huile auprès d'artisans passionnés, en France et en Europe, dans le respect strict de la réglementation (THC < 0,3 %).",
  },
  "/nos-terroirs": {
    title: "Nos terroirs",
    subtitle: "Provence · Ardèche · Pays Basque",
    body:
      "Chaque variété raconte un terroir. Du soleil sec de la Drôme aux brumes du Pays Basque, nos partenaires cultivent en plein air, en serre ou en indoor sous LED, toujours sans pesticides et avec des analyses laboratoire systématiques.",
  },
  "/coffrets": {
    title: "Coffrets",
    subtitle: "Sélections du concierge",
    body:
      "Nos coffrets thématiques rassemblent fleurs, huiles et accessoires autour d'un usage : Sommeil, Détente, Découverte, Cadeau. Une remise jusqu'à -30 % sur l'ensemble.",
  },
};

export default function ComingSoon() {
  const [path] = useLocation();
  const content = CONTENT[path] ?? CONTENT["/a-propos"];

  useSeo({ title: `${content.title} — CannaZen`, description: content.body.slice(0, 160) });

  return (
    <div className="container mx-auto px-6 py-32 max-w-3xl text-center">
      <div className="inline-flex h-16 w-16 rounded-full bg-secondary/15 items-center justify-center mb-8 border border-secondary/20">
        <Leaf className="h-7 w-7 text-secondary-foreground" />
      </div>
      <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{content.subtitle}</p>
      <h1 className="font-serif text-5xl md:text-7xl mb-8 italic">{content.title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto">{content.body}</p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-10">Page enrichie prochainement</p>
      <Button asChild className="rounded-full font-sans tracking-widest uppercase text-sm h-12 px-8 bg-transparent text-primary border border-primary hover:bg-primary hover:text-primary-foreground">
        <Link href="/boutique">Explorer la boutique →</Link>
      </Button>
    </div>
  );
}
