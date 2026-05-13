import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, MapPin, Package, Award, RefreshCw, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/mon-compte", label: "Tableau de bord", icon: User, exact: true },
  { href: "/mon-compte/commandes", label: "Commandes", icon: Package },
  { href: "/mon-compte/adresses", label: "Adresses", icon: MapPin },
  { href: "/mon-compte/fidelite", label: "Fidélité", icon: Award },
  { href: "/mon-compte/abonnements", label: "Abonnements", icon: RefreshCw },
  { href: "/mon-compte/profil", label: "Profil", icon: ShieldCheck },
];

export function AccountShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/connexion");
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="p-32 text-center"><div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Espace personnel</p>
        <h1 className="font-serif text-5xl italic text-foreground">{title}</h1>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-12">
        <aside className="space-y-1 lg:sticky lg:top-28 self-start">
          {NAV.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`} data-testid={`account-nav-${item.href.split("/").pop()}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-border/40">
            <Button variant="ghost" onClick={() => logout.mutate()} className="w-full justify-start text-muted-foreground hover:text-destructive" data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-3" /> Déconnexion
            </Button>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
