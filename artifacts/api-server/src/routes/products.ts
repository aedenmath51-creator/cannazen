import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import {
  ListProductsQueryParams,
  GetProductParams,
  GetQuizResultBody,
} from "@workspace/api-zod";

const router = Router();

const productFields = {
  id: productsTable.id,
  name: productsTable.name,
  slug: productsTable.slug,
  description: productsTable.description,
  price: productsTable.price,
  compareAtPrice: productsTable.compareAtPrice,
  imageUrl: productsTable.imageUrl,
  categoryId: productsTable.categoryId,
  strain: productsTable.strain,
  thcContent: productsTable.thcContent,
  cbdContent: productsTable.cbdContent,
  origin: productsTable.origin,
  weight: productsTable.weight,
  tags: productsTable.tags,
  rating: productsTable.rating,
  reviewCount: productsTable.reviewCount,
  isBestseller: productsTable.isBestseller,
  isNew: productsTable.isNew,
  inStock: productsTable.inStock,
  stock: productsTable.stock,
  isOrganic: productsTable.isOrganic,
  batchNumber: productsTable.batchNumber,
  coaPdfUrl: productsTable.coaPdfUrl,
  createdAt: productsTable.createdAt,
  categoryName: categoriesTable.name,
  categorySlug: categoriesTable.slug,
};

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  categoryId: number;
  strain: string | null;
  thcContent: string | null;
  cbdContent: string | null;
  origin: string | null;
  weight: string | null;
  tags: string[] | null;
  rating: string | null;
  reviewCount: number;
  isBestseller: boolean;
  isNew: boolean;
  inStock: boolean;
  stock: number;
  isOrganic: boolean;
  batchNumber: string | null;
  coaPdfUrl: string | null;
  createdAt: Date;
  categoryName: string | null;
  categorySlug: string | null;
};

function formatProduct(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    imageUrl: p.imageUrl,
    categoryId: p.categoryId,
    categoryName: p.categoryName ?? "",
    categorySlug: p.categorySlug ?? "",
    strain: p.strain,
    thcContent: p.thcContent,
    cbdContent: p.cbdContent,
    origin: p.origin,
    weight: p.weight,
    tags: p.tags ?? [],
    rating: p.rating ? Number(p.rating) : 0,
    reviewCount: p.reviewCount,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    inStock: p.inStock,
    stock: p.stock,
    isOrganic: p.isOrganic,
    batchNumber: p.batchNumber,
    coaPdfUrl: p.coaPdfUrl,
  };
}

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params" });
  }
  const { category, search, sort, minPrice, maxPrice } = parsed.data;

  const conditions = [eq(productsTable.isActive, true)];
  if (category) {
    const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.slug, category) });
    if (cat) conditions.push(eq(productsTable.categoryId, cat.id));
  }
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));

  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(productsTable.price); break;
    case "price_desc": orderBy = desc(productsTable.price); break;
    case "rating": orderBy = desc(productsTable.rating); break;
    case "newest": orderBy = desc(productsTable.createdAt); break;
    case "bestseller": orderBy = desc(productsTable.isBestseller); break;
    default: orderBy = desc(productsTable.createdAt);
  }

  const products = await db
    .select(productFields)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy);

  return res.json(products.map(formatProduct));
});

router.get("/products/featured", async (_req, res) => {
  const products = await db
    .select(productFields)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(eq(productsTable.isActive, true), eq(productsTable.isBestseller, true)))
    .orderBy(desc(productsTable.reviewCount))
    .limit(8);

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  if (products.length < 4) {
    const more = await db
      .select(productFields)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isActive, true))
      .orderBy(desc(productsTable.reviewCount))
      .limit(8);
    return res.json(more.map(formatProduct));
  }
  return res.json(products.map(formatProduct));
});

router.get("/products/stats", async (_req, res) => {
  const [stats] = await db
    .select({
      totalProducts: sql<number>`count(*)::int`,
      averageRating: sql<number>`round(avg(${productsTable.rating})::numeric, 1)`,
      totalReviews: sql<number>`sum(${productsTable.reviewCount})::int`,
    })
    .from(productsTable);

  const [catStats] = await db
    .select({ totalCategories: sql<number>`count(*)::int` })
    .from(categoriesTable);

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.json({
    totalProducts: stats.totalProducts ?? 0,
    totalCategories: catStats.totalCategories ?? 0,
    averageRating: stats.averageRating ?? 0,
    totalReviews: stats.totalReviews ?? 0,
  });
});

router.get("/products/:id", async (req, res) => {
  const rawId = req.params.id;
  const numericId = Number(rawId);
  const isNumeric = !Number.isNaN(numericId) && String(numericId) === rawId;

  const condition = isNumeric
    ? and(eq(productsTable.id, numericId), eq(productsTable.isActive, true))
    : and(eq(productsTable.slug, rawId), eq(productsTable.isActive, true));

  const [product] = await db
    .select(productFields)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(condition);

  if (!product) return res.status(404).json({ message: "Product not found" });
  return res.json(formatProduct(product));
});

router.post("/quiz/result", async (req, res) => {
  const parsed = GetQuizResultBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { mood, goal, experience, format } = parsed.data;

  const moodCategoryMap: Record<string, string[]> = {
    serenity: ["fleurs-cbd", "huiles-cbd"],
    energy: ["fleurs-d10", "resines-d10", "vapes"],
    sleep: ["fleurs-oh", "huiles-cbd"],
    focus: ["fleurs-cbd", "vapes", "gummies-d9"],
  };
  const formatToSlugs: Record<string, string[]> = {
    flower: ["fleurs-cbd", "fleurs-d10", "fleurs-oh"],
    oil: ["huiles-cbd"],
    resin: ["resines-d10"],
    vape: ["vapes"],
  };

  const moodSlugs = moodCategoryMap[mood] ?? ["fleurs-cbd"];
  const formatSlugs = format ? formatToSlugs[format] ?? [] : [];
  const targetSlugs = Array.from(new Set([...moodSlugs, ...formatSlugs]));

  // Resolve category IDs using inArray (drizzle-safe; raw sql ANY breaks param binding for arrays)
  const cats = await db
    .select()
    .from(categoriesTable)
    .where(inArray(categoriesTable.slug, targetSlugs));

  // Pool of candidate products (broader than what we'll return so the LLM has choice)
  const pool = cats.length
    ? await db
        .select(productFields)
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(
          and(
            eq(productsTable.isActive, true),
            inArray(
              productsTable.categoryId,
              cats.map((c) => c.id),
            ),
          ),
        )
        .orderBy(desc(productsTable.rating))
        .limit(20)
    : await db
        .select(productFields)
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(eq(productsTable.isActive, true))
        .orderBy(desc(productsTable.rating))
        .limit(20);

  const formatted = pool.map(formatProduct);
  if (formatted.length === 0) return res.json([]);

  // AI-driven ranking: ask Groq to pick the best 4-6 products for THIS user, given their answers.
  // Falls back to the rating-ordered pool on any failure (network, quota, parse, missing key).
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey || formatted.length <= 4) {
    return res.json(formatted.slice(0, 6));
  }

  const goalLabel: Record<string, string> = {
    relax: "se détendre profondément",
    sleep: "mieux dormir",
    focus: "améliorer sa concentration",
    energy: "retrouver de l'énergie",
  };
  const expLabel: Record<string, string> = {
    beginner: "débutant·e total·e",
    intermediate: "consommateur·rice occasionnel·le",
    advanced: "consommateur·rice régulier·e",
  };
  const formatLabel: Record<string, string> = {
    flower: "fleurs à infuser ou vaporiser",
    oil: "huiles sublinguales",
    resin: "résines",
    vape: "vapes / cartouches",
  };

  const userProfile = [
    `Objectif : ${goal && goalLabel[goal] ? goalLabel[goal] : mood}`,
    experience && expLabel[experience] ? `Expérience CBD : ${expLabel[experience]}` : null,
    format && formatLabel[format] ? `Format préféré : ${formatLabel[format]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const catalogList = formatted
    .map(
      (p) =>
        `- slug=${p.slug} | ${p.name} | ${p.categoryName ?? "Autre"} | ${p.price}€ | CBD ${p.cbdContent ?? "?"} THC ${p.thcContent ?? "?"} | ${p.strain ?? ""} | ${p.description ? p.description.slice(0, 140) : ""}`,
    )
    .join("\n");

  const systemPrompt = `Tu es Mary, conseillère senior CBD chez CannaZen. Tu sélectionnes 4 à 6 produits parmi un catalogue donné, pour UN profil client précis.

Réponds STRICTEMENT en JSON valide, sans texte autour, sans markdown, sous la forme :
{"slugs":["slug-1","slug-2","slug-3","slug-4"]}

Les slugs doivent être copiés à l'identique depuis le catalogue. Ordre = du plus pertinent au moins pertinent. 4 minimum, 6 maximum. Pas de doublons. Aucun produit hors catalogue.`;

  const userPrompt = `# Profil
${userProfile}

# Catalogue disponible
${catalogList}

Sélectionne les 4 à 6 meilleurs produits pour ce profil et renvoie le JSON.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      req.log?.warn({ status: r.status }, "[quiz:groq] non-ok, falling back to rating order");
      return res.json(formatted.slice(0, 6));
    }
    const json = (await r.json()) as { choices: Array<{ message: { content: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return res.json(formatted.slice(0, 6));
    const parsedAi = JSON.parse(content) as { slugs?: unknown };
    const slugs = Array.isArray(parsedAi.slugs)
      ? parsedAi.slugs.filter((s): s is string => typeof s === "string")
      : [];
    if (slugs.length === 0) return res.json(formatted.slice(0, 6));

    const bySlug = new Map(formatted.map((p) => [p.slug, p]));
    const ordered = slugs
      .map((s) => bySlug.get(s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (ordered.length === 0) return res.json(formatted.slice(0, 6));
    return res.json(ordered.slice(0, 6));
  } catch (err) {
    req.log?.warn({ err }, "[quiz:groq] failed, falling back to rating order");
    return res.json(formatted.slice(0, 6));
  }
});

export default router;
