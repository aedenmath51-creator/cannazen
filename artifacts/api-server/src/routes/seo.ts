import { Router } from "express";
import { db, productsTable, blogPostsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const APP_URL = process.env.APP_URL || "https://cannazen.fr";

const STATIC_PATHS = [
  { loc: "/", priority: 1.0 },
  { loc: "/boutique", priority: 0.9 },
  { loc: "/quiz", priority: 0.7 },
  { loc: "/blog", priority: 0.8 },
  { loc: "/cgv", priority: 0.3 },
  { loc: "/mentions-legales", priority: 0.3 },
  { loc: "/confidentialite", priority: 0.3 },
  { loc: "/retours", priority: 0.3 },
  { loc: "/cookies", priority: 0.3 },
];

router.get("/sitemap.xml", async (_req, res) => {
  const products = await db.select({ slug: productsTable.slug, updated: productsTable.createdAt })
    .from(productsTable).where(eq(productsTable.isActive, true));
  const cats = await db.select({ slug: categoriesTable.slug }).from(categoriesTable).where(eq(categoriesTable.isActive, true));
  const posts = await db.select({ slug: blogPostsTable.slug, updated: blogPostsTable.updatedAt })
    .from(blogPostsTable).where(eq(blogPostsTable.isPublished, true));

  const today = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PATHS.map((p) => `  <url><loc>${APP_URL}${p.loc}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join("\n")}
${cats.map((c) => `  <url><loc>${APP_URL}/boutique?categorie=${c.slug}</loc><priority>0.7</priority></url>`).join("\n")}
${products.map((p) => `  <url><loc>${APP_URL}/boutique/${p.slug}</loc><lastmod>${(p.updated ?? new Date()).toISOString()}</lastmod><priority>0.8</priority></url>`).join("\n")}
${posts.map((p) => `  <url><loc>${APP_URL}/blog/${p.slug}</loc><lastmod>${(p.updated ?? new Date()).toISOString()}</lastmod><priority>0.6</priority></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
});

router.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /console-cz
Disallow: /mon-compte
Disallow: /commande
Disallow: /panier

Sitemap: ${APP_URL}/api/sitemap.xml
`);
});

export default router;
