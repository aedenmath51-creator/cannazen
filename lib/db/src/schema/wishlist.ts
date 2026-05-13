import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItemsTable).omit({ id: true, addedAt: true });
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
