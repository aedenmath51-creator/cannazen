import { Router } from "express";
import { db } from "@workspace/db";
import { cartsTable, cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveFromCartParams } from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router = Router();

const FREE_SHIPPING_THRESHOLD = 49;
const SHIPPING_COST = 4.9;

async function buildCartResponse(cartId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      cartId: cartItemsTable.cartId,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      unitPrice: cartItemsTable.unitPrice,
      productName: productsTable.name,
      productSlug: productsTable.slug,
      productImageUrl: productsTable.imageUrl,
      productRating: productsTable.rating,
      productReviewCount: productsTable.reviewCount,
      productIsBestseller: productsTable.isBestseller,
      productIsNew: productsTable.isNew,
      productInStock: productsTable.inStock,
      productStrain: productsTable.strain,
      productThcContent: productsTable.thcContent,
      productCbdContent: productsTable.cbdContent,
      productTags: productsTable.tags,
      productCategoryId: productsTable.categoryId,
      productCategoryName: categoriesTable.name,
      productCategorySlug: categoriesTable.slug,
      productPrice: productsTable.price,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(cartItemsTable.cartId, cartId));

  const formattedItems = items.map((item) => ({
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.unitPrice) * item.quantity,
    product: {
      id: item.productId,
      name: item.productName,
      slug: item.productSlug,
      price: Number(item.productPrice),
      imageUrl: item.productImageUrl,
      categoryId: item.productCategoryId,
      categoryName: item.productCategoryName ?? "",
      categorySlug: item.productCategorySlug ?? "",
      strain: item.productStrain,
      thcContent: item.productThcContent,
      cbdContent: item.productCbdContent,
      rating: Number(item.productRating ?? 0),
      reviewCount: item.productReviewCount,
      isBestseller: item.productIsBestseller,
      isNew: item.productIsNew,
      inStock: item.productInStock,
      tags: item.productTags ?? [],
    },
  }));

  const subtotal = formattedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const itemCount = formattedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cartId,
    sessionId: "",
    items: formattedItems,
    subtotal,
    shipping,
    discount: 0,
    total,
    itemCount,
  };
}

const EMPTY_CART = { id: 0, sessionId: "", items: [], subtotal: 0, total: 0, shipping: 0, discount: 0, itemCount: 0 };

router.get("/cart", async (req, res) => {
  let cart;
  if (req.user) {
    cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.userId, req.user.id) });
  } else if (req.guestSessionId) {
    cart = await db.query.cartsTable.findFirst({ where: and(eq(cartsTable.sessionId, req.guestSessionId), isNull(cartsTable.userId)) });
  } else {
    return res.json(EMPTY_CART);
  }
  if (!cart) return res.json(EMPTY_CART);
  const response = await buildCartResponse(cart.id);
  response.sessionId = cart.sessionId;
  return res.json(response);
});

router.post("/cart", async (req, res) => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { productId, quantity } = parsed.data;

  const product = await db.query.productsTable.findFirst({ where: eq(productsTable.id, productId) });
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart;
  if (req.user) {
    cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.userId, req.user.id) });
    if (!cart) {
      [cart] = await db.insert(cartsTable).values({ sessionId: nanoid(40), userId: req.user.id }).returning();
    }
  } else if (req.guestSessionId) {
    cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.sessionId, req.guestSessionId) });
    if (!cart) {
      [cart] = await db.insert(cartsTable).values({ sessionId: req.guestSessionId }).returning();
    }
  } else {
    return res.status(401).json({ message: "Session requise. Appelez POST /api/auth/guest-session d'abord." });
  }

  const existingItem = await db.query.cartItemsTable.findFirst({
    where: and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, productId)),
  });

  if (existingItem) {
    await db.update(cartItemsTable)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(cartItemsTable.id, existingItem.id));
  } else {
    await db.insert(cartItemsTable).values({
      cartId: cart.id,
      productId,
      quantity,
      unitPrice: product.price,
    });
  }

  const response = await buildCartResponse(cart.id);
  response.sessionId = cart.sessionId;
  return res.json(response);
});

async function loadOwnedCartItem(itemId: number, req: { user?: { id: number }; guestSessionId?: string }) {
  if (!itemId) return null;
  const rows = await db
    .select({ itemId: cartItemsTable.id, cartId: cartItemsTable.cartId, cartSession: cartsTable.sessionId, cartUserId: cartsTable.userId })
    .from(cartItemsTable)
    .innerJoin(cartsTable, eq(cartItemsTable.cartId, cartsTable.id))
    .where(eq(cartItemsTable.id, itemId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const isOwner =
    (req.user && row.cartUserId === req.user.id) ||
    (req.guestSessionId && row.cartSession === req.guestSessionId && !row.cartUserId);
  if (!isOwner) return null;
  return row;
}

router.put("/cart/:itemId", async (req, res) => {
  const paramParsed = UpdateCartItemParams.safeParse({ itemId: Number(req.params.itemId) });
  const bodyParsed = UpdateCartItemBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) return res.status(400).json({ message: "Invalid request" });

  const { itemId } = paramParsed.data;
  const { quantity } = bodyParsed.data;

  const owned = await loadOwnedCartItem(itemId, req);
  if (!owned) return res.status(404).json({ message: "Article introuvable" });

  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  } else {
    await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId));
  }

  const response = await buildCartResponse(owned.cartId);
  response.sessionId = owned.cartSession;
  return res.json(response);
});

router.delete("/cart/:itemId", async (req, res) => {
  const parsed = RemoveFromCartParams.safeParse({ itemId: Number(req.params.itemId) });
  if (!parsed.success) return res.status(400).json({ message: "Invalid itemId" });

  const owned = await loadOwnedCartItem(parsed.data.itemId, req);
  if (!owned) return res.status(404).json({ message: "Article introuvable" });

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, parsed.data.itemId));

  const response = await buildCartResponse(owned.cartId);
  response.sessionId = owned.cartSession;
  return res.json(response);
});

router.delete("/cart", async (req, res) => {
  if (req.user) {
    const cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.userId, req.user.id) });
    if (cart) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
    }
  } else if (req.guestSessionId) {
    const cart = await db.query.cartsTable.findFirst({ where: and(eq(cartsTable.sessionId, req.guestSessionId), isNull(cartsTable.userId)) });
    if (cart) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
    }
  }
  return res.json(EMPTY_CART);
});

export default router;
