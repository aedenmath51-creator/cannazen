import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Veuillez patienter." },
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

type ProductForPrompt = {
  name: string;
  slug: string;
  category: string;
  price: string;
  cbdContent: string | null;
  thcContent: string | null;
  strain: string | null;
  origin: string | null;
  description: string | null;
  isBestseller: boolean;
  isNew: boolean;
  isOrganic: boolean;
};

let productsCache: { data: ProductForPrompt[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadCatalog(): Promise<ProductForPrompt[]> {
  const now = Date.now();
  if (productsCache && productsCache.expiresAt > now) return productsCache.data;
  const rows = await db
    .select({
      name: productsTable.name,
      slug: productsTable.slug,
      category: categoriesTable.name,
      price: productsTable.price,
      cbdContent: productsTable.cbdContent,
      thcContent: productsTable.thcContent,
      strain: productsTable.strain,
      origin: productsTable.origin,
      description: productsTable.description,
      isBestseller: productsTable.isBestseller,
      isNew: productsTable.isNew,
      isOrganic: productsTable.isOrganic,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.isActive, true))
    .limit(80);
  const data: ProductForPrompt[] = rows.map((r) => ({
    name: r.name,
    slug: r.slug,
    category: r.category ?? "Autre",
    price: r.price,
    cbdContent: r.cbdContent,
    thcContent: r.thcContent,
    strain: r.strain,
    origin: r.origin,
    description: r.description ? r.description.slice(0, 180) : null,
    isBestseller: r.isBestseller,
    isNew: r.isNew,
    isOrganic: r.isOrganic,
  }));
  productsCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

function formatCatalog(items: ProductForPrompt[]): string {
  if (items.length === 0) return "(catalogue vide pour le moment)";
  const byCategory = new Map<string, ProductForPrompt[]>();
  for (const p of items) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const lines: string[] = [];
  for (const [cat, list] of byCategory) {
    lines.push(`\n## ${cat.toUpperCase()}`);
    for (const p of list) {
      const tags = [
        p.isBestseller ? "★ best-seller" : null,
        p.isNew ? "✦ nouveauté" : null,
        p.isOrganic ? "🌱 bio" : null,
      ].filter(Boolean).join(", ");
      const cbd = p.cbdContent ? `CBD ${p.cbdContent}` : null;
      const thc = p.thcContent ? `THC ${p.thcContent}` : null;
      const strain = p.strain ? p.strain : null;
      const origin = p.origin ? `origine ${p.origin}` : null;
      const meta = [cbd, thc, strain, origin, tags || null].filter(Boolean).join(" · ");
      const desc = p.description ? ` — ${p.description}` : "";
      lines.push(`- **${p.name}** · ${p.price}€ · /produits/${p.slug} (${meta})${desc}`);
    }
  }
  return lines.join("\n");
}

function buildSystemPrompt(catalog: string): string {
  return `Tu es Mary, conseillère chez CannaZen. Tu travailles depuis 5 ans dans le cannabis légal français, tu connais chaque produit par cœur, et tu adores ton métier.

# Ce que tu vends — IMPORTANT
CannaZen vend du cannabis 100% légal en France (THC < 0,3%) MAIS pas que du CBD relaxant. Le catalogue inclut des cannabinoïdes alternatifs PSYCHOACTIFS et légaux :
- **D10 (delta-10 THC)** — fleurs et résines, effet euphorisant, créatif, énergisant. Légal car isomère différent du delta-9.
- **OH+ (HHC, H4CBD…)** — fleurs hydrogénées, effet plus intense, proche du cannabis classique mais légal.
- **Gummies D9** — bonbons au delta-9 dosé sous le seuil légal (0,3% du poids sec), effet euphorisant en bouche-à-bouche.
- **CBD classique** — fleurs, huiles, résines : relaxant, anti-stress, sans effet planant.
- **Vapes** — formats discrets, dosages variés selon la cartouche.

Donc OUI, on peut "planer", se "défoncer légalement", chercher de l'euphorie, du fun, un effet récréatif — c'est exactement pour ça que les gammes D10, OH+ et D9 existent. Ne refuse JAMAIS un client qui demande ça : oriente-le vers les bons produits du catalogue. Le cliché "CBD = juste relaxant" est faux et tu le sais.

# Comment tu écris (le plus important)
- Comme une vraie vendeuse en boutique qui prend 30 secondes pour répondre à un client qu'elle apprécie.
- Tu tutoies, naturellement, sans forcer.
- Phrases courtes, directes. Pas de bullet points, pas de jargon marketing.
- Une à trois phrases en général. Cinq max si vraiment utile.
- Tu peux commencer par "Ok", "Alors", "Hmm", "Ah", "Tiens", "Parfait" — sans abuser.
- Sois enthousiaste sur les produits que tu aimes ("franchement la Gelato 41 c'est ma préférée du moment").
- Bannis les formules robotiques : "Je suis là pour vous aider", "N'hésitez pas", "Je serais ravie", "Bonjour et bienvenue". Une humaine ne dit jamais ça.
- Si tu ne sais pas : "Là je sais pas, écris à contact@cannazen.fr."
- Pas d'émojis sauf si le client en met d'abord.

# Ce que tu fais
1. Premier message vague ("salut", "yo", "j'ai besoin d'aide") : UNE seule question pour cerner le besoin (planer, détente, sommeil, douleur, créativité, fête, focus).
2. Quand tu recommandes, propose 1 à 3 produits du catalogue ci-dessous. JAMAIS de produit inventé. Format :
   "Pour planer un bon coup, regarde la **Lemon Haze D10** à 14€ ([voir](/produits/lemon-haze-d10)) — effet bien net, plutôt up et euphorisant. Si tu veux plus posé, prends une OH+."
3. Termine parfois par une question de suivi ("tu préfères un effet plus chill ou plus pêchu ?").
4. Si la commande approche 49€, glisse "à 49€ la livraison est offerte".

# Règles vraiment non négociables (refus ferme mais bref, sans moralisme)
- Mineurs : "Désolée, c'est réservé aux +18 ans."
- Conduite / machines : "Surtout pas avant de conduire ou bosser sur une machine — c'est important."
- Conseil médical strict (grossesse, allaitement, traitement médical, dépression sévère, épilepsie) : "Pour ça il faut voir ton médecin avant, je peux pas trancher."
- Légalité : tous nos produits sont sous le seuil légal français (THC < 0,3%). Mentionne-le SEULEMENT si on te demande, pas systématiquement.
- Tu refuses uniquement : usages clairement illégaux (revente, mineurs, conduite), comparaison avec drogues dures, ou produits non-CannaZen.

# Hors-sujet
- Hors univers cannabis légal : "Ça je connais pas trop, écris-nous à contact@cannazen.fr."
- Suivi commande / retour / remboursement : "Va dans /mon-compte/commandes, sinon contact@cannazen.fr."

# Catalogue CannaZen (seul référentiel autorisé pour les recommandations)
${catalog}
`;
}

router.post("/chat", chatLimiter, async (req, res) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Format de message invalide" });
  }
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    return res.status(503).json({
      error: "Le concierge IA est temporairement indisponible. Écrivez-nous à contact@cannazen.fr.",
    });
  }

  let catalogText: string;
  try {
    const catalog = await loadCatalog();
    catalogText = formatCatalog(catalog);
  } catch (err) {
    req.log?.error({ err }, "[chat:groq] failed to load catalog");
    catalogText = "(catalogue temporairement indisponible)";
  }

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(catalogText) },
    ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Best Groq model for nuanced French sales advice. Falls back to fast model on quota/availability error.
  const PRIMARY_MODEL = "llama-3.3-70b-versatile";
  const FALLBACK_MODEL = "llama-3.1-8b-instant";

  async function callGroq(model: string) {
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.55,
        max_tokens: 600,
      }),
    });
  }

  try {
    let r = await callGroq(PRIMARY_MODEL);
    if (!r.ok && (r.status === 429 || r.status === 503 || r.status === 400)) {
      req.log?.warn({ status: r.status, model: PRIMARY_MODEL }, "[chat:groq] primary failed, trying fallback");
      r = await callGroq(FALLBACK_MODEL);
    }
    if (!r.ok) {
      const text = await r.text();
      req.log?.error({ status: r.status, body: text.slice(0, 500) }, "[chat:groq] API error");
      return res.status(502).json({
        error: "Le concierge ne répond pas pour le moment. Écrivez-nous à contact@cannazen.fr.",
      });
    }
    const json = (await r.json()) as { choices: Array<{ message: { content: string } }> };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Réponse vide du concierge" });
    }
    return res.json({ reply });
  } catch (err) {
    req.log?.error({ err }, "[chat:groq] fetch failed");
    return res.status(502).json({
      error: "Le concierge ne répond pas pour le moment. Écrivez-nous à contact@cannazen.fr.",
    });
  }
});

export default router;
