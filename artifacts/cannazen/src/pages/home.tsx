import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListFeaturedProducts, useSubscribeNewsletter, useGetProductStats, useListCategories, useListReviews } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Leaf, ShieldCheck, Sparkles, Moon, Zap, Truck, FlaskConical, Award, Headset, Star, ArrowRight } from "lucide-react";
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

      {/* ── HERO ── Deep forest gradient */}
      <section
        className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #071310 0%, #0e2a1a 40%, #1a3d28 70%, #0b1f14 100%)" }}
      >
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #3a7a50 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }} />
          <div className="absolute top-[30%] right-[25%] w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #5aa870 0%, transparent 70%)" }} />
        </div>

        {/* Geometric line grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center max-w-5xl pt-20 pb-28">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 text-[10px] font-medium tracking-[0.3em] uppercase"
            style={{ border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c", background: "rgba(201,168,76,0.08)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            Cannabis légal · THC &lt; 0.3%
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="mb-10"
          >
            <LotusLogo size={72} className="text-[#c9a84c] opacity-90" />
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="font-serif mb-6 leading-[1.0] tracking-tight"
          >
            <span className="block text-4xl md:text-6xl lg:text-7xl text-white/90 mb-2">L'univers de</span>
            <span
              className="block text-6xl md:text-8xl lg:text-[7rem] italic font-light"
              style={{ background: "linear-gradient(135deg, #d4a838 0%, #f0d080 50%, #c9a84c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              Mary Jane
            </span>
          </motion.h1>

          {/* Rotating word */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 mb-8"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-white/40">Pour votre</span>
            <div className="relative inline-flex items-baseline min-w-[150px] md:min-w-[200px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="font-serif italic text-3xl md:text-4xl text-[#b8d4a0]"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-base md:text-lg max-w-xl mb-12 leading-relaxed text-white/50"
          >
            Sélection premium de fleurs CBD, D10, OH+, résines et huiles biologiques. L'excellence du cannabis légal français.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/boutique">
              <button
                className="px-10 py-4 text-[11px] font-medium tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c870)", color: "#0a1a0a" }}
              >
                Découvrir la boutique
              </button>
            </Link>
            <Link href="/quiz">
              <button
                className="px-10 py-4 text-[11px] font-medium tracking-[0.25em] uppercase text-white/70 transition-all duration-300 hover:text-white hover:border-white/40"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Quiz personnalisé
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Stats strip at bottom of hero */}
        <div
          className="absolute bottom-0 left-0 right-0 hidden md:flex divide-x"
          style={{ borderTop: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)", divideColor: "rgba(201,168,76,0.2)" }}
        >
          {[
            { value: displayStats.products, label: "Produits premium" },
            { value: displayStats.categories, label: "Catégories" },
            { value: `${displayStats.rating}★`, label: "Note moyenne" },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-5 flex flex-col items-center" style={{ borderRight: i < 2 ? "1px solid rgba(201,168,76,0.15)" : "none" }}>
              <span className="font-serif text-2xl text-[#c9a84c] mb-0.5">{s.value}</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-white/40">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── Gold strip */}
      <div
        className="w-full py-3.5 overflow-hidden flex"
        style={{ background: "linear-gradient(90deg, #c9a84c, #e8c870, #c9a84c)", borderBottom: "1px solid #a88030" }}
      >
        <div className="flex w-fit animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center whitespace-nowrap px-8">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#0a1a0a]">{item}</span>
              <span className="ml-8 text-[#0a1a0a]/40">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PIGEON DELIVERY BANNER ── */}
      <section className="container mx-auto px-6 py-12">
        <PigeonDeliveryBanner />
      </section>

      {/* ── FEATURED PRODUCTS ── Warm cream */}
      <section className="py-24" style={{ background: "linear-gradient(180deg, #f5f0e8 0%, #ede6d8 100%)" }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-3" style={{ color: "#c9a84c" }}>
                <div className="w-8 h-px" style={{ background: "#c9a84c" }} />
                Sélection du concierge
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-[#0e1a10]">
                Nos meilleurs <span className="italic" style={{ color: "#5a7a40" }}>produits</span>
              </h2>
            </div>
            <Link href="/boutique" className="inline-flex items-center gap-3 text-[10px] font-medium tracking-[0.25em] uppercase transition-colors hover:opacity-70" style={{ color: "#5a7a40" }}>
              Voir toute la boutique <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse aspect-[4/5]" style={{ background: "#e4ddd3" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORIES ── Dark emerald */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #071310 0%, #0e2a1a 50%, #071812 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10 rounded-full"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-8 rounded-full"
            style={{ background: "radial-gradient(circle, #3a7a50 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "rgba(201,168,76,0.7)" }}>
              <div className="w-8 h-px" style={{ background: "rgba(201,168,76,0.5)" }} />
              Galerie Botanique
              <div className="w-8 h-px" style={{ background: "rgba(201,168,76,0.5)" }} />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-white">
              Toutes nos <span className="italic" style={{ background: "linear-gradient(135deg, #d4a838, #f0d080)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>catégories</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px" style={{ background: "rgba(201,168,76,0.15)" }}>
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/boutique?category=${cat.slug}`} className="group block">
                <div
                  className="p-8 h-full flex flex-col transition-all duration-500"
                  style={{ background: "linear-gradient(160deg, #0a1f12, #0e2a1a)", minHeight: 220 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(160deg, #122a1a, #1a3d26)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(160deg, #0a1f12, #0e2a1a)")}
                >
                  <div className="text-[9px] font-medium tracking-[0.3em] uppercase mb-4" style={{ color: "rgba(201,168,76,0.6)" }}>
                    {String(cat.productCount).padStart(2, "0")} créations
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl text-white mb-3 group-hover:text-[#f0d080] transition-colors duration-300">
                    {cat.name}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {cat.description || "Essences naturelles cultivées avec passion, récoltées à maturité parfaite."}
                  </p>
                  <div className="text-[9px] font-medium tracking-[0.3em] uppercase flex items-center gap-2 transition-all duration-300" style={{ color: "#c9a84c" }}>
                    Explorer
                    <span className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── Split green / cream */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "#5a7a40" }}>
              <div className="w-8 h-px" style={{ background: "#5a7a40" }} />
              Pourquoi nous choisir
              <div className="w-8 h-px" style={{ background: "#5a7a40" }} />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-[#0e1a10]">
              L'excellence à <span className="italic" style={{ color: "#5a7a40" }}>chaque étape</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#d4c8b0]">
            {[
              { icon: ShieldCheck, title: "Paiement 100% Sécurisé", desc: "Transactions chiffrées SSL · Crypto acceptées" },
              { icon: Leaf, title: "Qualité Certifiée Bio", desc: "Analyses laboratoires indépendants" },
              { icon: Truck, title: "Livraison Express 24-48h", desc: "Expédition sous 24h en semaine" },
              { icon: FlaskConical, title: "Transparence Totale", desc: "Chaque lot testé indépendamment" },
              { icon: Award, title: "Sélection Premium", desc: "Seul le meilleur 1% référencé" },
              { icon: Headset, title: "Support Client Expert", desc: "Conseillers disponibles 7j/7" }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-10 flex flex-col gap-5 transition-all duration-500 cursor-default"
                style={{
                  background: i % 2 === 0 ? "#f5f0e8" : "linear-gradient(135deg, #0e2218, #1a3326)",
                  borderRight: i % 3 !== 2 ? "1px solid #d4c8b0" : "none",
                  borderBottom: i < 3 ? "1px solid #d4c8b0" : "none",
                }}
              >
                <feature.icon className="w-5 h-5" style={{ color: i % 2 === 0 ? "#5a7a40" : "#c9a84c" }} />
                <div>
                  <h3 className="font-serif text-xl mb-2 transition-colors duration-300" style={{ color: i % 2 === 0 ? "#0e1a10" : "white" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: i % 2 === 0 ? "#5a4a3a" : "rgba(255,255,255,0.5)" }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOOD / QUIZ ── Forest green */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a3326 0%, #0e2218 50%, #1a3d26 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="12" r="1" fill="#c9a84c" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "rgba(201,168,76,0.7)" }}>
            <div className="w-8 h-px" style={{ background: "rgba(201,168,76,0.4)" }} />
            Jardin Zen Interactif
            <div className="w-8 h-px" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-white">Comment vous sentez-vous <span className="italic" style={{ background: "linear-gradient(135deg, #d4a838, #f0d080)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>aujourd'hui ?</span></h2>
          <p className="text-base mb-16 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            Choisissez votre humeur — nous vous guidons vers les produits qui lui correspondent.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {[
              { id: "serenity", title: "Sérénité", desc: "Détente & calme", icon: Leaf },
              { id: "energy", title: "Énergie", desc: "Vitalité & clarté", icon: Zap },
              { id: "sleep", title: "Sommeil", desc: "Repos & récupération", icon: Moon },
              { id: "focus", title: "Focus", desc: "Concentration & flow", icon: Sparkles }
            ].map(mood => (
              <Link key={mood.id} href={`/quiz?mood=${mood.id}`} className="group block">
                <div
                  className="p-8 text-center transition-all duration-400 cursor-pointer"
                  style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.1)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
                  }}
                >
                  <mood.icon className="h-5 w-5 mx-auto mb-5 transition-colors duration-300" style={{ color: "#c9a84c" }} />
                  <h3 className="font-serif text-xl mb-1 text-white group-hover:text-[#f0d080] transition-colors duration-300">{mood.title}</h3>
                  <p className="text-[11px] tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>{mood.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/quiz" className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] uppercase transition-colors hover:opacity-70" style={{ color: "#c9a84c" }}>
            Ou répondre au quiz complet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── Clean white */}
      {reviews && reviews.length > 0 && (
        <section className="py-24" style={{ background: "#ffffff" }}>
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-12 flex items-center gap-4 justify-center" style={{ color: "#5a7a40" }}>
              <div className="w-8 h-px" style={{ background: "#5a7a40" }} />
              Ils nous font confiance
              <div className="w-8 h-px" style={{ background: "#5a7a40" }} />
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
                  <div className="flex justify-center gap-1 mb-6" style={{ color: "#c9a84c" }}>
                    {[...Array(reviews[reviewIndex].rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#c9a84c]" />)}
                  </div>
                  <blockquote className="font-serif text-2xl md:text-3xl italic mb-6 leading-snug" style={{ color: "#0e1a10" }}>
                    "{reviews[reviewIndex].body}"
                  </blockquote>
                  <div className="text-sm font-medium tracking-widest uppercase" style={{ color: "#5a7a40" }}>
                    {reviews[reviewIndex].authorName}
                    {reviews[reviewIndex].authorLocation && <span style={{ color: "#8a7a67" }}> · {reviews[reviewIndex].authorLocation}</span>}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── Dark forest gradient */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #071310 0%, #0e2218 60%, #1a3326 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #c9a84c 0%, transparent 70%)" }} />
        </div>
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center max-w-lg">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-white italic">Restez dans le jardin</h2>
          <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
            Nouveautés, offres exclusives et conseils directement dans votre boîte mail.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 w-full mb-5" onSubmit={handleSubscribe}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="flex-1 px-5 py-3.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "white",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(201,168,76,0.7)")}
              onBlur={e => (e.target.style.borderColor = "rgba(201,168,76,0.3)")}
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="px-8 py-3.5 text-[10px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-90 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #c9a84c, #e8c870)", color: "#0a1a0a" }}
            >
              {subscribe.isPending ? "..." : "S'inscrire"}
            </button>
          </form>
          <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
            Désabonnement en un clic · Données protégées
          </p>
        </div>
      </section>

      {/* ── FOOTER CARDS ── Rich green */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #0e2218, #1a3326, #0e2218)" }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "rgba(201,168,76,0.2)" }}>
            {[
              { title: "Coffrets Surprise", desc: "Sélections thématiques · Jusqu'à -30%", href: "/boutique" },
              { title: "Nos Terroirs", desc: "Explorez les régions françaises", href: "/boutique" },
              { title: "Programme Fidélité", desc: "Gagnez des points · Récompenses exclusives", href: "/compte" }
            ].map((card, i) => (
              <Link key={i} href={card.href} className="group block">
                <div
                  className="p-10 h-full flex flex-col gap-4 transition-all duration-500 cursor-pointer"
                  style={{ background: "linear-gradient(160deg, #0a1f12, #0e2a1a)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(160deg, #122a1a, #1a3d26)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(160deg, #0a1f12, #0e2a1a)")}
                >
                  <h3 className="font-serif text-2xl md:text-3xl text-white group-hover:text-[#f0d080] transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{card.desc}</p>
                  <div className="text-[9px] font-medium tracking-[0.3em] uppercase flex items-center gap-2" style={{ color: "#c9a84c" }}>
                    Explorer
                    <span className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
