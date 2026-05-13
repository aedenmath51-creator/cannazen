import { Router } from "express";
import { z } from "zod";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { handlePaymentSuccess, handlePaymentFailure, mollieProvider } from "../lib/payment";
import { sendTemplate, templates } from "../lib/email";
import { createParcelForOrder, isSendcloudActive } from "../lib/shipping-sendcloud";

const router = Router();

const webhookSchema = z.object({
  orderId: z.number(),
  intentId: z.string(),
  outcome: z.enum(["succeeded", "failed"]),
});

// Mock webhook (only usable in dev, or with shared secret in prod) — kept for fallback when MOLLIE_API_KEY absent.
router.post("/payment/mock-webhook", async (req, res) => {
  const sharedSecret = process.env["PAYMENT_MOCK_WEBHOOK_SECRET"];
  const headerSecret = req.headers["x-mock-webhook-secret"] as string | undefined;
  const isProd = process.env["NODE_ENV"] === "production";
  if (isProd && (!sharedSecret || headerSecret !== sharedSecret)) {
    return res.status(404).json({ error: "Not found" });
  }

  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Webhook invalide" });
  const { orderId, intentId, outcome } = parsed.data;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  if (!order.paymentIntentId || order.paymentIntentId !== intentId) {
    return res.status(400).json({ error: "Intent ID ne correspond pas" });
  }
  const alreadyFinal = order.paymentStatus === "paid" || order.paymentStatus === "failed";

  if (outcome === "succeeded") {
    const flipped = await handlePaymentSuccess(orderId, intentId);
    if (flipped && !alreadyFinal && order.email) {
      await sendTemplate(
        order.email,
        templates.orderConfirmation(order.firstName ?? "client", order.orderNumber ?? `#${order.id}`, order.total),
      );
      // Best-effort: create Sendcloud parcel after first successful payment flip.
      if (isSendcloudActive) {
        createParcelForOrder(orderId).catch((err) =>
          req.log?.error({ err, orderId }, "[payment:mock] sendcloud parcel creation failed"),
        );
      }
    }
  } else {
    await handlePaymentFailure(orderId, intentId, "Mock failure");
  }
  return res.json({ ok: true });
});

// Mollie webhook — Mollie sends `id` as application/x-www-form-urlencoded.
// Always respond 200 quickly; Mollie retries on non-2xx.
router.post("/payment/mollie/webhook", async (req, res) => {
  if (!mollieProvider) {
    req.log?.warn("[payment:mollie] webhook hit but Mollie not configured");
    return res.status(200).end();
  }
  const id = (req.body?.id as string | undefined) ?? (req.query["id"] as string | undefined);
  if (!id) return res.status(200).end();

  try {
    const payment = await mollieProvider.fetchPayment(id);
    const orderId = Number(payment.metadata?.orderId);
    if (!orderId || Number.isNaN(orderId)) {
      req.log?.warn({ id }, "[payment:mollie] webhook missing metadata.orderId");
      return res.status(200).end();
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) return res.status(200).end();
    if (order.paymentIntentId !== id) {
      req.log?.warn({ id, orderId }, "[payment:mollie] webhook intent mismatch");
      return res.status(200).end();
    }
    const alreadyFinal = order.paymentStatus === "paid" || order.paymentStatus === "failed";

    if (payment.status === "paid") {
      const flipped = await handlePaymentSuccess(orderId, id);
      // Only first webhook to flip status sends the confirmation email and creates the Sendcloud parcel — race-safe.
      if (flipped && order.email) {
        await sendTemplate(
          order.email,
          templates.orderConfirmation(order.firstName ?? "client", order.orderNumber ?? `#${order.id}`, order.total),
        );
        if (isSendcloudActive) {
          createParcelForOrder(orderId).catch((err) =>
            req.log?.error({ err, orderId }, "[payment:mollie] sendcloud parcel creation failed"),
          );
        }
      }
    } else if (payment.status === "failed" || payment.status === "expired" || payment.status === "canceled") {
      if (!alreadyFinal) await handlePaymentFailure(orderId, id, payment.status);
    }
    return res.status(200).end();
  } catch (err) {
    req.log?.error({ err }, "[payment:mollie] webhook handler error");
    return res.status(200).end();
  }
});

export default router;
