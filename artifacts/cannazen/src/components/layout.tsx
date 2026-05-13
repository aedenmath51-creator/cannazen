import React, { Suspense, lazy } from "react";
import { Link, useLocation } from "wouter";
import { getAgeVerified, setAgeVerified } from "@/lib/session";
import { useGetCart } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import {
  ShoppingBag,
  Menu,
  Shield,
  Check,
  LogOut,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { LotusLogo } from "@/components/lotus-logo";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { CookieBanner } from "@/components/cookie-banner";
const FloatingChat = lazy(() =>
  import("@/components/floating-chat").then((m) => ({ default: m.FloatingChat })),
);
const ThirdPartyLoaders = lazy(() =>
  import("@/components/third-party-loaders").then((m) => ({ default: m.ThirdPartyLoaders })),
);

type NavGroup = {
  label?: string;
  items: { href: string; label: string; sub?: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Accueil" },
      { href: "/boutique", label: "Boutique", sub: "19 produits" },
      { href: "/quiz", label: "Quiz CBD", sub: "trouvez votre soin" },
    ],
  },
  {
    label: "Explorer",
    items: [
      { href: "/nos-terroirs", label: "Nos Terroirs" },
      { href: "/coffrets", label: "Coffrets" },
      { href: "/blog", label: "Journal" },
    ],
  },
  {
    label: "Espace",
    items: [
      { href: "/wishlist", label: "Favoris" },
      { href: "/mon-compte/fidelite", label: "Fidélité" },
      { href: "/mon-compte", label: "Mon Compte" },
    ],
  },
];

function SidebarContent({
  location,
  isAuthenticated,
  onNavigate,
  theme,
  toggleTheme,
}: {
  location: string;
  isAuthenticated: boolean;
  onNavigate?: () => void;
  theme: string;
  toggleTheme: () => void;
}) {
  const [, setLoc] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    onNavigate?.();
    setLoc(`/boutique?q=${encodeURIComponent(q)}`);
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-card/50 backdrop-blur-xl border-r border-border/30" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-secondary/8 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="relative flex flex-col h-full">
        {/* Logo */}
        <div className="px-7 pt-8 pb-6 flex items-center justify-between">
          <Link href="/" onClick={onNavigate} data-testid="logo">
            <motion.div
              className="flex items-baseline gap-2 group cursor-pointer"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <LotusLogo size={18} className="text-secondary -translate-y-0.5 group-hover:text-primary transition-colors duration-300" />
              <span className="font-serif italic text-2xl tracking-wide text-foreground group-hover:text-primary transition-colors duration-300">
                Canna<span className="text-primary">Zen</span>
              </span>
            </motion.div>
          </Link>
          <motion.button
            onClick={toggleTheme}
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors"
            data-testid="theme-toggle"
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-5 pb-5">
          <form onSubmit={submitSearch}>
            <motion.div
              animate={{ borderColor: searchFocused ? "rgba(201,168,76,0.5)" : "rgba(128,128,128,0.2)" }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center rounded-2xl border bg-background/40 overflow-hidden"
            >
              <Search className="absolute left-3.5 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Rechercher…"
                className="w-full h-9 pl-9 pr-3 text-sm bg-transparent placeholder:text-muted-foreground/40 focus:outline-none text-foreground"
                data-testid="sidebar-search"
                aria-label="Rechercher un produit"
              />
            </motion.div>
          </form>
        </div>

        {/* Divider */}
        <div className="mx-6 mb-5 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-5 pb-4 overflow-y-auto space-y-6">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-2 mb-2.5 text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground/40">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item, ii) => {
                  const isActive =
                    item.href === "/"
                      ? location === "/"
                      : location === item.href || location.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href} onClick={onNavigate}>
                      <motion.div
                        className="relative px-3 py-2.5 rounded-xl cursor-pointer group overflow-hidden"
                        whileHover="hover"
                        initial={false}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {/* Active / hover background */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="nav-pill"
                              className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                        </AnimatePresence>
                        <motion.div
                          variants={{ hover: { backgroundColor: "rgba(201,168,76,0.05)" } }}
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        />

                        {/* Active left bar */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="nav-bar"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              exit={{ scaleY: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                        </AnimatePresence>

                        <div className="relative flex items-baseline justify-between">
                          <span
                            className={`font-serif italic text-[15px] transition-colors duration-200 ${
                              isActive
                                ? "text-primary"
                                : "text-foreground/70 group-hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.sub && !isActive && (
                            <span className="text-[9px] tracking-wide text-muted-foreground/40 font-sans normal-case not-italic">
                              {item.sub}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-border/25">
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/35">
            &copy; {new Date().getFullYear()} CannaZen
          </p>
          {isAuthenticated && (
            <p className="mt-0.5 text-[9px] tracking-[0.15em] uppercase text-primary/40">
              Membre connecté
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [isAgeGateOpen, setIsAgeGateOpen] = React.useState(false);
  const [underageMessage, setUnderageMessage] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const primaryButtonRef = React.useRef<HTMLButtonElement>(null);
  const gateContainerRef = React.useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    if (!getAgeVerified()) setIsAgeGateOpen(true);
  }, []);

  React.useEffect(() => {
    if (!isAgeGateOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => primaryButtonRef.current?.focus(), 100);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); return; }
      if (e.key === "Tab" && gateContainerRef.current) {
        const focusables = gateContainerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [isAgeGateOpen]);

  const handleAgeConfirm = (isOver18: boolean) => {
    if (isOver18) { setAgeVerified(true); setIsAgeGateOpen(false); }
    else setUnderageMessage(true);
  };

  const { data: cart } = useGetCart();
  const isAdminRoute = location.startsWith("/console-cz");

  return (
    <div className="min-h-[100dvh] flex relative overflow-x-hidden">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/5" />
        <div className="absolute top-[-20%] left-[40%] w-[60%] h-[60%] rounded-full bg-secondary/8 blur-[140px] animate-[glow-drift_25s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[140px] animate-[glow-drift_30s_ease-in-out_infinite_alternate-reverse]" />
        <div className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] rounded-full bg-secondary/6 blur-[160px] animate-[glow-drift_35s_ease-in-out_infinite_alternate]" />
      </div>

      {/* Age gate */}
      <AnimatePresence>
        {isAgeGateOpen && !isAdminRoute && (
          <motion.div
            ref={gateContainerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            aria-describedby="age-gate-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            </div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative z-10 w-full max-w-[480px] bg-card/90 backdrop-blur-xl rounded-3xl p-10 flex flex-col items-center text-center hairline-gold inner-shadow-subtle shadow-2xl shadow-black/20"
            >
              <div className="h-20 w-20 rounded-full bg-secondary/15 flex items-center justify-center mb-7 border border-secondary/25 shadow-[0_0_30px_rgba(74,103,65,0.15)]">
                <LotusLogo size={36} className="text-secondary" />
              </div>
              <h2 id="age-gate-title" className="font-serif text-4xl mb-4 italic text-foreground tracking-wide">
                Bienvenue au jardin
              </h2>
              {underageMessage ? (
                <p id="age-gate-description" className="text-muted-foreground text-lg mb-10 leading-relaxed">
                  L'accès à notre collection est réservé aux personnes majeures.
                </p>
              ) : (
                <p id="age-gate-description" className="text-muted-foreground text-lg mb-10 leading-relaxed">
                  L'accès à notre collection est réservé aux{" "}
                  <span className="text-primary font-medium">personnes majeures</span>. Confirmez votre âge pour
                  découvrir l'univers de Mary Jane.
                </p>
              )}
              {!underageMessage && (
                <div className="w-full flex flex-col gap-4 mb-10">
                  <Button
                    ref={primaryButtonRef}
                    size="lg"
                    className="w-full font-sans tracking-widest uppercase text-sm bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 h-14 rounded-full"
                    onClick={() => handleAgeConfirm(true)}
                    data-testid="age-gate-confirm"
                  >
                    OUI, J'AI +18 ANS
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-sans tracking-widest uppercase text-sm border-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 h-14 rounded-full bg-background/50"
                    onClick={() => handleAgeConfirm(false)}
                  >
                    J'AI MOINS DE 18 ANS
                  </Button>
                </div>
              )}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
              <div className="flex items-center justify-center gap-6 text-xs font-medium tracking-widest uppercase text-muted-foreground/70">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>THC &lt; 0.3%</span></div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4" /><span>CANNABIS LÉGAL</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      {!isAdminRoute && (
        <aside className="hidden md:flex w-[220px] flex-shrink-0 fixed left-0 top-0 bottom-0 z-30">
          <SidebarContent
            location={location}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </aside>
      )}

      {/* Main column */}
      <div
        className={`flex-1 min-w-0 max-w-full overflow-x-hidden flex flex-col min-h-[100dvh] transition-all duration-700 ${
          isAgeGateOpen && !isAdminRoute ? "blur-md grayscale-[0.3] opacity-40 pointer-events-none" : ""
        } ${!isAdminRoute ? "md:ml-[220px]" : ""}`}
      >
        {/* Mobile top bar */}
        {!isAdminRoute && (
          <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/30 bg-background/70 backdrop-blur-md">
            <div className="px-4 h-14 flex items-center justify-between">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0 border-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarContent
                    location={location}
                    isAuthenticated={isAuthenticated}
                    onNavigate={() => setMobileNavOpen(false)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                  />
                </SheetContent>
              </Sheet>
              <Link href="/" className="flex items-baseline gap-1.5">
                <LotusLogo size={15} className="text-secondary -translate-y-0.5" />
                <span className="font-serif italic text-xl tracking-wide">
                  Canna<span className="text-primary">Zen</span>
                </span>
              </Link>
              <Link href="/panier">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary" data-testid="cart-icon-mobile">
                  <ShoppingBag className="h-5 w-5" />
                  {cart && cart.itemCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {cart.itemCount}
                    </span>
                  )}
                  <span className="sr-only">Panier</span>
                </Button>
              </Link>
            </div>
          </header>
        )}

        {/* Floating actions (desktop) */}
        {!isAdminRoute && (
          <div className="hidden md:flex fixed top-5 right-6 z-30 items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-primary rounded-full px-3"
                data-testid="menu-logout"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                {user?.firstName ?? "Déconnexion"}
              </Button>
            ) : (
              <Link href="/connexion">
                <Button variant="ghost" size="sm" className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-primary rounded-full px-3" data-testid="menu-login">
                  Connexion
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link href="/console-cz">
                <Button variant="ghost" size="sm" className="text-xs font-medium tracking-widest uppercase text-primary hover:text-primary rounded-full px-3">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Admin
                </Button>
              </Link>
            )}
            <Link href="/panier">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm text-foreground hover:text-primary hover:border-primary/40 transition-all duration-300"
                data-testid="cart-icon"
              >
                <ShoppingBag className="h-4 w-4" />
                {cart && cart.itemCount > 0 && (
                  <motion.span
                    key={cart.itemCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center"
                    data-testid="cart-count"
                  >
                    {cart.itemCount}
                  </motion.span>
                )}
                <span className="sr-only">Panier</span>
              </Button>
            </Link>
          </div>
        )}

        <main className="flex-1 flex flex-col">{children}</main>

        {!isAdminRoute && (
          <footer className="border-t border-border/30 bg-background/40 backdrop-blur-sm relative z-10 mt-auto">
            <div className="container mx-auto px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <Link href="/" className="flex items-baseline gap-1.5">
                    <LotusLogo size={16} className="text-secondary -translate-y-0.5" />
                    <span className="font-serif italic text-2xl tracking-wide">
                      Canna<span className="text-primary">Zen</span>
                    </span>
                  </Link>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    CBD premium français, cultivé avec passion et respect de la terre.
                  </p>
                </div>
                <div>
                  <h3 className="font-serif italic text-base text-primary mb-5">Boutique</h3>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li><Link href="/boutique?category=fleurs-cbd" className="hover:text-primary transition-colors">Fleurs CBD</Link></li>
                    <li><Link href="/boutique?category=huiles-cbd" className="hover:text-primary transition-colors">Huiles</Link></li>
                    <li><Link href="/boutique?category=resines-d10" className="hover:text-primary transition-colors">Résines</Link></li>
                    <li><Link href="/boutique?category=vapes" className="hover:text-primary transition-colors">Vapes</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-serif italic text-base text-primary mb-5">Explorer</h3>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li><Link href="/a-propos" className="hover:text-primary transition-colors">À propos</Link></li>
                    <li><Link href="/nos-terroirs" className="hover:text-primary transition-colors">Nos terroirs</Link></li>
                    <li><Link href="/quiz" className="hover:text-primary transition-colors">Quiz CBD</Link></li>
                    <li><Link href="/blog" className="hover:text-primary transition-colors">Journal</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-serif italic text-base text-primary mb-5">Légal</h3>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li><Link href="/cgv" className="hover:text-primary transition-colors">CGV</Link></li>
                    <li><Link href="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link></li>
                    <li><Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link></li>
                    <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-border/25 text-center text-xs text-muted-foreground/60">
                <p>&copy; {new Date().getFullYear()} CannaZen — Tous droits réservés. Produits réservés aux +18 ans.</p>
                <p className="mt-1.5 text-[10px] flex items-center justify-center gap-1.5 text-muted-foreground/40 uppercase tracking-widest">
                  <Shield className="w-3 h-3" /> THC &lt; 0.3% — Cannabis légal certifié
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {!isAdminRoute && <CookieBanner />}
      {!isAdminRoute && (
        <Suspense fallback={null}><FloatingChat /></Suspense>
      )}
      <Suspense fallback={null}><ThirdPartyLoaders /></Suspense>
    </div>
  );
}
