import { Router } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import {
  db, productsTable, categoriesTable, ordersTable, orderItemsTable,
  usersTable, reviewsTable, blogPostsTable, blogCategoriesTable,
  promoCodesTable, subscriptionsTable, subscriptionPlansTable,
  emailOutboxTable, auditLogsTable, newsletterTable, loyaltyTransactionsTable
} from "@workspace/db";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { logAudit } from "../lib/audit";
import { sendTemplate, templates } from "../lib/email";
import { generateTracking } from "../lib/shipping";

const router = Router();
router.use(requireAdmin);

router.get("/admin/dashboard", async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [{ revenue30 = "0" } = {}] = await db.select({
    revenue30: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric)::text, '0')`,
  }).from(ordersTable).where(and(eq(ordersTable.paymentStatus, "paid"), gte(ordersTable.createdAt, thirtyDaysAgo)));

  const [{ revenue7 = "0" } = {}] = await db.select({
    revenue7: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric)::text, '0')`,
  }).from(ordersTable).where(and(eq(ordersTable.paymentStatus, "paid"), gte(ordersTable.createdAt, sevenDaysAgo)));

  const [{ ordersCount = 0 } = {}] = await db.select({ ordersCount: count() }).from(ordersTable);
  const [{ paidCount = 0 } = {}] = await db.select({ paidCount: count() }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid"));
  const [{ customers = 0 } = {}] = await db.select({ customers: count() }).from(usersTable);
  const [{ productsCount = 0 } = {}] = await db.select({ productsCount: count() }).from(productsTable);

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(8);

  const topProducts = await db.select({
    productId: orderItemsTable.productId,
    productName: orderItemsTable.productName,
    qty: sql<number>`SUM(${orderItemsTable.quantity})::int`,
    revenue: sql<string>`SUM(${orderItemsTable.totalPrice}::numeric)::text`,
  })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productId, orderItemsTable.productName)
    .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
    .limit(5);

  const avgBasket = paidCount > 0 ? Number(revenue30) / paidCount : 0;

  res.json({
    revenue30: Number(revenue30),
    revenue7: Number(revenue7),
    ordersCount: Number(ordersCount),
    paidCount: Number(paidCount),
    customers: Number(customers),
    productsCount: Number(productsCount),
    avgBasket: Math.round(avgBasket * 100) / 100,
    recentOrders,
    topProducts,
  });
});

router.get("/admin/products", async (_req, res) => {
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  res.json(rows);
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform((v) => String(v)),
  compareAtPrice: z.union([z.string(), z.number()]).optional().transform((v) => v === undefined ? null : String(v)),
  imageUrl: z.string().optional().nullable(),
  categoryId: z.number(),
  strain: z.string().optional().nullable(),
  thcContent: z.string().optional().nullable(),
  cbdContent: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  weightGrams: z.number().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  stock: z.number().optional(),
  isBestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isOrganic: z.boolean().optional(),
  batchNumber: z.string().optional().nullable(),
  coaPdfUrl: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
});

router.post("/admin/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
  const [created] = await db.insert(productsTable).values(parsed.data as any).returning();
  await logAudit({ req, action: "product.create", entityType: "product", entityId: created.id });
  res.status(201).json(created);
});

router.put("/admin/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  const [updated] = await db.update(productsTable).set(parsed.data as any).where(eq(productsTable.id, id)).returning();
  await logAudit({ req, action: "product.update", entityType: "product", entityId: id });
  res.json(updated);
});

router.delete("/admin/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(productsTable).set({ isActive: false }).where(eq(productsTable.id, id));
  await logAudit({ req, action: "product.deactivate", entityType: "product", entityId: id });
  res.json({ ok: true });
});

router.get("/admin/categories", async (_req, res) => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
  res.json(rows);
});

router.put("/admin/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["name", "slug", "description", "imageUrl", "isActive", "isRestrictable", "sortOrder", "metaTitle", "metaDescription"];
  const update: any = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const [u] = await db.update(categoriesTable).set(update).where(eq(categoriesTable.id, id)).returning();
  await logAudit({ req, action: "category.update", entityType: "category", entityId: id, metadata: update });
  res.json(u);
});

router.post("/admin/categories", async (req, res) => {
  const allowed = ["name", "slug", "description", "imageUrl", "isActive", "isRestrictable", "sortOrder"];
  const data: any = {};
  for (const k of allowed) if (k in req.body) data[k] = req.body[k];
  if (!data.name || !data.slug) return res.status(400).json({ error: "name et slug requis" });
  const [c] = await db.insert(categoriesTable).values(data).returning();
  await logAudit({ req, action: "category.create", entityType: "category", entityId: c.id });
  res.status(201).json(c);
});

router.get("/admin/orders", async (_req, res) => {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(rows);
});

router.get("/admin/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!o) return res.status(404).json({ error: "Introuvable" });
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json({ ...o, items });
});

router.post("/admin/orders/:id/ship", async (req, res) => {
  const id = Number(req.params.id);
  const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!o) return res.status(404).json({ error: "Introuvable" });
  const carrier = (o.shippingCarrier ?? "colissimo_home") as any;
  const { trackingNumber, trackingUrl } = generateTracking(carrier);
  await db.update(ordersTable).set({
    status: "shipped",
    fulfillmentStatus: "fulfilled",
    trackingNumber,
    trackingUrl,
    shippedAt: new Date(),
  }).where(eq(ordersTable.id, id));
  if (o.email) {
    await sendTemplate(o.email, templates.orderShipped(o.firstName ?? "client", o.orderNumber ?? `#${o.id}`, trackingNumber, trackingUrl));
  }
  await logAudit({ req, action: "order.ship", entityType: "order", entityId: id });
  res.json({ ok: true, trackingNumber, trackingUrl });
});

router.post("/admin/orders/:id/deliver", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(ordersTable).set({ status: "delivered", deliveredAt: new Date() }).where(eq(ordersTable.id, id));
  const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (o?.email) {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)).limit(1);
    const productSlug = items[0] ? "" : "";
    await sendTemplate(o.email, templates.orderDelivered(o.firstName ?? "client", o.orderNumber ?? `#${o.id}`, productSlug));
  }
  await logAudit({ req, action: "order.deliver", entityType: "order", entityId: id });
  res.json({ ok: true });
});

router.post("/admin/orders/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(ordersTable).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(ordersTable.id, id));
  await logAudit({ req, action: "order.cancel", entityType: "order", entityId: id });
  res.json({ ok: true });
});

router.post("/admin/orders/:id/refund", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(ordersTable).set({ paymentStatus: "refunded" }).where(eq(ordersTable.id, id));
  await logAudit({ req, action: "order.refund", entityType: "order", entityId: id });
  res.json({ ok: true });
});

router.get("/admin/customers", async (_req, res) => {
  const rows = await db.select({
    id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName,
    role: usersTable.role, emailVerified: usersTable.emailVerified, loyaltyPoints: usersTable.loyaltyPoints,
    loyaltyTier: usersTable.loyaltyTier, createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(rows);
});

router.get("/admin/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!u) return res.status(404).json({ error: "Introuvable" });
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, id)).orderBy(desc(ordersTable.createdAt));
  const transactions = await db.select().from(loyaltyTransactionsTable).where(eq(loyaltyTransactionsTable.userId, id)).orderBy(desc(loyaltyTransactionsTable.createdAt));
  const { passwordHash, twoFactorSecret, ...safe } = u;
  res.json({ ...safe, orders, loyaltyTransactions: transactions });
});

router.get("/admin/blog/posts", async (_req, res) => {
  const rows = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.createdAt));
  res.json(rows);
});

const ALLOWED_BLOG_HTML: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "figure", "figcaption", "h1", "h2", "h3", "h4", "h5", "h6",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height", "loading"],
    a: ["href", "title", "target", "rel"],
    "*": ["class"],
  },
  allowedSchemes: ["https", "http", "mailto"],
  disallowedTagsMode: "discard",
};

const blogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1),
  coverImageUrl: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  readingMinutes: z.number().optional(),
});

router.post("/admin/blog/posts", async (req, res) => {
  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
  const sanitizedContent = sanitizeHtml(parsed.data.content, ALLOWED_BLOG_HTML);
  const data: any = { ...parsed.data, content: sanitizedContent, authorId: req.user!.id, authorName: parsed.data.authorName ?? req.user!.firstName };
  if (parsed.data.isPublished) data.publishedAt = new Date();
  const [p] = await db.insert(blogPostsTable).values(data).returning();
  await logAudit({ req, action: "blog.create", entityType: "blog_post", entityId: p.id });
  res.status(201).json(p);
});

router.put("/admin/blog/posts/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = blogPostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  const sanitizedContent = parsed.data.content !== undefined
    ? sanitizeHtml(parsed.data.content, ALLOWED_BLOG_HTML)
    : undefined;
  const data: any = {
    ...parsed.data,
    ...(sanitizedContent !== undefined ? { content: sanitizedContent } : {}),
    updatedAt: new Date(),
  };
  if (parsed.data.isPublished === true) data.publishedAt = new Date();
  const [p] = await db.update(blogPostsTable).set(data).where(eq(blogPostsTable.id, id)).returning();
  await logAudit({ req, action: "blog.update", entityType: "blog_post", entityId: id });
  res.json(p);
});

router.delete("/admin/blog/posts/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  await logAudit({ req, action: "blog.delete", entityType: "blog_post", entityId: id });
  res.json({ ok: true });
});

router.post("/admin/blog/categories", async (req, res) => {
  const { name, slug, description } = req.body ?? {};
  if (!name || !slug) return res.status(400).json({ error: "name et slug requis" });
  const [c] = await db.insert(blogCategoriesTable).values({ name, slug, description }).returning();
  res.status(201).json(c);
});

router.get("/admin/promo-codes", async (_req, res) => {
  const rows = await db.select().from(promoCodesTable).orderBy(desc(promoCodesTable.createdAt));
  res.json(rows);
});

router.post("/admin/promo-codes", async (req, res) => {
  const { code, description, type, value, minOrderAmount, maxUses, perUserLimit, expiresAt } = req.body ?? {};
  if (!code || !type || value === undefined) return res.status(400).json({ error: "Champs requis manquants" });
  const [p] = await db.insert(promoCodesTable).values({
    code: String(code).toUpperCase().trim(),
    description,
    type,
    value: String(value),
    minOrderAmount: minOrderAmount !== undefined ? String(minOrderAmount) : null,
    maxUses: maxUses ?? null,
    perUserLimit: perUserLimit ?? 1,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }).returning();
  await logAudit({ req, action: "promo.create", entityType: "promo_code", entityId: p.id });
  res.status(201).json(p);
});

router.put("/admin/promo-codes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["isActive", "expiresAt", "maxUses", "description"];
  const update: any = {};
  for (const k of allowed) if (k in req.body) update[k] = k === "expiresAt" && req.body[k] ? new Date(req.body[k]) : req.body[k];
  const [p] = await db.update(promoCodesTable).set(update).where(eq(promoCodesTable.id, id)).returning();
  res.json(p);
});

router.delete("/admin/promo-codes/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(promoCodesTable).set({ isActive: false }).where(eq(promoCodesTable.id, id));
  res.json({ ok: true });
});

router.get("/admin/reviews", async (req, res) => {
  const status = (req.query.status as string) ?? null;
  const rows = status
    ? await db.select().from(reviewsTable).where(eq(reviewsTable.status, status)).orderBy(desc(reviewsTable.createdAt))
    : await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  res.json(rows);
});

router.post("/admin/reviews/:id/moderate", async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ error: "Statut invalide" });
  await db.update(reviewsTable).set({ status, moderatedAt: new Date() }).where(eq(reviewsTable.id, id));
  await logAudit({ req, action: "review.moderate", entityType: "review", entityId: id, metadata: { status } });
  res.json({ ok: true });
});

router.get("/admin/email-outbox", async (_req, res) => {
  const rows = await db.select().from(emailOutboxTable).orderBy(desc(emailOutboxTable.createdAt)).limit(100);
  res.json(rows);
});

router.get("/admin/audit-logs", async (_req, res) => {
  const rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);
  res.json(rows);
});

router.get("/admin/newsletter", async (_req, res) => {
  const rows = await db.select().from(newsletterTable).orderBy(desc(newsletterTable.subscribedAt));
  res.json(rows);
});

router.get("/admin/subscription-plans", async (_req, res) => {
  const rows = await db.select().from(subscriptionPlansTable).orderBy(subscriptionPlansTable.id);
  res.json(rows);
});

router.post("/admin/subscription-plans", async (req, res) => {
  const { name, slug, description, monthlyPrice, productCount, imageUrl } = req.body ?? {};
  if (!name || !slug || monthlyPrice === undefined) return res.status(400).json({ error: "Champs requis manquants" });
  const [p] = await db.insert(subscriptionPlansTable).values({
    name, slug, description, monthlyPrice: String(monthlyPrice), productCount: productCount ?? 3, imageUrl,
  }).returning();
  res.status(201).json(p);
});

router.get("/admin/subscriptions", async (_req, res) => {
  const rows = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));
  res.json(rows);
});

export default router;
