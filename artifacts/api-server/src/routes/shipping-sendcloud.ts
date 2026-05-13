import { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, ne, or } from "drizzle-orm";
import { db, webhookEventsTable, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { classifyParcelStatus } from "../lib/shipping-sendcloud";
import { sendTemplate, templates } from "../lib/email";

const router = Router();

/**
 * Sendcloud webhook receiver.
 *
 * Auth: when SENDCLOUD_WEBHOOK_SECRET is set, we verify the
 * `Sendcloud-Signature` header (HMAC-SHA256 hex of the raw body, lowercase).
 * The raw body is captured by the global express.json `verify` callback in app.ts
 * and exposed as `req.rawBody`.
 *
 * Without the secret, the route still accepts pings (e.g. when Sendcloud first
 * tests the URL during setup) but logs a warning, so you can give Sendcloud
 * the URL BEFORE you hold the keys.
 *
 * Sendcloud sends a JSON body for events such as `parcel_status_changed`,
 * `integration_credentials`, etc. We persist every accepted event to the
 * `webhook_events` table so admins can audit it from /console-cz.
 */

function verifySignature(rawBody: Buffer, headerSig: string | undefined, secret: string): boolean {
  if (!headerSig) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (computed.length !== headerSig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(computed, "utf8"), Buffer.from(headerSig, "utf8"));
  } catch {
    return false;
  }
}

router.post("/shipping/sendcloud/webhook", async (req: Request, res: Response) => {
  const secret = process.env["SENDCLOUD_WEBHOOK_SECRET"];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
  const sig = (req.headers["sendcloud-signature"] as string | undefined)?.trim();

  let signatureValid: "valid" | "invalid" | "skipped" = "skipped";
  if (secret) {
    signatureValid = verifySignature(rawBody, sig, secret) ? "valid" : "invalid";
    if (signatureValid === "invalid") {
      req.log?.warn(
        { hasSig: Boolean(sig), bodyLen: rawBody.length },
        "[sendcloud] invalid webhook signature, ignoring",
      );
      // Respond 200 so Sendcloud doesn't aggressively retry, but do not process.
      return res.status(200).end();
    }
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const action = (body["action"] as string | undefined) ?? "ping";
  const parcel = body["parcel"] as
    | {
        id?: number | string;
        tracking_number?: string;
        tracking_url?: string;
        order_number?: string;
        status?: { id?: number; message?: string };
      }
    | undefined;
  const externalId = parcel?.id != null ? String(parcel.id) : `evt_${Date.now()}`;

  try {
    await db.insert(webhookEventsTable).values({
      provider: "sendcloud",
      eventType: action,
      externalId,
      payload: rawBody.length > 0 ? rawBody.toString("utf8").slice(0, 8000) : JSON.stringify(body).slice(0, 8000),
      status: signatureValid === "skipped" ? "received_unverified" : "received",
      processedAt: new Date(),
    });
  } catch (err) {
    req.log?.error({ err }, "[sendcloud] failed to persist webhook event");
  }

  // ----- Sync order fulfillment status from parcel events -----
  if (action === "parcel_status_changed" && parcel) {
    try {
      const trackingNumber = parcel.tracking_number ?? null;
      const orderNumber = parcel.order_number ?? null;
      // Look up the order by tracking_number (set during parcel creation) OR by
      // the order_number we passed to Sendcloud.
      const lookupConditions = [
        trackingNumber ? eq(ordersTable.trackingNumber, trackingNumber) : null,
        orderNumber ? eq(ordersTable.orderNumber, orderNumber) : null,
      ].filter(Boolean) as ReturnType<typeof eq>[];

      if (lookupConditions.length > 0) {
        const [order] = await db
          .select()
          .from(ordersTable)
          .where(or(...lookupConditions))
          .limit(1);

        if (order) {
          const klass = classifyParcelStatus(parcel.status?.id, parcel.status?.message);
          const now = new Date();

          if (klass === "shipped") {
            // CAS-style: only flip + send email if not already shipped/delivered.
            const flipped = await db
              .update(ordersTable)
              .set({
                fulfillmentStatus: "shipped",
                shippedAt: now,
                trackingNumber: trackingNumber ?? order.trackingNumber,
                trackingUrl: parcel.tracking_url ?? order.trackingUrl,
              })
              .where(
                and(
                  eq(ordersTable.id, order.id),
                  ne(ordersTable.fulfillmentStatus, "shipped"),
                  ne(ordersTable.fulfillmentStatus, "delivered"),
                ),
              )
              .returning({ id: ordersTable.id });
            if (flipped.length > 0 && order.email && trackingNumber) {
              // Fire-and-forget: never block the webhook response on email send.
              sendTemplate(
                order.email,
                templates.orderShipped(
                  order.firstName ?? "client",
                  order.orderNumber ?? `#${order.id}`,
                  trackingNumber,
                  parcel.tracking_url ?? order.trackingUrl ?? "#",
                ),
              ).catch((err) => req.log?.error({ err, orderId: order.id }, "[sendcloud] orderShipped email failed"));
            }
          } else if (klass === "delivered") {
            const flipped = await db
              .update(ordersTable)
              .set({
                fulfillmentStatus: "delivered",
                deliveredAt: now,
                shippedAt: order.shippedAt ?? now,
              })
              .where(and(eq(ordersTable.id, order.id), ne(ordersTable.fulfillmentStatus, "delivered")))
              .returning({ id: ordersTable.id });
            if (flipped.length > 0 && order.email) {
              // Fire-and-forget: never block the webhook response on email send.
              (async () => {
                try {
                  const [firstItem] = await db
                    .select({ slug: productsTable.slug })
                    .from(orderItemsTable)
                    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                    .where(eq(orderItemsTable.orderId, order.id))
                    .limit(1);
                  await sendTemplate(
                    order.email,
                    templates.orderDelivered(
                      order.firstName ?? "client",
                      order.orderNumber ?? `#${order.id}`,
                      firstItem?.slug ?? "boutique",
                    ),
                  );
                } catch (err) {
                  req.log?.error({ err, orderId: order.id }, "[sendcloud] orderDelivered email failed");
                }
              })();
            }
          }
        } else {
          req.log?.warn(
            { trackingNumber, orderNumber },
            "[sendcloud] parcel_status_changed but no matching order",
          );
        }
      }
    } catch (err) {
      req.log?.error({ err }, "[sendcloud] failed to sync order from parcel event");
    }
  }

  req.log?.info(
    {
      action,
      parcelId: parcel?.id,
      tracking: parcel?.tracking_number,
      statusMsg: parcel?.status?.message,
      signature: signatureValid,
    },
    "[sendcloud] webhook received",
  );

  return res.status(200).json({ ok: true });
});

// Friendly GET so the user can paste the URL in a browser and confirm it's reachable.
router.get("/shipping/sendcloud/webhook", (_req, res) => {
  res.json({
    ok: true,
    provider: "sendcloud",
    method: "POST",
    note: "This endpoint accepts Sendcloud webhook events. POST your event JSON here.",
  });
});

export default router;
