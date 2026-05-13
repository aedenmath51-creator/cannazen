import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  strain: text("strain"),
  thcContent: text("thc_content"),
  cbdContent: text("cbd_content"),
  origin: text("origin"),
  weight: text("weight"),
  weightGrams: integer("weight_grams").default(50),
  tags: text("tags").array(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  stock: integer("stock").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  isOrganic: boolean("is_organic").notNull().default(false),
  batchNumber: text("batch_number"),
  coaPdfUrl: text("coa_pdf_url"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  sku: text("sku"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
