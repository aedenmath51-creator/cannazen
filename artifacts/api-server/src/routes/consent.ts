import { Router } from "express";
import { z } from "zod";
import { db, cookieConsentsTable } from "@workspace/db";

const router = Router();

const consentSchema = z.object({
  necessary: z.boolean().default(true),
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  consentVersion: z.string().default("1.0"),
});

router.post("/consent", async (req, res) => {
  const parsed = consentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  const sessionId = (req.headers["x-session-id"] as string | undefined) ?? null;
  await db.insert(cookieConsentsTable).values({
    sessionId,
    userId: req.user?.id ?? null,
    necessary: parsed.data.necessary,
    analytics: parsed.data.analytics,
    marketing: parsed.data.marketing,
    consentVersion: parsed.data.consentVersion,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null,
  });
  res.json({ ok: true });
});

export default router;
