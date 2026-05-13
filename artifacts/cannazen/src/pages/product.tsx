import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetProduct, useListProducts, useAddToCart, getGetCartQueryKey, useListReviews, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/hooks/use-seo";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Heart, ShieldCheck, Leaf, Truck, Star, AlertTriangle } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: products } = useListProducts();
  const product = products?.find(p => p.slug === slug);
  const { data: reviews } = useListReviews({ productId: product?.id || 0 }, { query: { enabled: !!product?.id } as any });
  
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: "Ajouté au panier",
          description: `${quantity}x ${product?.name} ajouté au panier.`,
        });
      }
    }
  });

  if (!products) return <div className="p-32 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return <div className="p-32 text-center font-serif text-2xl text-muted-foreground">Produit introuvable dans nos jardins.</div>;

  const handleAddToCart = () => {
    addToCart.mutate({ data: { productId: product.id, quantity } });
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="grid md:grid-cols-2 gap-16 mb-32">
        {/* Images */}
        <div className="bg-card/40 rounded-3xl overflow-hidden border border-border/40 p-8 hairline-gold inner-shadow-subtle flex items-center justify-center relative min-h-[500px]">
          {product.isNew && (
            <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-background/80 backdrop-blur-md text-foreground text-[10px] font-medium tracking-widest uppercase rounded-full hairline-gold">
              Nouveau
            </div>
          )}
          {product.isBestseller && !product.isNew && (
            <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-background/80 backdrop-blur-md text-primary text-[10px] font-medium tracking-widest uppercase rounded-full hairline-gold flex items-center gap-1">
              <Star className="w-3 h-3 fill-primary" /> Best-seller
            </div>
          )}
          <img 
            src={product.imageUrl || `https://images.unsplash.com/photo-1606166325683-e6deb6979b0c?q=80&w=1000&auto=format&fit=crop`} 
            alt={product.name}
            className="w-full h-auto object-cover aspect-[4/5] mix-blend-lighten max-h-[700px]"
            fetchPriority="high"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] font-medium text-primary uppercase tracking-[0.2em] mb-4">
            {product.categoryName}
          </div>
          <h1 className="font-serif text-5xl md:text-6xl mb-6 leading-tight">{product.name}</h1>
          
          <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-border/40">
            {product.rating && (
              <span className="px-3 py-1 bg-background/50 rounded-full border border-border/50 flex items-center gap-1.5 text-sm font-medium">
                <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {product.rating} <span className="text-muted-foreground font-normal ml-1">({product.reviewCount} avis)</span>
              </span>
            )}
            {product.strain && (
              <span className="px-3 py-1 bg-background/50 rounded-full border border-border/50 flex items-center gap-1.5 text-sm">
                <Leaf className="h-3.5 w-3.5 text-secondary-foreground" /> Souche: {product.strain}
              </span>
            )}
            {product.cbdContent && <span className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full border border-secondary/20 text-sm font-medium tracking-wide">CBD {product.cbdContent}</span>}
            {product.thcContent && <span className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full border border-border/50 text-sm font-medium tracking-wide">THC {product.thcContent}</span>}
          </div>

          <div className="text-4xl font-serif mb-8 text-primary">
            {product.price.toFixed(2)}€
            {product.compareAtPrice && (
              <span className="text-2xl text-muted-foreground line-through ml-4">€{product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 font-sans">
            {product.description || "Une création botanique exceptionnelle, cultivée avec passion et récoltée à maturité parfaite. Idéale pour accompagner un moment de profonde détente en fin de journée."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <div className="flex items-center justify-between border border-border/60 rounded-full bg-background/50 w-full sm:w-36 h-14">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-medium text-lg">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <Button 
              size="lg" 
              className="flex-1 bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full h-14 font-sans tracking-widest uppercase text-sm transition-all duration-500"
              onClick={handleAddToCart}
              disabled={addToCart.isPending || !product.inStock}
            >
              {addToCart.isPending ? "Ajout..." : product.inStock ? "Ajouter au panier" : "Rupture de stock"}
            </Button>
            
            <Button size="icon" variant="outline" className="h-14 w-14 rounded-full border-border/60 bg-background/50 hover:bg-card hover:text-primary hover:border-primary/50 transition-colors shrink-0">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-card/20 border border-border/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
              <div className="flex flex-col">
                <span className="text-sm font-medium mb-1">Qualité certifiée</span>
                <span className="text-xs text-muted-foreground leading-snug">Analysé en laboratoire indépendant</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-sm font-medium mb-1">Livraison discrète</span>
                <span className="text-xs text-muted-foreground leading-snug">Expédié sous 24h, emballage neutre</span>
              </div>
            </div>
          </div>

          {(product as any).coaPdfUrl || (product as any).batchNumber ? (
            <div className="flex flex-col gap-2 p-5 rounded-2xl bg-background/50 border border-primary/20" data-testid="product-coa-block">
              <div className="text-xs uppercase tracking-widest text-primary">Traçabilité & analyses</div>
              {(product as any).batchNumber && (
                <div className="text-sm text-muted-foreground">Lot n° <span className="text-foreground font-medium">{(product as any).batchNumber}</span></div>
              )}
              {(product as any).coaPdfUrl && (
                <a href={(product as any).coaPdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline hover:no-underline" data-testid="link-coa">
                  Télécharger le certificat d'analyse (COA)
                </a>
              )}
            </div>
          ) : null}

          <div className="text-[11px] tracking-widest uppercase text-muted-foreground border-t border-border/30 pt-4">
            Vente strictement réservée aux adultes (+18 ans). Produits non psychotropes (THC &lt; 0,3 %), conformément à la réglementation française. Ne pas conduire après consommation. Aucune allégation thérapeutique. Tenir hors de portée des enfants et des femmes enceintes.
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="mb-32">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full border-b border-border/40 rounded-none bg-transparent h-auto p-0 flex justify-start gap-8 mb-8">
            <TabsTrigger value="description" className="rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-0 font-serif text-xl data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors">Description</TabsTrigger>
            <TabsTrigger value="details" className="rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-0 font-serif text-xl data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors">Détails & Origine</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-0 font-serif text-xl data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors">Avis ({product.reviewCount || 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-0">
            <div className="prose prose-invert max-w-3xl prose-p:text-muted-foreground prose-p:leading-relaxed">
              <p>
                {product.description || "Issue d'une culture rigoureuse et respectueuse de l'environnement, cette création botanique incarne l'excellence du savoir-faire CannaZen. Ses arômes complexes et sa texture parfaite témoignent d'un affinage maîtrisé."}
              </p>
              <p>
                Parfaite pour s'accorder un instant suspendu, elle dévoile progressivement ses notes caractéristiques pour une expérience sensorielle profonde et mémorable. Conservez ce produit dans son écrin d'origine, à l'abri de la lumière et de l'humidité.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-0">
            <div className="grid sm:grid-cols-2 gap-y-6 gap-x-12 max-w-3xl">
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Catégorie</span>
                <span className="font-medium text-foreground">{product.categoryName}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Souche</span>
                <span className="font-medium text-foreground">{product.strain || "Hybride"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Taux de CBD</span>
                <span className="font-medium text-foreground">{product.cbdContent || "< 10%"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Taux de THC</span>
                <span className="font-medium text-foreground">{product.thcContent || "< 0.3%"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Origine</span>
                <span className="font-medium text-foreground">{product.origin || "Europe"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/30">
                <span className="text-muted-foreground">Poids net</span>
                <span className="font-medium text-foreground">{product.weight || "Varie selon format"}</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-0">
            <div className="max-w-3xl space-y-8">
              {reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="pb-8 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                    <h4 className="font-medium text-lg mb-2">{review.authorName}</h4>
                    <p className="text-muted-foreground leading-relaxed mb-3">"{review.body}"</p>
                    <div className="text-xs text-muted-foreground/60">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {review.productVariant && ` · Format: ${review.productVariant}`}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic">Aucun avis pour le moment. Soyez le premier à partager votre expérience.</p>
              )}

              <ReviewForm productId={product.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Legal warning */}
      <div className="max-w-3xl mx-auto mb-20 bg-card/40 border border-border/40 rounded-2xl p-5 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Produit destiné aux <strong className="text-foreground">personnes majeures (+18 ans)</strong>. Vente interdite aux mineurs et aux femmes enceintes ou allaitantes. Ne pas conduire après consommation. Ne se substitue pas à un avis médical. THC &lt; 0,3 % conformément à la réglementation française.
        </p>
      </div>

      {/* Related Products */}
      <div className="border-t border-border/40 pt-20">
        <h2 className="font-serif text-4xl mb-12">Pour prolonger <span className="italic text-primary">l'expérience</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.filter(p => p.id !== product.id).slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ productId }: { productId: number }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: () => apiPost("/reviews", { productId, rating, body: comment }),
    onSuccess: () => {
      setSubmitted(true);
      setRating(0); setComment("");
      queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ productId }) });
      toast({ title: "Avis envoyé", description: "Merci ! Il sera publié après modération." });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  if (!isAuthenticated) {
    return (
      <div className="bg-card/40 border border-border/40 rounded-2xl p-6 mt-8 hairline-gold">
        <p className="text-sm text-muted-foreground">
          <Link href="/connexion" className="text-primary underline">Connectez-vous</Link> pour partager votre expérience sur ce produit.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 mt-8">
        <p className="text-sm">Merci pour votre avis ! Il sera visible après validation par notre équipe.</p>
      </div>
    );
  }

  return (
    <div className="bg-card/40 border border-border/40 rounded-2xl p-6 mt-8 hairline-gold space-y-4" data-testid="review-form">
      <h3 className="font-serif text-2xl italic">Laisser un avis</h3>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Note</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="transition-transform hover:scale-110" data-testid={`star-${n}`}>
              <Star className={`h-7 w-7 ${(hover || rating) >= n ? "fill-primary text-primary" : "text-muted"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Commentaire</div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre expérience avec ce produit…" className="min-h-32 bg-background/50 rounded-xl" data-testid="review-comment" />
      </div>
      <Button onClick={() => submit.mutate()} disabled={!rating || submit.isPending} className="rounded-full bg-primary text-primary-foreground" data-testid="submit-review">
        {submit.isPending ? "Envoi…" : "Publier mon avis"}
      </Button>
    </div>
  );
}
