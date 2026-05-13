import { db, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type LoyaltyTier = "bronze" | "silver" | "gold";

export function tierFor(points: number): LoyaltyTier {
  if (points >= 2000) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

export const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
};

export const TIER_THRESHOLDS = { silver: 500, gold: 2000 };

export async function awardPoints(args: {
  userId: number;
  points: number;
  reason: string;
  orderId?: number;
}) {
  await db.insert(loyaltyTransactionsTable).values({
    userId: args.userId,
    type: "earn",
    points: args.points,
    reason: args.reason,
    orderId: args.orderId,
  });
  const [updated] = await db.update(usersTable)
    .set({ loyaltyPoints: sql`${usersTable.loyaltyPoints} + ${args.points}` })
    .where(eq(usersTable.id, args.userId))
    .returning();
  if (updated) {
    const newTier = tierFor(updated.loyaltyPoints);
    if (newTier !== updated.loyaltyTier) {
      await db.update(usersTable).set({ loyaltyTier: newTier }).where(eq(usersTable.id, args.userId));
    }
  }
}

export async function redeemPoints(args: {
  userId: number;
  points: number;
  reason: string;
  orderId?: number;
}) {
  await db.insert(loyaltyTransactionsTable).values({
    userId: args.userId,
    type: "redeem",
    points: -Math.abs(args.points),
    reason: args.reason,
    orderId: args.orderId,
  });
  await db.update(usersTable)
    .set({ loyaltyPoints: sql`${usersTable.loyaltyPoints} - ${Math.abs(args.points)}` })
    .where(eq(usersTable.id, args.userId));
}
