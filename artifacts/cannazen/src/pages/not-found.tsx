import { Link } from "wouter";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-6 py-32 flex flex-col items-center justify-center text-center min-h-[80vh] relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="w-24 h-24 bg-background/50 border border-border/40 rounded-full flex items-center justify-center mb-10 hairline-gold inner-shadow-subtle">
        <Leaf className="h-10 w-10 text-primary opacity-80" />
      </div>
      
      <h1 className="font-serif text-8xl md:text-9xl mb-6 text-foreground/20 italic tracking-tighter">404</h1>
      <h2 className="font-serif text-4xl md:text-5xl mb-8">Page introuvable</h2>
      
      <p className="text-muted-foreground text-lg mb-16 max-w-md font-sans leading-relaxed">
        Le chemin que vous cherchez s'est perdu dans les herbes hautes. Retournons vers la lumière de notre jardin.
      </p>
      
      <Button asChild size="lg" className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-14 px-10 rounded-full transition-all duration-500">
        <Link href="/">Retourner à l'accueil</Link>
      </Button>
    </div>
  );
}
