import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      imageUrl: categoriesTable.imageUrl,
      productCount: sql<number>`count(${productsTable.id})::int`,
    })
    .from(categoriesTable)
    .leftJoin(
      productsTable,
      and(eq(productsTable.categoryId, categoriesTable.id), eq(productsTable.isActive, true))
    )
    .where(eq(categoriesTable.isActive, true))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.id);

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.json(categories);
});

export default router;
