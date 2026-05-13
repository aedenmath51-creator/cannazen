import { Router } from "express";
import { z } from "zod";
import { db, promoCodesTable, promoCodeUsesTable } from "@workspace/db";
import { eq, and, gt, count } from "drizzle-orm";

const router = Router();

const validateSchema = z.object({
  code: z.string().min(2),
  subtotal: z.number().nonnegative(),
});

router.post("/promo/validate", async (req, res) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Code invalide" });
  const code = parsed.data.code.toUpperCase().trim();

  const [promo] = await db.select().from(promoCodesTable)
    .where(and(eq(promoCodesTable.code, code), eq(promoCodesTable.isActive, true)))
    .limit(1);

  if (!promo) return res.status(404).json({ error: "Code promo invalide" });
  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) return res.status(400).json({ error: "Code pas encore actif" });
  if (promo.expiresAt && promo.expiresAt < now) return res.status(400).json({ error: "Code expiré" });
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: "Code épuisé" });
  if (promo.minOrderAmount && parsed.data.subtotal < Number(promo.minOrderAmount)) {
    return res.status(400).json({ error: `Minimum ${promo.minOrderAmount}€ requis` });
  }

  if (req.user) {
    const [{ used = 0 } = {}] = await db.select({ used: count() }).from(promoCodeUsesTable)
      .where(and(eq(promoCodeUsesTable.promoCodeId, promo.id), eq(promoCodeUsesTable.userId, req.user.id)));
    if (promo.perUserLimit && Number(used) >= promo.perUserLimit) return res.status(400).json({ error: "Vous avez déjà utilisé ce code" });
  }

  let discount = 0;
  let freeShipping = false;
  if (promo.type === "fixed") discount = Number(promo.value);
  else if (promo.type === "percent") discount = Math.round((parsed.data.subtotal * Number(promo.value)) / 100 * 100) / 100;
  else if (promo.type === "free_shipping") freeShipping = true;
  if (discount > parsed.data.subtotal) discount = parsed.data.subtotal;

  res.json({
    valid: true,
    code: promo.code,
    description: promo.description,
    type: promo.type,
    discount,
    freeShipping,
  });
});

export default router;
