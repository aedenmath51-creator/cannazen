import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListFeaturedProducts, useSubscribeNewsletter, useGetProductStats, useListCategories, useListReviews } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Leaf, ShieldCheck, Sparkles, Moon, Zap, Truck, FlaskConical, Award, Headset, Star } from "lucide-react";
import { LotusLogo } from "@/components/lotus-logo";
import { PigeonBanner as PigeonDeliveryBanner } from "@/components/ui/PigeonBanner";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";

const ROTATING_WORDS = ["Détente", "Bien-être", "Sommeil", "Sérénité", "Focus"];
const MARQUEE_ITEMS = [
  "Livraison offerte dès 49€", 
  "THC < 0.3% · 100% légal en France", 
  "Cannabis d'exception cultivé avec soin", 
  "Expédition sous 24h", 
  "Gamme complète CBD · D10 · OH+", 
  "Paiement sécurisé · Crypto acceptées", 
  "Produits testés en laboratoire", 
  "Conseils personnalisés disponibles"
];

export default function Home() {
  useSeo({
    title: "CannaZen — L'apothicaire botanique de la nuit",
    description: "Boutique CBD française d'exception : fleurs, huiles sublinguales, résines et infusions certifiées. Livraison discrète 24h, THC < 0,3 %, qualité garantie en laboratoire.",
    canonical: "https://cannazen.fr/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CannaZen",
      url: "https://cannazen.fr",
      logo: "https://cannazen.fr/logo.png",
      sameAs: ["https://www.instagram.com/cannazen", "https://www.facebook.com/cannazen"],
      address: { "@type": "PostalAddress", streetAddress: "12 rue de la Botanique", postalCode: "69001", addressLocality: "Lyon", addressCountry: "FR" },
    },
  });
  const { data: featuredProducts, isLoading: productsLoading } = useListFeaturedProducts();
  const { data: categories } = useListCategories();
  const { data: stats } = useGetProductStats();
  const firstFeaturedId = featuredProducts?.[0]?.id;
  const { data: reviews } = useListReviews(
    { productId: firstFeaturedId ?? 0 },
    { query: { enabled: !!firstFeaturedId } as any }
  );
  
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [wordIndex, setWordIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  
  const subscribe = useSubscribeNewsletter({
    mutation: {
      onSuccess: () => {
        toast({ title: "Inscription réussie", description: "Bienvenue dans le cercle CannaZen." });
        setEmail("");
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de s'inscrire.", variant: "destructive" });
      }
    }
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ data: { email } });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const interval = setInterval(() => {
        setReviewIndex((prev) => (prev + 1) % Math.min(reviews.length, 3));
      }, 6000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [reviews]);

  const displayStats = {
    products: stats?.totalProducts || 28,
    categories: stats?.totalCategories || 7,
    rating: stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "4.9"
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-12 pb-20 overflow-hidden">
        <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm mb-12 text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground"
          >
            <span className="text-primary">+</span>
            Cannabis légal
            <span className="text-border">·</span>
            <ShieldCheck className="w-3 h-3 text-primary" />
            THC &lt; 0.3%
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="mb-12"
          >
            <LotusLogo size={88} className="text-secondary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-serif mb-10 leading-[1.05] tracking-tight"
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl text-foreground">L'univers de</span>
            <span className="block text-6xl md:text-8xl lg:text-9xl italic text-secondary mt-1">Mary Jane</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2 mb-10"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">Pour votre</span>
            <div className="relative inline-flex items-baseline min-w-[140px] md:min-w-[180px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="font-serif italic text-3xl md:text-4xl text-primary"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mb-12 leading-relaxed"
          >
            Sélection premium de fleurs CBD, D10, OH+, résines, vapes et huiles biologiques. L'excellence du cannabis légal français.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              className="bg-transparent text-secondary border border-secondary hover:bg-secondary hover:text-secondary-foreground font-sans tracking-[0.2em] uppercase text-xs h-14 px-9 rounded-full transition-all duration-500"
            >
              <Link href="/boutique">Découvrir la boutique →</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-card/60 backdrop-blur-sm text-foreground border-border hover:bg-muted/60 font-sans tracking-[0.2em] uppercase text-xs h-14 px-9 rounded-full transition-all duration-500"
            >
              <Link href="/quiz">Quiz personnalisé</Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll Mouse Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-50 pointer-events-none">
          <div className="w-[26px] h-[40px] rounded-full border border-muted-foreground flex justify-center p-1">
            <motion.div 
              animate={{ y: [0, 15, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1.5 bg-muted-foreground rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Stats Strip - in normal flow, no overlap with hero buttons */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="w-full border-y border-border/40 bg-background/40 backdrop-blur-md hidden md:block relative z-20"
      >
        <div className="container mx-auto px-6 py-6 flex justify-between items-center max-w-4xl divide-x divide-border/40">
          <div className="flex flex-col items-center flex-1">
            <span className="font-serif text-3xl text-foreground mb-1">{displayStats.products}</span>
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Produits premium</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-serif text-3xl text-foreground mb-1">{displayStats.categories}</span>
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Catégories</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-serif text-3xl text-primary mb-1 flex items-baseline">{displayStats.rating}<Star className="w-4 h-4 ml-1 fill-primary" /></span>
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Note moyenne</span>
          </div>
        </div>
      </motion.div>

      {/* Pigeon delivery banner */}
      <section className="container mx-auto px-6 py-12 relative z-20">
        <PigeonDeliveryBanner />
      </section>

      {/* Infinite Marquee */}
      <div className="w-full bg-card py-4 overflow-hidden flex border-y border-border/40 relative z-20">
        <div className="flex w-fit animate-marquee hover:[animation-play-state:paused]">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center whitespace-nowrap px-6">
              <Sparkles className="w-3.5 h-3.5 text-primary mr-6" />
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nos meilleurs produits */}
      <section className="py-32 container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-4">
              <div className="w-8 h-px bg-primary/50" />
              Sélection du concierge
            </div>
            <h2 className="font-serif text-5xl text-foreground">
              Nos meilleurs <span className="italic text-primary">produits</span>
            </h2>
          </div>
          <Link href="/boutique" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
            Voir tout <div className="w-8 h-px bg-border group-hover:bg-primary transition-colors" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-card rounded-2xl aspect-[4/5] border border-border/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Toutes nos catégories */}
      <section className="py-32 bg-card/30 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-4 justify-center">
            <div className="w-8 h-px bg-primary/50" />
            Galerie Botanique
            <div className="w-8 h-px bg-primary/50" />
          </div>
          <h2 className="font-serif text-5xl text-center mb-20 text-foreground">
            Toutes nos <span className="italic text-primary">catégories</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-12 max-w-6xl mx-auto">
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/boutique?category=${cat.slug}`} className="group block">
                <article className="flex flex-col h-full pb-6 border-b border-border/40 group-hover:border-primary/50 transition-colors duration-500">
                  <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground/70 mb-3">
                    {String(cat.productCount).padStart(2, "0")} {cat.productCount > 1 ? "créations" : "création"}
                  </div>
                  <h3 className="font-serif text-2xl md:text-[1.6rem] leading-tight text-foreground group-hover:text-primary transition-colors duration-500 mb-4">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                    {cat.description || "Essences naturelles cultivées avec passion, récoltées à maturité parfaite."}
                  </p>
                  <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-primary inline-flex items-center gap-2 mt-auto">
                    Explorer
                    <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* L'excellence à chaque étape */}
      <section className="py-32 container mx-auto px-6">
        <div className="text-center mb-20">
          <div className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-4 justify-center">
            <div className="w-8 h-px bg-primary/50" />
            Pourquoi nous choisir
            <div className="w-8 h-px bg-primary/50" />
          </div>
          <h2 className="font-serif text-5xl text-foreground">
            L'excellence à <span className="italic text-primary">chaque étape</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheck, title: "Paiement 100% Sécurisé", desc: "Transactions chiffrées SSL" },
            { icon: Leaf, title: "Qualité Certifiée Bio", desc: "Analyses laboratoires indépendants" },
            { icon: Truck, title: "Livraison Express 24-48h", desc: "Expédition sous 24h en semaine" },
            { icon: FlaskConical, title: "Transparence Totale", desc: "Chaque lot testé indépendamment" },
            { icon: Award, title: "Sélection Premium", desc: "Seul le meilleur 1% référencé" },
            { icon: Headset, title: "Support Client Expert", desc: "Conseillers disponibles 7j/7" }
          ].map((feature, i) => (
            <div key={i} className="group flex flex-col gap-4 pb-8 border-b border-border/40">
              <feature.icon className="w-4 h-4 text-primary/70" />
              <div>
                <h3 className="font-serif text-xl mb-1.5 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood/Quiz Section */}
      <section className="py-32 bg-card relative overflow-hidden border-y border-border/40">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-4 justify-center">
            <div className="w-8 h-px bg-primary/50" />
            Jardin Zen Interactif
            <div className="w-8 h-px bg-primary/50" />
          </div>
          <h2 className="font-serif text-5xl mb-6">Comment vous sentez-vous aujourd'hui ?</h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
            Choisissez votre humeur — nous vous guidons vers les produits qui lui correspondent.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8 max-w-3xl mx-auto mb-12">
            {[
              { id: "serenity", title: "Sérénité", desc: "Détente & calme", icon: Leaf },
              { id: "energy", title: "Énergie", desc: "Vitalité & clarté", icon: Zap },
              { id: "sleep", title: "Sommeil", desc: "Repos & récupération", icon: Moon },
              { id: "focus", title: "Focus", desc: "Concentration & flow", icon: Sparkles }
            ].map(mood => (
              <Link key={mood.id} href={`/quiz?mood=${mood.id}`} className="group flex flex-col items-center text-center gap-4 pb-6 border-b border-border/40 hover:border-primary/50 transition-colors duration-500">
                <mood.icon className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                <div>
                  <h3 className="font-serif text-xl mb-1 group-hover:text-primary transition-colors duration-300">{mood.title}</h3>
                  <p className="text-[11px] text-muted-foreground tracking-wide">{mood.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/quiz" className="inline-block text-sm font-medium tracking-widest uppercase text-primary border-b border-primary/30 pb-1 hover:border-primary transition-colors">
            Ou répondre au quiz complet →
          </Link>
        </div>
      </section>

      {/* Testimonial */}
      {reviews && reviews.length > 0 && (
        <section className="py-32 container mx-auto px-6 text-center max-w-4xl">
          <div className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-12 flex items-center gap-4 justify-center">
            <div className="w-8 h-px bg-primary/50" />
            Ils nous font confiance
            <div className="w-8 h-px bg-primary/50" />
          </div>
          
          <div className="h-[200px] flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={reviewIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="flex justify-center gap-1 mb-8 text-primary">
                  {[...Array(reviews[reviewIndex].rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary" />)}
                </div>
                <blockquote className="font-serif text-2xl md:text-4xl italic text-foreground mb-8 leading-snug">
                  "{reviews[reviewIndex].body}"
                </blockquote>
                <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
                  <span className="text-primary">{reviews[reviewIndex].authorName}</span>
                  {reviews[reviewIndex].authorLocation && <span> · {reviews[reviewIndex].authorLocation}</span>}
                  {reviews[reviewIndex].productVariant && <span> · {reviews[reviewIndex].productVariant}</span>}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-32 bg-card relative overflow-hidden border-t border-border/40">
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center max-w-2xl">
          <h2 className="font-serif text-5xl mb-6 italic text-foreground">Restez dans le jardin</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Nouveautés, offres exclusives et conseils du concierge directement dans votre boîte mail.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 w-full mb-6" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email" 
              className="flex-1 bg-background/50 border border-border/60 px-6 py-4 rounded-full focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <Button type="submit" disabled={subscribe.isPending} className="bg-transparent text-primary border border-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-[54px] px-8 rounded-full transition-all duration-300">
              {subscribe.isPending ? "..." : "S'inscrire"}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Désabonnement en un clic · Données protégées
          </p>
        </div>
      </section>

      {/* Footer Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
            {[
              { title: "Coffrets Surprise", desc: "Sélections thématiques · Jusqu'à -30%" },
              { title: "Nos Terroirs", desc: "Explorez les régions françaises" },
              { title: "Programme Fidélité", desc: "Gagnez des points · Récompenses exclusives" }
            ].map((card, i) => (
              <article key={i} className="group cursor-pointer flex flex-col gap-4 pb-8 border-b border-border/40 hover:border-primary/50 transition-colors duration-500">
                <h3 className="font-serif text-2xl group-hover:text-primary transition-colors duration-300">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.desc}</p>
                <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-primary inline-flex items-center gap-2">
                  Explorer
                  <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
