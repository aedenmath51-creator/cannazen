import { Router } from "express";
import { z } from "zod";
import { db, addressesTable, usersTable, loyaltyTransactionsTable, subscriptionsTable, subscriptionPlansTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { sanitizeUser } from "../lib/auth";
import { TIER_LABELS, TIER_THRESHOLDS } from "../lib/loyalty";

const router = Router();
router.use(requireAuth);

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(2),
  country: z.string().default("FR"),
  phone: z.string().optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

router.get("/addresses", async (req, res) => {
  const rows = await db.select().from(addressesTable).where(eq(addressesTable.userId, req.user!.id));
  res.json(rows);
});

router.post("/addresses", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
  if (parsed.data.isDefaultShipping) {
    await db.update(addressesTable).set({ isDefaultShipping: false }).where(eq(addressesTable.userId, req.user!.id));
  }
  if (parsed.data.isDefaultBilling) {
    await db.update(addressesTable).set({ isDefaultBilling: false }).where(eq(addressesTable.userId, req.user!.id));
  }
  const [created] = await db.insert(addressesTable).values({ ...parsed.data, userId: req.user!.id }).returning();
  res.status(201).json(created);
});

router.put("/addresses/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  if (parsed.data.isDefaultShipping) {
    await db.update(addressesTable).set({ isDefaultShipping: false }).where(eq(addressesTable.userId, req.user!.id));
  }
  if (parsed.data.isDefaultBilling) {
    await db.update(addressesTable).set({ isDefaultBilling: false }).where(eq(addressesTable.userId, req.user!.id));
  }
  const [updated] = await db.update(addressesTable)
    .set(parsed.data)
    .where(and(eq(addressesTable.id, id), eq(addressesTable.userId, req.user!.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Adresse introuvable" });
  res.json(updated);
});

router.delete("/addresses/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(addressesTable).where(and(eq(addressesTable.id, id), eq(addressesTable.userId, req.user!.id)));
  res.json({ ok: true });
});

const profileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  newsletterOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

router.put("/profile", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  const update: any = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.birthday) update.birthday = new Date(parsed.data.birthday);
  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, req.user!.id)).returning();
  res.json({ user: sanitizeUser(user) });
});

router.delete("/", async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.user!.id));
  res.clearCookie("cz_session", { path: "/" });
  res.json({ ok: true });
});

router.get("/loyalty", async (req, res) => {
  const user = req.user!;
  const [{ count } = { count: 0 }] = await db.select({ count: usersTable.loyaltyPoints }).from(usersTable).where(eq(usersTable.id, user.id));
  const transactions = await db.select().from(loyaltyTransactionsTable).where(eq(loyaltyTransactionsTable.userId, user.id)).orderBy(desc(loyaltyTransactionsTable.createdAt)).limit(20);
  const points = user.loyaltyPoints;
  const tier = user.loyaltyTier;
  const nextThreshold = points < TIER_THRESHOLDS.silver ? TIER_THRESHOLDS.silver : points < TIER_THRESHOLDS.gold ? TIER_THRESHOLDS.gold : null;
  res.json({
    points,
    tier,
    tierLabel: TIER_LABELS[tier as keyof typeof TIER_LABELS] ?? tier,
    nextThreshold,
    pointsToNext: nextThreshold ? nextThreshold - points : 0,
    transactions,
  });
});

router.get("/subscriptions", async (req, res) => {
  const rows = await db.select({
    id: subscriptionsTable.id,
    status: subscriptionsTable.status,
    startedAt: subscriptionsTable.startedAt,
    nextBillingAt: subscriptionsTable.nextBillingAt,
    pausedUntil: subscriptionsTable.pausedUntil,
    cancelledAt: subscriptionsTable.cancelledAt,
    plan: subscriptionPlansTable,
  })
    .from(subscriptionsTable)
    .leftJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
    .where(eq(subscriptionsTable.userId, req.user!.id));
  res.json(rows);
});

router.post("/subscriptions", async (req, res) => {
  const planId = Number(req.body?.planId);
  if (!planId) return res.status(400).json({ error: "Plan requis" });
  const [plan] = await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, planId)).limit(1);
  if (!plan) return res.status(404).json({ error: "Plan introuvable" });
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  const [sub] = await db.insert(subscriptionsTable).values({
    userId: req.user!.id,
    planId,
    status: "active",
    nextBillingAt: next,
  }).returning();
  res.status(201).json(sub);
});

router.post("/subscriptions/:id/pause", async (req, res) => {
  const id = Number(req.params.id);
  const days = Number(req.body?.days ?? 30);
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await db.update(subscriptionsTable)
    .set({ status: "paused", pausedUntil: until })
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, req.user!.id)));
  res.json({ ok: true });
});

router.post("/subscriptions/:id/resume", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(subscriptionsTable)
    .set({ status: "active", pausedUntil: null })
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, req.user!.id)));
  res.json({ ok: true });
});

router.post("/subscriptions/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(subscriptionsTable)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, req.user!.id)));
  res.json({ ok: true });
});

router.get("/orders", async (req, res) => {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.id)).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

router.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, id), eq(ordersTable.userId, req.user!.id))).limit(1);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  res.json({ ...order, items });
});

export default router;
