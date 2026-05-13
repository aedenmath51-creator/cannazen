import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { reviewsTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/reviews", async (req, res) => {
  const productId = Number(req.query.productId);
  if (!productId) return res.status(400).json({ message: "productId required" });
  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.status, "approved")))
    .orderBy(reviewsTable.createdAt);
  return res.json(reviews.reverse());
});

const reviewSchema = z.object({
  productId: z.number(),
  rating: z.number().int().min(1).max(5),
  body: z.string().optional(),
  productVariant: z.string().optional(),
  authorName: z.string().optional(),
  authorLocation: z.string().optional(),
});

router.post("/reviews", async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  let authorName = parsed.data.authorName ?? "Anonyme";
  let userId: number | null = null;
  let status = "pending";
  if (req.user) {
    userId = req.user.id;
    authorName = parsed.data.authorName ?? `${req.user.firstName ?? "Client"} ${(req.user.lastName ?? "").charAt(0)}.`;
    // verified buyer auto-approval
    const [bought] = await db.select({ id: orderItemsTable.id }).from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(and(eq(ordersTable.userId, userId), eq(orderItemsTable.productId, parsed.data.productId)))
      .limit(1);
    if (bought) status = "approved";
  }

  const [review] = await db.insert(reviewsTable).values({
    productId: parsed.data.productId,
    userId,
    rating: parsed.data.rating,
    body: parsed.data.body,
    productVariant: parsed.data.productVariant,
    authorName,
    authorLocation: parsed.data.authorLocation,
    status,
  }).returning();

  if (status === "approved") {
    const [stats] = await db.select({
      avg: sql<number>`round(avg(${reviewsTable.rating})::numeric, 2)`,
      count: sql<number>`count(*)::int`,
    }).from(reviewsTable).where(and(eq(reviewsTable.productId, parsed.data.productId), eq(reviewsTable.status, "approved")));
    await db.update(productsTable)
      .set({ rating: String(stats.avg ?? 0), reviewCount: stats.count ?? 0 })
      .where(eq(productsTable.id, parsed.data.productId));
  }

  return res.status(201).json(review);
});

export default router;
