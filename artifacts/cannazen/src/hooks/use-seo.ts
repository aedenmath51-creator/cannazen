import { useEffect } from "react";

interface SeoOpts {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: object | object[];
  noindex?: boolean;
}

const DEFAULT_TITLE = "CannaZen — CBD légal & cannabis bien-être en France";
const DEFAULT_DESC = "Boutique CBD française. Fleurs, huiles, résines testées en laboratoire. Livraison rapide & discrète. THC < 0,3%.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo(opts: SeoOpts) {
  useEffect(() => {
    const title = opts.title ? `${opts.title} — CannaZen` : DEFAULT_TITLE;
    const description = opts.description ?? DEFAULT_DESC;
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", opts.type ?? "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (opts.image) {
      setMeta("og:image", opts.image, "property");
      setMeta("twitter:image", opts.image);
    }
    if (opts.noindex) setMeta("robots", "noindex,nofollow");
    else setMeta("robots", "index,follow");
    if (opts.canonical) setLink("canonical", opts.canonical);

    let scriptEl: HTMLScriptElement | null = null;
    if (opts.jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.text = JSON.stringify(opts.jsonLd);
      scriptEl.dataset.useSeo = "1";
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl && scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
    };
  }, [opts.title, opts.description, opts.canonical, opts.image, opts.type, opts.noindex, JSON.stringify(opts.jsonLd)]);
}
