import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, FileText, Tag, Star, Mail, Activity, Repeat, LogOut, Leaf, Settings } from "lucide-react";

const NAV = [
  { href: "/console-cz", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/console-cz/produits", label: "Produits", icon: Package },
  { href: "/console-cz/categories", label: "Catégories", icon: FolderTree },
  { href: "/console-cz/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/console-cz/clients", label: "Clients", icon: Users },
  { href: "/console-cz/abonnements", label: "Abonnements", icon: Repeat },
  { href: "/console-cz/blog", label: "Blog", icon: FileText },
  { href: "/console-cz/promotions", label: "Codes promo", icon: Tag },
  { href: "/console-cz/avis", label: "Avis", icon: Star },
  { href: "/console-cz/emails", label: "Emails", icon: Mail },
  { href: "/console-cz/audit", label: "Journal d'audit", icon: Activity },
];

export function AdminShell({ children, title, actions }: { children: React.ReactNode; title: string; actions?: React.ReactNode }) {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/console-cz/login");
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="p-32 text-center"><div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-3xl mb-6">Accès refusé</h1>
        <p className="text-muted-foreground mb-8">Cette section est réservée à l'administration.</p>
        <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-card/40 border-r border-border/40 p-5 lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-80px)] lg:overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 px-3">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg">Console</span>
          <span className="text-[10px] uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded-full ml-auto">Admin</span>
        </div>
        <nav className="space-y-1">
          {NAV.map((it) => {
            const active = it.exact ? location === it.href : location.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`} data-testid={`admin-nav-${it.href.split("/").pop()}`}>
                  <it.icon className="h-4 w-4" /> {it.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 pt-4 border-t border-border/30 space-y-2">
          <div className="px-3 text-xs text-muted-foreground truncate">{user.email}</div>
          <Button variant="ghost" size="sm" onClick={() => logout.mutate()} className="w-full justify-start text-muted-foreground">
            <LogOut className="h-3 w-3 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>
      <main className="p-8 lg:p-12 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl italic text-foreground">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
