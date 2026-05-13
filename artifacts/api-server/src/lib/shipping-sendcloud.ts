import { db, ordersTable, orderItemsTable, productsTable, webhookEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Sendcloud REST client. Lazily activated when SENDCLOUD_PUBLIC_KEY +
 * SENDCLOUD_SECRET_KEY are present. When inactive, all helpers are no-ops
 * so the rest of the app keeps working.
 */

const SENDCLOUD_BASE = "https://panel.sendcloud.sc/api/v2";
const PUBLIC_KEY = process.env["SENDCLOUD_PUBLIC_KEY"];
const SECRET_KEY = process.env["SENDCLOUD_SECRET_KEY"];

export const isSendcloudActive = Boolean(PUBLIC_KEY && SECRET_KEY);

function authHeader(): string {
  const token = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString("base64");
  return `Basic ${token}`;
}

logger.info({ active: isSendcloudActive }, "[shipping:sendcloud] provider initialized");

// ---------- Address parsing ----------

export interface ParsedAddress {
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2, uppercase (e.g. "FR")
}

/**
 * Parses the free-form shipping_address text we currently store on orders.
 * Best-effort, tolerant. Format expected: "<street>, <postal_code> <city>[, <country>]".
 */
export function parseShippingAddress(addr: string | null | undefined): ParsedAddress {
  const fallback: ParsedAddress = { street: "", houseNumber: "", city: "", postalCode: "", country: "FR" };
  if (!addr || typeof addr !== "string") return fallback;
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return fallback;

  let country = "FR";
  let working = [...parts];
  const last = working[working.length - 1];
  if (last && /^[A-Za-z]{2}$/.test(last)) {
    country = last.toUpperCase();
    working = working.slice(0, -1);
  }

  let postalCode = "";
  let city = "";
  if (working.length >= 2) {
    const cityLine = working[working.length - 1] ?? "";
    const m = cityLine.match(/^(\d{4,5})\s+(.+)$/);
    if (m) {
      postalCode = m[1] ?? "";
      city = (m[2] ?? "").trim();
    } else {
      city = cityLine;
    }
    working = working.slice(0, -1);
  }

  const streetLine = working.join(", ").trim();
  const houseMatch = streetLine.match(/^(\d+\w?)\s+(.+)$/);
  let houseNumber = "1";
  let street = streetLine;
  if (houseMatch) {
    houseNumber = houseMatch[1] ?? "1";
    street = (houseMatch[2] ?? "").trim();
  }

  return { street, houseNumber, city, postalCode, country };
}

// ---------- Weight ----------

export async function computeOrderWeightKg(orderId: number): Promise<number> {
  const rows = await db
    .select({
      quantity: orderItemsTable.quantity,
      weightGrams: productsTable.weightGrams,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, orderId));
  const totalGrams = rows.reduce((sum, r) => sum + (r.weightGrams ?? 50) * r.quantity, 0);
  // Sendcloud requires weight in kg with up to 3 decimals, minimum 0.05kg.
  const kg = Math.max(0.05, totalGrams / 1000);
  return Math.round(kg * 1000) / 1000;
}

// ---------- Parcel creation ----------

export interface SendcloudCreatedParcel {
  id: number;
  trackingNumber: string;
  trackingUrl: string;
  status?: { id: number; message: string };
}

export async function createParcelForOrder(orderId: number): Promise<SendcloudCreatedParcel | null> {
  if (!isSendcloudActive) {
    logger.warn({ orderId }, "[shipping:sendcloud] not active, skipping parcel creation");
    return null;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) {
    logger.warn({ orderId }, "[shipping:sendcloud] order not found");
    return null;
  }
  if (order.trackingNumber) {
    logger.info({ orderId, trackingNumber: order.trackingNumber }, "[shipping:sendcloud] order already has tracking, skipping");
    return null;
  }

  const addr = parseShippingAddress(order.shippingAddress);
  const weightKg = await computeOrderWeightKg(orderId);
  const fullName = [order.firstName ?? "", order.lastName ?? ""].join(" ").trim() || "Client CannaZen";
  const orderNumber = order.orderNumber ?? `CZ-${order.id}`;

  const parcelBody = {
    parcel: {
      name: fullName,
      address: addr.street || "Adresse à compléter",
      house_number: addr.houseNumber,
      city: addr.city || "—",
      postal_code: addr.postalCode || "00000",
      country: addr.country,
      telephone: order.phone ?? "",
      email: order.email ?? "",
      weight: weightKg.toFixed(3),
      order_number: orderNumber,
      // request_label: false → the parcel appears as a draft in your Sendcloud
      // panel so YOU pick the carrier/method and confirm shipping. As soon as
      // you announce it, Sendcloud assigns a tracking number and webhooks us back.
      request_label: false,
    },
  };

  try {
    const r = await fetch(`${SENDCLOUD_BASE}/parcels`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(parcelBody),
    });

    if (!r.ok) {
      const text = await r.text();
      logger.error(
        { orderId, status: r.status, body: text.slice(0, 500) },
        "[shipping:sendcloud] parcel creation failed",
      );
      await db.insert(webhookEventsTable).values({
        provider: "sendcloud",
        eventType: "parcel.create_failed",
        externalId: orderNumber,
        payload: text.slice(0, 8000),
        status: "error",
        processedAt: new Date(),
      });
      return null;
    }

    const json = (await r.json()) as {
      parcel: {
        id: number;
        tracking_number: string | null;
        tracking_url: string | null;
        status: { id: number; message: string };
      };
    };
    const p = json.parcel;
    const trackingNumber = p.tracking_number ?? `SC-DRAFT-${p.id}`;
    const trackingUrl = p.tracking_url ?? `https://app.sendcloud.com/v2/shipping/parcels/${p.id}`;

    await db
      .update(ordersTable)
      .set({
        trackingNumber,
        trackingUrl,
        fulfillmentStatus: "processing",
      })
      .where(eq(ordersTable.id, orderId));

    await db.insert(webhookEventsTable).values({
      provider: "sendcloud",
      eventType: "parcel.created",
      externalId: String(p.id),
      payload: JSON.stringify({ orderId, parcelId: p.id, trackingNumber, status: p.status.message }),
      status: "processed",
      processedAt: new Date(),
    });

    logger.info(
      { orderId, parcelId: p.id, trackingNumber, status: p.status.message },
      "[shipping:sendcloud] parcel created",
    );

    return { id: p.id, trackingNumber, trackingUrl, status: p.status };
  } catch (err) {
    logger.error({ err, orderId }, "[shipping:sendcloud] parcel creation threw");
    return null;
  }
}

// ---------- Webhook → order status mapping ----------

/**
 * Sendcloud parcel statuses we care about. The numeric IDs are stable,
 * the messages may be localized — so we match on ID first and fall back
 * to a substring match on the message.
 */
const SHIPPED_STATUS_IDS = new Set([3, 4, 5, 7, 62, 1000, 1334]); // announced/ready/sent/in transit
const DELIVERED_STATUS_IDS = new Set([11, 1400]); // delivered

export function classifyParcelStatus(statusId: number | undefined, message: string | undefined): "shipped" | "delivered" | "other" {
  if (statusId != null) {
    if (DELIVERED_STATUS_IDS.has(statusId)) return "delivered";
    if (SHIPPED_STATUS_IDS.has(statusId)) return "shipped";
  }
  const m = (message ?? "").toLowerCase();
  if (m.includes("delivered") || m.includes("livré")) return "delivered";
  if (m.includes("sent") || m.includes("transit") || m.includes("en route") || m.includes("expédié") || m.includes("ready to send") || m.includes("announced")) return "shipped";
  return "other";
}
