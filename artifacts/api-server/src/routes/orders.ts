import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartsTable, cartItemsTable, productsTable, promoCodesTable, promoCodeUsesTable } from "@workspace/db";
import { eq, and, sql, isNull } from "drizzle-orm";
import { calculateShipping, shippingLabel, type CarrierId } from "../lib/shipping";
import { paymentProvider, type PaymentMethod } from "../lib/payment";
import { awardPoints } from "../lib/loyalty";
import { sendTemplate, templates } from "../lib/email";

const router = Router();

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    total: Number(order.total),
    items: items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  };
}

router.get("/orders", async (req, res) => {
  if (!req.user && !req.guestSessionId) return res.json([]);
  const cond = req.user
    ? eq(ordersTable.userId, req.user.id)
    : and(eq(ordersTable.sessionId, req.guestSessionId!), isNull(ordersTable.userId));
  const orders = await db.select().from(ordersTable).where(cond).orderBy(ordersTable.createdAt);
  const result = await Promise.all(orders.map(buildOrderResponse));
  return res.json(result.reverse());
});

const createOrderSchema = z.object({
  sessionId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  shippingAddress: z.string().min(1),
  billingAddress: z.string().optional(),
  paymentMethod: z.enum(["card", "card_3x", "card_4x", "apple_pay", "google_pay", "bank_transfer"]).default("card"),
  shippingCarrier: z.string().default("colissimo_home"),
  shippingPickupPoint: z.string().optional(),
  promoCode: z.string().optional(),
  notes: z.string().optional(),
  ageConfirmed: z.literal(true, { message: "Vous devez certifier avoir 18 ans révolus" }),
  acceptTerms: z.literal(true, { message: "Vous devez accepter les CGV" }),
});

router.post("/orders", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides", details: parsed.error.issues });
  const data = parsed.data;

  let cart;
  if (req.user) {
    cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.userId, req.user.id) });
  } else if (req.guestSessionId) {
    cart = await db.query.cartsTable.findFirst({ where: eq(cartsTable.sessionId, req.guestSessionId) });
  } else {
    return res.status(401).json({ message: "Session requise. Appelez POST /api/auth/guest-session d'abord." });
  }
  if (!cart) return res.status(400).json({ message: "Panier introuvable" });

  const cartItems = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      unitPrice: cartItemsTable.unitPrice,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
      productWeightGrams: productsTable.weightGrams,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id));

  if (!cartItems.length) return res.status(400).json({ message: "Panier vide" });

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const totalWeight = cartItems.reduce((sum, i) => sum + (i.productWeightGrams ?? 50) * i.quantity, 0);

  let discount = 0;
  let promo: typeof promoCodesTable.$inferSelect | null = null;
  let freeShipping = false;
  if (data.promoCode) {
    const code = data.promoCode.toUpperCase().trim();
    const [found] = await db.select().from(promoCodesTable).where(and(eq(promoCodesTable.code, code), eq(promoCodesTable.isActive, true))).limit(1);
    if (found) {
      const now = new Date();
      const isUsable =
        (!found.startsAt || found.startsAt <= now) &&
        (!found.expiresAt || found.expiresAt >= now) &&
        (!found.maxUses || found.usedCount < found.maxUses) &&
        (!found.minOrderAmount || subtotal >= Number(found.minOrderAmount));
      if (isUsable) {
        promo = found;
        if (found.type === "fixed") discount = Math.min(Number(found.value), subtotal);
        else if (found.type === "percent") discount = Math.round((subtotal * Number(found.value)) / 100 * 100) / 100;
        else if (found.type === "free_shipping") freeShipping = true;
      }
    }
  }

  let shipping = freeShipping ? 0 : calculateShipping({ carrierId: data.shippingCarrier as CarrierId, subtotal: subtotal - discount, weightGrams: totalWeight });
  const total = Math.max(0, subtotal - discount + shipping);

  const orderNumber = `CZ-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    sessionId: req.guestSessionId ?? cart.sessionId,
    userId: req.user?.id ?? null,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress ?? data.shippingAddress,
    paymentMethod: data.paymentMethod,
    paymentProvider: paymentProvider.name,
    shippingCarrier: data.shippingCarrier,
    shippingService: shippingLabel(data.shippingCarrier as CarrierId),
    shippingPickupPoint: data.shippingPickupPoint,
    promoCode: promo?.code ?? null,
    notes: data.notes,
    subtotal: String(subtotal),
    shipping: String(shipping),
    discount: String(discount),
    total: String(total),
    status: "pending",
    paymentStatus: "pending",
  }).returning();

  await db.insert(orderItemsTable).values(
    cartItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: String(Number(item.unitPrice) * item.quantity),
      productName: item.productName ?? "Produit",
      productImageUrl: item.productImageUrl,
    })),
  );

  // decrement stock
  for (const item of cartItems) {
    await db.update(productsTable)
      .set({ stock: sql`GREATEST(${productsTable.stock} - ${item.quantity}, 0)` })
      .where(eq(productsTable.id, item.productId));
  }

  // mark promo used
  if (promo) {
    await db.insert(promoCodeUsesTable).values({
      promoCodeId: promo.id,
      userId: req.user?.id ?? null,
      orderId: order.id,
      discountAmount: String(discount),
    });
    await db.update(promoCodesTable)
      .set({ usedCount: sql`${promoCodesTable.usedCount} + 1` })
      .where(eq(promoCodesTable.id, promo.id));
  }

  // Create payment intent
  const intent = await paymentProvider.createIntent({
    orderId: order.id,
    amount: total,
    method: data.paymentMethod as PaymentMethod,
    customerEmail: data.email,
    orderNumber,
  });

  await db.update(ordersTable)
    .set({ paymentIntentId: intent.id })
    .where(eq(ordersTable.id, order.id));

  // Award loyalty points if user logged in (will be reverted on cancel/refund manually)
  if (req.user) {
    await awardPoints({ userId: req.user.id, points: Math.floor(total), reason: "Commande " + orderNumber, orderId: order.id });
  }

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  // Send confirmation email (mock)
  await sendTemplate(data.email, templates.orderConfirmation(data.firstName, orderNumber, String(total.toFixed(2))));

  const full = await buildOrderResponse(order);
  return res.status(201).json({ ...full, paymentHostedUrl: intent.hostedUrl, paymentIntentId: intent.id });
});

router.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalide" });
  const order = await db.query.ordersTable.findFirst({ where: eq(ordersTable.id, id) });
  if (!order) return res.status(404).json({ message: "Commande introuvable" });
  const isOwner =
    (req.user && (req.user.id === order.userId || req.user.role === "admin")) ||
    (!!req.guestSessionId && req.guestSessionId === order.sessionId && order.userId === null);
  if (!isOwner) return res.status(404).json({ message: "Commande introuvable" });
  return res.json(await buildOrderResponse(order));
});

export default router;
