import { nanoid } from "nanoid";
import { db, ordersTable, webhookEventsTable } from "@workspace/db";
import { and, eq, ne } from "drizzle-orm";
import { logger } from "./logger";

export type PaymentMethod = "card" | "card_3x" | "card_4x" | "apple_pay" | "google_pay" | "bank_transfer";

export interface PaymentIntent {
  id: string;
  status: "pending" | "succeeded" | "failed";
  amount: number;
  currency: string;
  hostedUrl: string;
}

export interface PaymentProvider {
  name: string;
  createIntent(args: {
    orderId: number;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    customerEmail: string;
    orderNumber?: string;
  }): Promise<PaymentIntent>;
  refund(intentId: string, amount?: number): Promise<{ id: string; status: string }>;
}

class MockPaymentProvider implements PaymentProvider {
  name = "mock";

  async createIntent(args: { orderId: number; amount: number; currency?: string; method: PaymentMethod; customerEmail: string }): Promise<PaymentIntent> {
    const id = `mp_${nanoid(16)}`;
    logger.info({ id, orderId: args.orderId, amount: args.amount, method: args.method }, "[payment:mock] intent created");
    return {
      id,
      status: "pending",
      amount: args.amount,
      currency: args.currency ?? "EUR",
      hostedUrl: `/paiement/mock/${id}?orderId=${args.orderId}`,
    };
  }

  async refund(intentId: string) {
    logger.info({ intentId }, "[payment:mock] refund");
    return { id: `re_${nanoid(12)}`, status: "succeeded" };
  }
}

function publicBaseUrl(): string {
  const domains = process.env["REPLIT_DOMAINS"] ?? "";
  const first = domains.split(",")[0]?.trim();
  if (first) return `https://${first}`;
  return "http://localhost:80";
}

class MolliePaymentProvider implements PaymentProvider {
  name = "mollie";
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createIntent(args: {
    orderId: number;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    customerEmail: string;
    orderNumber?: string;
  }): Promise<PaymentIntent> {
    const base = publicBaseUrl();
    const body = {
      amount: { currency: args.currency ?? "EUR", value: args.amount.toFixed(2) },
      description: `CannaZen ${args.orderNumber ?? `#${args.orderId}`}`,
      redirectUrl: `${base}/commande/confirmation/${args.orderId}`,
      webhookUrl: `${base}/api/payment/mollie/webhook`,
      metadata: { orderId: String(args.orderId) },
    };
    const r = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text();
      logger.error({ status: r.status, body: txt }, "[payment:mollie] create failed");
      throw new Error(`Mollie create payment failed: ${r.status}`);
    }
    const json = (await r.json()) as { id: string; status: string; _links: { checkout?: { href: string } } };
    const checkout = json._links.checkout?.href;
    if (!checkout) throw new Error("Mollie did not return a checkout URL");
    logger.info({ id: json.id, orderId: args.orderId }, "[payment:mollie] intent created");
    return {
      id: json.id,
      status: "pending",
      amount: args.amount,
      currency: args.currency ?? "EUR",
      hostedUrl: checkout,
    };
  }

  async refund(intentId: string, amount?: number): Promise<{ id: string; status: string }> {
    const body: Record<string, unknown> = {};
    if (amount !== undefined) body["amount"] = { currency: "EUR", value: amount.toFixed(2) };
    const r = await fetch(`https://api.mollie.com/v2/payments/${intentId}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text();
      logger.error({ status: r.status, body: txt }, "[payment:mollie] refund failed");
      throw new Error(`Mollie refund failed: ${r.status}`);
    }
    const json = (await r.json()) as { id: string; status: string };
    return { id: json.id, status: json.status };
  }

  async fetchPayment(intentId: string): Promise<{ id: string; status: string; metadata: Record<string, string> }> {
    const r = await fetch(`https://api.mollie.com/v2/payments/${intentId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!r.ok) throw new Error(`Mollie fetch payment failed: ${r.status}`);
    return (await r.json()) as { id: string; status: string; metadata: Record<string, string> };
  }
}

const mollieKey = process.env["MOLLIE_API_KEY"];
export const paymentProvider: PaymentProvider = mollieKey
  ? new MolliePaymentProvider(mollieKey)
  : new MockPaymentProvider();

export const isMollieActive = paymentProvider.name === "mollie";
export const mollieProvider = isMollieActive ? (paymentProvider as MolliePaymentProvider) : null;

logger.info({ provider: paymentProvider.name }, "[payment] provider initialized");

/**
 * Conditional (CAS) order update: returns true if THIS call actually flipped the order to paid.
 * Concurrent webhook retries are safe: only the first one returns true, others return false.
 */
export async function handlePaymentSuccess(orderId: number, intentId: string): Promise<boolean> {
  const updated = await db.update(ordersTable)
    .set({ status: "confirmed", paymentStatus: "paid", paidAt: new Date(), paymentIntentId: intentId })
    .where(and(eq(ordersTable.id, orderId), ne(ordersTable.paymentStatus, "paid")))
    .returning({ id: ordersTable.id });
  if (updated.length === 0) return false;
  await db.insert(webhookEventsTable).values({
    provider: paymentProvider.name,
    eventType: "payment.succeeded",
    externalId: intentId,
    payload: JSON.stringify({ orderId, intentId }),
    status: "processed",
    processedAt: new Date(),
  });
  return true;
}

export async function handlePaymentFailure(orderId: number, intentId: string, reason?: string): Promise<boolean> {
  const updated = await db.update(ordersTable)
    .set({ status: "cancelled", paymentStatus: "failed", cancelledAt: new Date() })
    .where(and(
      eq(ordersTable.id, orderId),
      ne(ordersTable.paymentStatus, "paid"),
      ne(ordersTable.paymentStatus, "failed"),
    ))
    .returning({ id: ordersTable.id });
  if (updated.length === 0) return false;
  await db.insert(webhookEventsTable).values({
    provider: paymentProvider.name,
    eventType: "payment.failed",
    externalId: intentId,
    payload: JSON.stringify({ orderId, intentId, reason }),
    status: "processed",
    processedAt: new Date(),
  });
  return true;
}
