import { Router } from "express";
import { db, blogPostsTable, blogCategoriesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/blog/posts", async (req, res) => {
  const categorySlug = req.query.category as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 24), 50);
  const baseQuery = db.select({
    id: blogPostsTable.id,
    title: blogPostsTable.title,
    slug: blogPostsTable.slug,
    excerpt: blogPostsTable.excerpt,
    coverImageUrl: blogPostsTable.coverImageUrl,
    authorName: blogPostsTable.authorName,
    publishedAt: blogPostsTable.publishedAt,
    readingMinutes: blogPostsTable.readingMinutes,
    tags: blogPostsTable.tags,
    categoryName: blogCategoriesTable.name,
    categorySlug: blogCategoriesTable.slug,
  }).from(blogPostsTable).leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id));

  let posts;
  if (categorySlug) {
    posts = await baseQuery.where(and(eq(blogPostsTable.isPublished, true), eq(blogCategoriesTable.slug, categorySlug)))
      .orderBy(desc(blogPostsTable.publishedAt)).limit(limit);
  } else {
    posts = await baseQuery.where(eq(blogPostsTable.isPublished, true))
      .orderBy(desc(blogPostsTable.publishedAt)).limit(limit);
  }
  res.json(posts);
});

router.get("/blog/posts/:slug", async (req, res) => {
  const [post] = await db.select({
    post: blogPostsTable,
    category: blogCategoriesTable,
  }).from(blogPostsTable)
    .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
    .where(and(eq(blogPostsTable.slug, req.params.slug), eq(blogPostsTable.isPublished, true)))
    .limit(1);
  if (!post) return res.status(404).json({ error: "Article introuvable" });
  await db.update(blogPostsTable).set({ viewCount: sql`${blogPostsTable.viewCount} + 1` }).where(eq(blogPostsTable.id, post.post.id));
  res.json({ ...post.post, category: post.category });
});

router.get("/blog/categories", async (_req, res) => {
  const cats = await db.select().from(blogCategoriesTable);
  res.json(cats);
});

export default router;
