import { Router } from "express";
import { z } from "zod";
import { db, newsletterTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken } from "../lib/auth";

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

router.post("/newsletter/subscribe", async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Email invalide" });
  const email = parsed.data.email.toLowerCase();
  const token = generateToken();

  const existing = await db.query.newsletterTable.findFirst({ where: eq(newsletterTable.email, email) });
  if (existing) {
    if (existing.status === "unsubscribed") {
      await db.update(newsletterTable).set({ status: "subscribed", unsubscribedAt: null }).where(eq(newsletterTable.id, existing.id));
      return res.json({ success: true, message: "Réinscription confirmée" });
    }
    return res.json({ success: true, message: "Déjà inscrit" });
  }

  await db.insert(newsletterTable).values({
    email,
    status: "subscribed",
    unsubscribeToken: token,
    source: parsed.data.source ?? "footer",
  });
  return res.json({ success: true, message: "Inscription réussie" });
});

router.get("/newsletter/unsubscribe", async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Token requis" });
  const [sub] = await db.select().from(newsletterTable).where(eq(newsletterTable.unsubscribeToken, token)).limit(1);
  if (!sub) return res.status(404).json({ error: "Lien invalide" });
  await db.update(newsletterTable)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(newsletterTable.id, sub.id));
  res.json({ success: true, email: sub.email });
});

export default router;
