import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import DOMPurify from "dompurify";

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => apiGet<any>(`/blog/posts/${slug}`),
    enabled: !!slug,
  });

  useSeo({
    title: post?.title,
    description: post?.metaDescription ?? post?.excerpt,
    image: post?.coverImageUrl,
    type: "article",
    canonical: post ? `https://cannazen.fr/blog/${post.slug}` : undefined,
    jsonLd: post ? {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      image: post.coverImageUrl ? [post.coverImageUrl] : [],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { "@type": "Person", name: post.authorName ?? "CannaZen" },
      publisher: { "@type": "Organization", name: "CannaZen", logo: { "@type": "ImageObject", url: "https://cannazen.fr/logo.png" } },
    } : undefined,
  });

  if (isLoading) return <div className="p-32 text-center"><div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !post) return (
    <div className="container mx-auto px-6 py-32 text-center">
      <h1 className="font-serif text-3xl mb-6">Article introuvable</h1>
      <Link href="/blog" className="text-primary hover:underline">← Retour au blog</Link>
    </div>
  );

  return (
    <article className="container mx-auto px-6 py-16 max-w-3xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary mb-12">
        <ArrowLeft className="h-3 w-3" /> Tous les articles
      </Link>
      <header className="mb-12 text-center">
        {post.category?.name && <p className="text-xs uppercase tracking-widest text-primary mb-4">{post.category.name}</p>}
        <h1 className="font-serif text-4xl md:text-6xl italic text-foreground mb-6 leading-tight" data-testid="blog-post-title">{post.title}</h1>
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          {post.authorName && <span className="flex items-center gap-2"><User className="h-3 w-3" />{post.authorName}</span>}
          {post.publishedAt && <span className="flex items-center gap-2"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString("fr-FR")}</span>}
          {post.readingMinutes && <span className="flex items-center gap-2"><Clock className="h-3 w-3" />{post.readingMinutes} min de lecture</span>}
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="aspect-[16/9] mb-12 rounded-3xl overflow-hidden">
          <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className="prose prose-invert prose-headings:font-serif prose-headings:italic prose-headings:text-foreground prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
      />

      <footer className="mt-16 pt-8 border-t border-border/40 text-xs text-muted-foreground/70 text-center">
        <p>Article fourni à titre informatif. Aucune allégation thérapeutique.</p>
      </footer>
    </article>
  );
}
