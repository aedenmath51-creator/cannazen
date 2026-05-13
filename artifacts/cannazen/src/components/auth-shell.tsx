import React from "react";
import { Link } from "wouter";
import { Leaf } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-6 py-20 max-w-md min-h-[80vh]">
      <div className="text-center mb-12">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-8">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-serif text-2xl text-foreground">CannaZen</span>
        </Link>
        <h1 className="font-serif text-4xl italic text-foreground mb-3">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      <div className="bg-card/40 border border-border/40 rounded-3xl p-8 hairline-gold inner-shadow-subtle">
        {children}
      </div>
      {footer && <div className="text-center mt-8 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
