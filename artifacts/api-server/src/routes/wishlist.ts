import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { RemoveFromWishlistParams } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

router.get("/wishlist", async (req, res) => {
  let where;
  if (req.user) {
    where = eq(wishlistItemsTable.userId, req.user.id);
  } else if (req.guestSessionId) {
    where = and(eq(wishlistItemsTable.sessionId, req.guestSessionId), isNull(wishlistItemsTable.userId));
  } else {
    return res.json([]);
  }

  const items = await db
    .select({
      id: wishlistItemsTable.id,
      sessionId: wishlistItemsTable.sessionId,
      productId: wishlistItemsTable.productId,
      addedAt: wishlistItemsTable.addedAt,
      productName: productsTable.name,
      productSlug: productsTable.slug,
      productPrice: productsTable.price,
      productImageUrl: productsTable.imageUrl,
      productRating: productsTable.rating,
      productReviewCount: productsTable.reviewCount,
      productIsBestseller: productsTable.isBestseller,
      productIsNew: productsTable.isNew,
      productInStock: productsTable.inStock,
      productStrain: productsTable.strain,
      productCategoryId: productsTable.categoryId,
      productCategoryName: categoriesTable.name,
      productCategorySlug: categoriesTable.slug,
      productTags: productsTable.tags,
    })
    .from(wishlistItemsTable)
    .leftJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(where)
    .orderBy(wishlistItemsTable.addedAt);

  return res.json(items.reverse().map((item) => ({
    id: item.id,
    sessionId: item.sessionId,
    productId: item.productId,
    addedAt: item.addedAt,
    product: {
      id: item.productId,
      name: item.productName ?? "",
      slug: item.productSlug ?? "",
      price: Number(item.productPrice ?? 0),
      imageUrl: item.productImageUrl,
      categoryId: item.productCategoryId ?? 0,
      categoryName: item.productCategoryName ?? "",
      categorySlug: item.productCategorySlug ?? "",
      strain: item.productStrain,
      rating: Number(item.productRating ?? 0),
      reviewCount: item.productReviewCount ?? 0,
      isBestseller: item.productIsBestseller ?? false,
      isNew: item.productIsNew ?? false,
      inStock: item.productInStock ?? true,
      tags: item.productTags ?? [],
    },
  })));
});

const addToWishlistSchema = z.object({ productId: z.number() });

router.post("/wishlist", async (req, res) => {
  const parsed = addToWishlistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { productId } = parsed.data;

  if (req.user) {
    const existing = await db.query.wishlistItemsTable.findFirst({
      where: and(eq(wishlistItemsTable.userId, req.user.id), eq(wishlistItemsTable.productId, productId)),
    });
    if (existing) return res.json({ id: existing.id, sessionId: existing.sessionId, productId, addedAt: existing.addedAt });
    const sid = `user-${req.user.id}`;
    const [item] = await db.insert(wishlistItemsTable).values({ sessionId: sid, userId: req.user.id, productId }).returning();
    return res.json(item);
  } else if (req.guestSessionId) {
    const existing = await db.query.wishlistItemsTable.findFirst({
      where: and(eq(wishlistItemsTable.sessionId, req.guestSessionId), eq(wishlistItemsTable.productId, productId)),
    });
    if (existing) return res.json({ id: existing.id, sessionId: existing.sessionId, productId, addedAt: existing.addedAt });
    const [item] = await db.insert(wishlistItemsTable).values({ sessionId: req.guestSessionId, productId }).returning();
    return res.json(item);
  } else {
    return res.status(401).json({ message: "Session requise. Appelez POST /api/auth/guest-session d'abord." });
  }
});

router.delete("/wishlist/:productId", async (req, res) => {
  const parsed = RemoveFromWishlistParams.safeParse({ productId: Number(req.params.productId) });
  if (!parsed.success) return res.status(400).json({ message: "Invalid productId" });

  if (req.user) {
    await db.delete(wishlistItemsTable).where(
      and(eq(wishlistItemsTable.productId, parsed.data.productId), eq(wishlistItemsTable.userId, req.user.id))
    );
  } else if (req.guestSessionId) {
    await db.delete(wishlistItemsTable).where(
      and(eq(wishlistItemsTable.productId, parsed.data.productId), eq(wishlistItemsTable.sessionId, req.guestSessionId), isNull(wishlistItemsTable.userId))
    );
  }
  return res.json({ success: true });
});

export default router;
