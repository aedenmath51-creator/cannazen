import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { Calendar, Clock, ArrowRight, Leaf } from "lucide-react";

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  coverImageUrl: string | null; authorName: string | null;
  publishedAt: string | null; readingMinutes: number | null;
  categoryName: string | null; categorySlug: string | null;
  tags: string[] | null;
};

export default function Blog() {
  useSeo({
    title: "Journal CBD",
    description: "Articles, conseils & savoir-faire autour du CBD légal en France. Comprendre, choisir et profiter sereinement.",
    canonical: "https://cannazen.fr/blog",
  });
  const { data: posts, isLoading } = useQuery({ queryKey: ["blog", "posts"], queryFn: () => apiGet<Post[]>("/blog/posts") });

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <header className="mb-16 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-center gap-2">
          <Leaf className="h-3 w-3" /> Le journal CannaZen
        </p>
        <h1 className="font-serif text-5xl md:text-6xl italic text-foreground mb-6">Carnets de l'apothicaire</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Articles, conseils, savoir-faire et actualité du CBD français. Pour mieux comprendre, mieux choisir, mieux profiter.
        </p>
      </header>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="bg-card/40 border border-dashed border-border/40 rounded-2xl p-16 text-center">
          <p className="text-muted-foreground">Premiers articles à paraître prochainement.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`}>
              <a className="group block bg-card/40 border border-border/40 rounded-3xl overflow-hidden hairline-gold hover:border-primary/40 transition-all" data-testid={`blog-post-${p.slug}`}>
                {p.coverImageUrl && (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={p.coverImageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-6">
                  {p.categoryName && (
                    <span className="inline-block text-xs uppercase tracking-widest text-primary mb-3">{p.categoryName}</span>
                  )}
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors mb-3 leading-tight">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.excerpt}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground/70 pt-4 border-t border-border/30">
                    <span className="flex items-center gap-2">
                      {p.publishedAt && <><Calendar className="h-3 w-3" />{new Date(p.publishedAt).toLocaleDateString("fr-FR")}</>}
                    </span>
                    {p.readingMinutes && <span className="flex items-center gap-2"><Clock className="h-3 w-3" />{p.readingMinutes} min</span>}
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
