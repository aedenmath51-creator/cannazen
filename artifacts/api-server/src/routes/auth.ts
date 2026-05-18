import { Router } from "express";
import { z } from "zod";
import { db, usersTable, emailVerificationTokensTable, passwordResetTokensTable, cartsTable, wishlistItemsTable, ordersTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, destroySession, destroyAllUserSessions, createGuestSession, GUEST_SESSION_COOKIE, generateToken, sessionCookieOptions, SESSION_COOKIE_NAME, sanitizeUser, crossSiteCookieBase } from "../lib/auth";
import { sendTemplate, templates } from "../lib/email";
import { authRateLimiter } from "../middlewares/security";
import { requireAuth } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "8 caractères minimum"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  newsletterOptIn: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/signup", authRateLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
  const { email, password, firstName, lastName, newsletterOptIn } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) return res.status(409).json({ error: "Cette adresse email est déjà utilisée" });

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    newsletterOptIn: newsletterOptIn ?? false,
    role: "customer",
  }).returning();

  const token = generateToken();
  await db.insert(emailVerificationTokensTable).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendTemplate(user.email, templates.verifyEmail(user.firstName ?? "", token));

  const session = await createSession(user.id, { ipAddress: req.ip, userAgent: req.get("user-agent") ?? undefined });
  res.cookie(SESSION_COOKIE_NAME, session.id, sessionCookieOptions(req.secure));

  await mergeAnonymousData(req, user.id);
  await logAudit({ req, userId: user.id, action: "user.signup", entityType: "user", entityId: user.id });

  res.status(201).json({ user: sanitizeUser(user) });
});

router.post("/auth/login", authRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email ou mot de passe invalide" });
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

  const session = await createSession(user.id, { ipAddress: req.ip, userAgent: req.get("user-agent") ?? undefined });
  res.cookie(SESSION_COOKIE_NAME, session.id, sessionCookieOptions(req.secure));

  await mergeAnonymousData(req, user.id);
  await logAudit({ req, userId: user.id, action: "user.login" });

  res.json({ user: sanitizeUser(user) });
});

router.post("/auth/logout", async (req, res) => {
  if (req.sessionToken) {
    await destroySession(req.sessionToken);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.post("/auth/guest-session", async (req, res) => {
  if (req.guestSessionId) {
    return res.json({ sessionId: req.guestSessionId });
  }
  const guest = await createGuestSession();
  res.cookie(GUEST_SESSION_COOKIE, guest.id, {
    ...crossSiteCookieBase(req.secure),
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
  return res.json({ sessionId: guest.id });
});

router.get("/auth/me", (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: sanitizeUser(req.user) });
});

router.post("/auth/verify-email", async (req, res) => {
  const token = req.body?.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Token manquant" });
  const [row] = await db.select().from(emailVerificationTokensTable)
    .where(and(eq(emailVerificationTokensTable.token, token), gt(emailVerificationTokensTable.expiresAt, new Date()), isNull(emailVerificationTokensTable.usedAt)))
    .limit(1);
  if (!row) return res.status(400).json({ error: "Lien invalide ou expiré" });
  await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, row.userId));
  await db.update(emailVerificationTokensTable).set({ usedAt: new Date() }).where(eq(emailVerificationTokensTable.id, row.id));
  res.json({ ok: true });
});

router.post("/auth/request-password-reset", authRateLimiter, async (req, res) => {
  const email = (req.body?.email as string | undefined)?.toLowerCase();
  if (!email) return res.status(400).json({ error: "Email requis" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user) {
    const token = generateToken();
    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await sendTemplate(user.email, templates.resetPassword(user.firstName ?? "", token));
  }
  res.json({ ok: true });
});

const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8) });

router.post("/auth/reset-password", authRateLimiter, async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });
  const [row] = await db.select().from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.token, parsed.data.token), gt(passwordResetTokensTable.expiresAt, new Date()), isNull(passwordResetTokensTable.usedAt)))
    .limit(1);
  if (!row) return res.status(400).json({ error: "Lien invalide ou expiré" });
  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
  await db.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, row.id));
  await destroyAllUserSessions(row.userId);
  res.json({ ok: true });
});

router.post("/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ error: "Données invalides" });
  const user = req.user!;
  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "Mot de passe actuel incorrect" });
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  await destroyAllUserSessions(user.id);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

async function mergeAnonymousData(req: any, userId: number) {
  const sessionId = req.guestSessionId as string | undefined;
  if (!sessionId) return;
  await db.update(cartsTable).set({ userId }).where(and(eq(cartsTable.sessionId, sessionId), isNull(cartsTable.userId)));
  await db.update(wishlistItemsTable).set({ userId }).where(and(eq(wishlistItemsTable.sessionId, sessionId), isNull(wishlistItemsTable.userId)));
  await db.update(ordersTable).set({ userId }).where(and(eq(ordersTable.sessionId, sessionId), isNull(ordersTable.userId)));
}

export default router;
