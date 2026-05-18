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
    const interval = setInterval(() => setWordIndex(p => (p + 1) % ROTATING_WORDS.length), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reviews?.length) {
      const interval = setInterval(() => setReviewIndex(p => (p + 1) % Math.min(reviews.length, 3)), 6000);
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

      {/* ══════════════════════════════
          HERO — dégradé sage → crème → or pâle
      ══════════════════════════════ */}
      <section
        className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(145deg, #d4e8d8 0%, #eef5e8 20%, #faf6ed 45%, #f5ead8 70%, #ede0c8 100%)" }}
      >
        {/* Blobs de couleur */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, #b8d4a0 0%, #d4e8c4 40%, transparent 70%)" }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #e8c87050 0%, #f0d89060 40%, transparent 70%)" }} />
          <div className="absolute top-[40%] left-[15%] w-[300px] h-[300px] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #c8e0b0 0%, transparent 70%)" }} />
          <div className="absolute top-[20%] right-[30%] w-[200px] h-[200px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #f0c8a0 0%, transparent 70%)" }} />
        </div>

        <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center max-w-5xl pt-24 pb-32">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2 mb-10 text-[10px] font-medium tracking-[0.28em] uppercase"
            style={{ background: "linear-gradient(135deg, rgba(90,122,64,0.12), rgba(185,150,60,0.12))", border: "1px solid rgba(90,122,64,0.3)", color: "#4a6a38" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(135deg,#6a9a48,#c9a84c)" }} />
            Cannabis légal · THC &lt; 0.3%
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="mb-10"
          >
            <LotusLogo size={80} style={{ filter: "drop-shadow(0 4px 24px rgba(90,122,64,0.25))" }} className="text-[#5a7a40]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35 }}
            className="font-serif mb-6 leading-[1.0] tracking-tight"
          >
            <span className="block text-4xl md:text-6xl lg:text-7xl mb-3" style={{ color: "#1e3218" }}>L'univers de</span>
            <span
              className="block text-6xl md:text-8xl lg:text-[7rem] italic font-light"
              style={{ background: "linear-gradient(130deg, #4a7838 0%, #7aac50 30%, #c9a84c 60%, #e8b858 85%, #9a7230 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              Mary Jane
            </span>
          </motion.h1>

          {/* Rotating word */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 mb-8"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: "#7a8a72" }}>Pour votre</span>
            <div className="relative inline-flex min-w-[160px] md:min-w-[210px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="font-serif italic text-3xl md:text-4xl"
                  style={{ background: "linear-gradient(135deg, #5a7a40, #8aaa60, #c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.65 }}
            className="text-base md:text-lg max-w-xl mb-14 leading-relaxed" style={{ color: "#5a6a50" }}
          >
            Sélection premium de fleurs CBD, D10, OH+, résines et huiles biologiques. L'excellence du cannabis légal français.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/boutique">
              <button
                className="px-10 py-4 text-[11px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-85 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #5a7a40 0%, #7aaa58 50%, #8aba68 100%)", color: "white", boxShadow: "0 4px 24px rgba(90,122,64,0.3)" }}
              >
                Découvrir la boutique
              </button>
            </Link>
            <Link href="/quiz">
              <button
                className="px-10 py-4 text-[11px] font-medium tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-80"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08))", border: "1px solid rgba(201,168,76,0.5)", color: "#7a6230" }}
              >
                Quiz personnalisé
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Stats strip */}
        <div
          className="absolute bottom-0 left-0 right-0 hidden md:flex"
          style={{ background: "linear-gradient(90deg, rgba(90,122,64,0.12), rgba(201,168,76,0.12), rgba(90,122,64,0.12))", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(90,122,64,0.2)" }}
        >
          {[
            { value: displayStats.products, label: "Produits premium" },
            { value: displayStats.categories, label: "Catégories" },
            { value: `${displayStats.rating} ★`, label: "Note moyenne" },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-5 flex flex-col items-center" style={{ borderRight: i < 2 ? "1px solid rgba(90,122,64,0.15)" : "none" }}>
              <span className="font-serif text-2xl mb-0.5" style={{ background: "linear-gradient(135deg,#5a7a40,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</span>
              <span className="text-[9px] tracking-[0.22em] uppercase" style={{ color: "#7a8a72" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          MARQUEE — dégradé vert → or
      ══════════════════════════════ */}
      <div
        className="w-full py-3 overflow-hidden flex"
        style={{ background: "linear-gradient(90deg, #6a9a48 0%, #8ab858 20%, #c9a84c 50%, #e8c870 70%, #b89840 100%)" }}
      >
        <div className="flex w-fit animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center whitespace-nowrap px-8">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.92)" }}>{item}</span>
              <span className="ml-8 text-white/50">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          DELIVERY BANNER
      ══════════════════════════════ */}
      <section
        className="py-10"
        style={{ background: "linear-gradient(180deg, #eef5e8 0%, #f5f0e8 100%)" }}
      >
        <div className="container mx-auto px-6">
          <PigeonDeliveryBanner />
        </div>
      </section>

      {/* ══════════════════════════════
          PRODUITS — crème → vert doux
      ══════════════════════════════ */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(160deg, #f5f0e8 0%, #eef5e8 40%, #e8f0e0 70%, #f0ede4 100%)" }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-3" style={{ color: "#8aaa60" }}>
                <div className="w-8 h-px" style={{ background: "linear-gradient(90deg,#5a7a40,#c9a84c)" }} />
                Sélection du concierge
              </div>
              <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "#1e3218" }}>
                Nos meilleurs{" "}
                <span className="italic" style={{ background: "linear-gradient(135deg,#5a7a40,#8ab858,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>produits</span>
              </h2>
            </div>
            <Link href="/boutique" className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.25em] uppercase transition-opacity hover:opacity-60" style={{ color: "#5a7a40" }}>
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse aspect-[4/5]" style={{ background: "linear-gradient(135deg,#e4ddd3,#d8e4d0)" }} />
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

      {/* ══════════════════════════════
          CATÉGORIES — dégradé vert sauge clair
      ══════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #c8dfc0 0%, #d8ecd0 25%, #e8f4e0 50%, #d4e8c8 75%, #c0d8b8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, #f0e8c0 0%, transparent 65%)" }} />
          <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, #b0d0a0 0%, transparent 65%)" }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "#4a6a38" }}>
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg, transparent, #6a9a48)" }} />
              Galerie Botanique
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg, #6a9a48, transparent)" }} />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "#1e3218" }}>
              Toutes nos{" "}
              <span className="italic" style={{ background: "linear-gradient(135deg,#3a6028,#6aaa48,#c9a84c,#e8c870)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>catégories</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories?.map((cat, idx) => (
              <Link key={cat.id} href={`/boutique?category=${cat.slug}`} className="group block">
                <div
                  className="p-8 h-full flex flex-col transition-all duration-500 hover:shadow-xl"
                  style={{
                    background: [
                      "linear-gradient(135deg, #ffffff 0%, #f0f8e8 100%)",
                      "linear-gradient(135deg, #faf6ed 0%, #f0e8d8 100%)",
                      "linear-gradient(135deg, #eef5e8 0%, #dff0d4 100%)",
                      "linear-gradient(135deg, #fdf8f0 0%, #f5ead8 100%)",
                    ][idx % 4],
                    border: "1px solid rgba(90,122,64,0.15)",
                    minHeight: 200,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                >
                  <div className="text-[9px] font-medium tracking-[0.3em] uppercase mb-4" style={{ color: "#8aaa60" }}>
                    {String(cat.productCount).padStart(2, "0")} créations
                  </div>
                  <h3
                    className="font-serif text-xl md:text-2xl mb-3 transition-all duration-300"
                    style={{ color: "#1e3218" }}
                  >
                    {cat.name}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: "#6a7a60" }}>
                    {cat.description || "Essences naturelles cultivées avec passion, récoltées à maturité parfaite."}
                  </p>
                  <div
                    className="text-[9px] font-medium tracking-[0.3em] uppercase flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#5a7a40,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    Explorer
                    <span className="transition-transform duration-400 group-hover:translate-x-1.5" style={{ WebkitTextFillColor: "#c9a84c" }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES — dégradé or pâle → vert
      ══════════════════════════════ */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(160deg, #fdf8ec 0%, #f5f0e0 20%, #eef5e8 60%, #e8f0d8 100%)" }}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "#8aaa60" }}>
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,transparent,#8aaa60)" }} />
              Pourquoi nous choisir
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,#8aaa60,transparent)" }} />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "#1e3218" }}>
              L'excellence à{" "}
              <span className="italic" style={{ background: "linear-gradient(135deg,#c9a84c,#e8c870,#8ab858)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>chaque étape</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Paiement 100% Sécurisé", desc: "Transactions chiffrées SSL · Crypto acceptées", grad: "135deg, #d4ead8, #eef5e8" },
              { icon: Leaf, title: "Qualité Certifiée Bio", desc: "Analyses laboratoires indépendants", grad: "135deg, #fdf5e0, #f5ead0" },
              { icon: Truck, title: "Livraison Express 24-48h", desc: "Expédition sous 24h en semaine", grad: "135deg, #e8f0d8, #d8eac8" },
              { icon: FlaskConical, title: "Transparence Totale", desc: "Chaque lot testé indépendamment", grad: "135deg, #fdf0e0, #f5e4cc" },
              { icon: Award, title: "Sélection Premium", desc: "Seul le meilleur 1% référencé", grad: "135deg, #d8ead4, #cce0c4" },
              { icon: Headset, title: "Support Client Expert", desc: "Conseillers disponibles 7j/7", grad: "135deg, #f8f0e4, #ede4d0" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-9 flex flex-col gap-5 transition-all duration-400 hover:shadow-lg hover:-translate-y-1"
                style={{ background: `linear-gradient(${feature.grad})`, border: "1px solid rgba(90,122,64,0.12)" }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,rgba(90,122,64,0.15),rgba(201,168,76,0.15))", border: "1px solid rgba(90,122,64,0.2)" }}
                >
                  <feature.icon className="w-4 h-4" style={{ color: "#5a7a40" }} />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-2" style={{ color: "#1e3218" }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6a7a60" }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          QUIZ / HUMEURS — dégradé multicolore
      ══════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #c8dfc0 0%, #d8eed0 20%, #e8f5e0 40%, #f0ead4 65%, #e8d8c0 85%, #d8c8a8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[30%] w-[400px] h-[300px] rounded-full opacity-40"
            style={{ background: "radial-gradient(ellipse, #e8f0a0 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #c8e8b0 0%, transparent 70%)" }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4 flex items-center gap-4 justify-center" style={{ color: "#4a6a38" }}>
            <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,transparent,#6a9a48)" }} />
            Jardin Zen Interactif
            <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,#6a9a48,transparent)" }} />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4" style={{ color: "#1e3218" }}>
            Comment vous sentez-vous{" "}
            <span className="italic" style={{ background: "linear-gradient(135deg,#5a7a40,#9aba68,#c9a84c,#e8b858)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>aujourd'hui ?</span>
          </h2>
          <p className="text-base mb-16 max-w-xl mx-auto" style={{ color: "#5a6a50" }}>
            Choisissez votre humeur — nous vous guidons vers les produits qui lui correspondent.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl mx-auto mb-12">
            {[
              { id: "serenity", title: "Sérénité", desc: "Détente & calme", icon: Leaf, grad: "135deg, #d4ead8 0%, #c8e0c0 100%", hover: "135deg, #c0d8b4 0%, #aacca0 100%" },
              { id: "energy", title: "Énergie", desc: "Vitalité & clarté", icon: Zap, grad: "135deg, #fdf5d8 0%, #f5e8b8 100%", hover: "135deg, #f0e0a8 0%, #e8d094 100%" },
              { id: "sleep", title: "Sommeil", desc: "Repos & récupération", icon: Moon, grad: "135deg, #e0d4f0 0%, #d0c4e4 100%", hover: "135deg, #c8b8dc 0%, #b8a8d0 100%" },
              { id: "focus", title: "Focus", desc: "Concentration & flow", icon: Sparkles, grad: "135deg, #d4e8f0 0%, #c4d8e8 100%", hover: "135deg, #b4cce0 0%, #a4bcd4 100%" },
            ].map(mood => (
              <Link key={mood.id} href={`/quiz?mood=${mood.id}`} className="group block">
                <div
                  className="p-8 text-center transition-all duration-400 cursor-pointer hover:shadow-lg hover:-translate-y-1"
                  style={{ background: `linear-gradient(${mood.grad})`, border: "1px solid rgba(90,122,64,0.2)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(${mood.hover})`}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(${mood.grad})`}
                >
                  <mood.icon className="h-6 w-6 mx-auto mb-5" style={{ color: "#5a7a40" }} />
                  <h3 className="font-serif text-xl mb-1" style={{ color: "#1e3218" }}>{mood.title}</h3>
                  <p className="text-[11px] tracking-wide" style={{ color: "#6a7a60" }}>{mood.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/quiz" className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70" style={{ color: "#4a6a38" }}>
            Répondre au quiz complet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════
          AVIS — blanc pur, dégradé léger
      ══════════════════════════════ */}
      {reviews && reviews.length > 0 && (
        <section
          className="py-24"
          style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8faf5 50%, #f5f8f0 100%)" }}
        >
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <div className="text-[10px] font-medium tracking-[0.3em] uppercase mb-12 flex items-center gap-4 justify-center" style={{ color: "#8aaa60" }}>
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,transparent,#8aaa60)" }} />
              Ils nous font confiance
              <div className="w-10 h-px" style={{ background: "linear-gradient(90deg,#8aaa60,transparent)" }} />
            </div>

            <div className="h-[200px] flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewIndex}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(reviews[reviewIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4" style={{ fill: "#c9a84c", color: "#c9a84c" }} />
                    ))}
                  </div>
                  <blockquote className="font-serif text-2xl md:text-3xl italic mb-6 leading-snug" style={{ color: "#1e3218" }}>
                    "{reviews[reviewIndex].body}"
                  </blockquote>
                  <div className="text-sm font-medium tracking-widest uppercase" style={{ background: "linear-gradient(135deg,#5a7a40,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {reviews[reviewIndex].authorName}
                    {reviews[reviewIndex].authorLocation && <span style={{ WebkitTextFillColor: "#8a7a67", color: "#8a7a67" }}> · {reviews[reviewIndex].authorLocation}</span>}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          NEWSLETTER — dégradé vert sauge → or
      ══════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #a8c89c 0%, #b8d4a8 20%, #d4e8c0 40%, #e8dca8 65%, #dcc888 85%, #c8b470 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30"
            style={{ background: "radial-gradient(ellipse, #ffffff 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center max-w-lg">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 italic text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
            Restez dans le jardin
          </h2>
          <p className="text-base mb-10 text-white/80">
            Nouveautés, offres exclusives et conseils directement dans votre boîte mail.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 w-full mb-5" onSubmit={handleSubscribe}>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="flex-1 px-5 py-3.5 text-sm outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)", color: "#1e3218" }}
              onFocus={e => (e.target.style.background = "rgba(255,255,255,0.75)")}
              onBlur={e => (e.target.style.background = "rgba(255,255,255,0.5)")}
            />
            <button
              type="submit" disabled={subscribe.isPending}
              className="px-8 py-3.5 text-[10px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-90 whitespace-nowrap"
              style={{ background: "rgba(30,50,24,0.85)", color: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
            >
              {subscribe.isPending ? "..." : "S'inscrire"}
            </button>
          </form>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/60">
            Désabonnement en un clic · Données protégées
          </p>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER CARDS — dégradé sage
      ══════════════════════════════ */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(160deg, #e0ecd8 0%, #d0e4c8 30%, #c8dcbe 60%, #d4e0c8 100%)" }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Coffrets Surprise", desc: "Sélections thématiques · Jusqu'à -30%", href: "/boutique", grad: "135deg, #ffffff 0%, #f5f8ee 100%" },
              { title: "Nos Terroirs", desc: "Explorez les régions françaises", href: "/boutique", grad: "135deg, #fdf8ef 0%, #f8f0e0 100%" },
              { title: "Programme Fidélité", desc: "Gagnez des points · Récompenses exclusives", href: "/compte", grad: "135deg, #f0f8e8 0%, #e8f4de 100%" }
            ].map((card, i) => (
              <Link key={i} href={card.href} className="group block">
                <div
                  className="p-10 h-full flex flex-col gap-4 transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                  style={{ background: `linear-gradient(${card.grad})`, border: "1px solid rgba(90,122,64,0.15)" }}
                >
                  <h3
                    className="font-serif text-2xl md:text-3xl transition-all duration-300 group-hover:opacity-80"
                    style={{ background: "linear-gradient(135deg,#3a6028,#6aaa48,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm flex-1" style={{ color: "#6a7a60" }}>{card.desc}</p>
                  <div className="text-[9px] font-medium tracking-[0.3em] uppercase flex items-center gap-2" style={{ color: "#8aaa60" }}>
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
