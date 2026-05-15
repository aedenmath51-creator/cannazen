import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessayez dans une minute." },
});

const quizBodySchema = z.object({
  objective: z.string().min(1),
  format:    z.string().min(1),
  experience:z.string().min(1),
  intensity: z.string().min(1),
  budget:    z.string().min(1),
});

type ProductRow = {
  name: string; slug: string; category: string;
  price: string; cbdContent: string|null; thcContent: string|null;
  strain: string|null; origin: string|null; description: string|null;
  isBestseller: boolean; isNew: boolean; isOrganic: boolean;
};

let cache: { data: ProductRow[]; exp: number } | null = null;

async function loadProducts(): Promise<ProductRow[]> {
  const now = Date.now();
  if (cache && cache.exp > now) return cache.data;
  const rows = await db
    .select({
      name: productsTable.name, slug: productsTable.slug,
      category: categoriesTable.name, price: productsTable.price,
      cbdContent: productsTable.cbdContent, thcContent: productsTable.thcContent,
      strain: productsTable.strain, origin: productsTable.origin,
      description: productsTable.description,
      isBestseller: productsTable.isBestseller, isNew: productsTable.isNew,
      isOrganic: productsTable.isOrganic,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.isActive, true))
    .limit(80);

  const data: ProductRow[] = rows.map(r => ({
    name: r.name, slug: r.slug, category: r.category ?? "Autre",
    price: r.price, cbdContent: r.cbdContent, thcContent: r.thcContent,
    strain: r.strain, origin: r.origin,
    description: r.description ? r.description.slice(0, 140) : null,
    isBestseller: r.isBestseller, isNew: r.isNew, isOrganic: r.isOrganic,
  }));
  cache = { data, exp: now + 5 * 60 * 1000 };
  return data;
}

function catalogToText(products: ProductRow[]): string {
  return products.map(p => {
    const tags = [
      p.isBestseller ? "best-seller" : null,
      p.isNew ? "nouveauté" : null,
      p.isOrganic ? "bio" : null,
    ].filter(Boolean).join(", ");
    const meta = [
      p.cbdContent ? `CBD ${p.cbdContent}` : null,
      p.thcContent ? `THC ${p.thcContent}` : null,
      p.strain ?? null,
      p.origin ? `${p.origin}` : null,
      tags || null,
    ].filter(Boolean).join(", ");
    return `slug:${p.slug} | ${p.name} | ${p.category} | ${p.price}€ | ${meta}${p.description ? ` | ${p.description}` : ""}`;
  }).join("\n");
}

router.post("/quiz/recommend", quizLimiter, async (req, res) => {
  const parsed = quizBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Paramètres invalides" });

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) return res.status(503).json({ error: "Service IA indisponible" });

  const { objective, format, experience, intensity, budget } = parsed.data;

  let products: ProductRow[];
  try { products = await loadProducts(); }
  catch { products = []; }

  const catalog = catalogToText(products);
  const slugList = products.map(p => p.slug).join(", ");

  const system = `Tu es l'expert CBD de CannaZen. Tu analyses le profil d'un utilisateur et recommandes exactement 3 produits du catalogue.

CATALOGUE (format: slug | nom | catégorie | prix | détails):
${catalog}

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT en JSON valide, rien d'autre.
2. Les slugs dans "recommendations" doivent être EXACTEMENT issus du catalogue ci-dessus. Slugs disponibles: ${slugList}
3. "intro" : message personnalisé chaleureux de 2-3 phrases en français, tutoiement naturel, style conseiller boutique.
4. Chaque "reason" : 1 phrase courte expliquant pourquoi ce produit convient à ce profil précis.
5. Choisis les 3 produits les plus pertinents selon le profil.

FORMAT DE RÉPONSE (JSON strict) :
{
  "intro": "...",
  "recommendations": [
    { "slug": "slug-exact-du-catalogue", "reason": "..." },
    { "slug": "slug-exact-du-catalogue", "reason": "..." },
    { "slug": "slug-exact-du-catalogue", "reason": "..." }
  ]
}`;

  const userMsg = `Profil utilisateur :
- Objectif : ${objective}
- Format préféré : ${format}
- Expérience CBD : ${experience}
- Intensité souhaitée : ${intensity}
- Budget : ${budget}

Recommande 3 produits parfaitement adaptés à ce profil.`;

  async function callGroq(model: string) {
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });
  }

  try {
    let r = await callGroq("llama-3.3-70b-versatile");
    if (!r.ok && (r.status === 429 || r.status === 503)) {
      r = await callGroq("llama-3.1-8b-instant");
    }
    if (!r.ok) {
      const txt = await r.text();
      req.log?.error({ status: r.status, body: txt.slice(0, 300) }, "[quiz:groq] error");
      return res.status(502).json({ error: "IA temporairement indisponible" });
    }

    const json = (await r.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(502).json({ error: "Réponse vide" });

    let parsed2: { intro: string; recommendations: Array<{ slug: string; reason: string }> };
    try { parsed2 = JSON.parse(raw); }
    catch {
      req.log?.error({ raw: raw.slice(0, 200) }, "[quiz:groq] JSON parse failed");
      return res.status(502).json({ error: "Format de réponse invalide" });
    }

    const slugSet = new Set(products.map(p => p.slug));
    const recs = (parsed2.recommendations ?? [])
      .filter(r => slugSet.has(r.slug))
      .slice(0, 3)
      .map(r => {
        const p = products.find(pr => pr.slug === r.slug)!;
        return {
          slug: p.slug, name: p.name, price: p.price,
          category: p.category, cbdContent: p.cbdContent,
          isBestseller: p.isBestseller, isNew: p.isNew,
          reason: r.reason,
        };
      });

    return res.json({ intro: parsed2.intro ?? "", recommendations: recs });
  } catch (err) {
    req.log?.error({ err }, "[quiz:groq] fetch failed");
    return res.status(502).json({ error: "IA temporairement indisponible" });
  }
});

export default router;
