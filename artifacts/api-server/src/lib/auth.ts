import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { db, sessionsTable, guestSessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const SESSION_DURATION_DAYS = 30;
const SESSION_COOKIE = "cz_session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateSessionId(): string {
  return nanoid(40);
}

export async function createSession(
  userId: number,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{ id: string; expiresAt: Date }> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({
    id,
    userId,
    expiresAt,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
  return { id, expiresAt };
}

export async function getSessionUser(sessionId: string) {
  const now = new Date();
  const rows = await db
    .select({
      sessionId: sessionsTable.id,
      expiresAt: sessionsTable.expiresAt,
      user: usersTable,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(and(eq(sessionsTable.id, sessionId), gt(sessionsTable.expiresAt, now)))
    .limit(1);
  return rows[0] ?? null;
}

export async function destroySession(sessionId: string) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}

export async function destroyAllUserSessions(userId: number) {
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
}

const GUEST_SESSION_DURATION_DAYS = 90;
export const GUEST_SESSION_COOKIE = "cz_guest";

export async function createGuestSession(): Promise<{ id: string; expiresAt: Date }> {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + GUEST_SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(guestSessionsTable).values({ id, expiresAt });
  return { id, expiresAt };
}

export async function getGuestSession(id: string): Promise<string | null> {
  const now = new Date();
  const [row] = await db
    .select({ id: guestSessionsTable.id })
    .from(guestSessionsTable)
    .where(and(eq(guestSessionsTable.id, id), gt(guestSessionsTable.expiresAt, now)))
    .limit(1);
  return row?.id ?? null;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash, twoFactorSecret, ...safe } = user;
  return safe;
}

export async function ensureDefaultAdmin(log?: { info: (...a: any[]) => void; warn?: (...a: any[]) => void }) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
  if (existing) return;
  const isProd = process.env["NODE_ENV"] === "production";
  const envEmail = process.env["ADMIN_EMAIL"];
  const envPassword = process.env["ADMIN_PASSWORD"];
  // In production, refuse to seed a default admin without explicit env credentials
  if (isProd && (!envEmail || !envPassword)) {
    log?.warn?.({ }, "No admin user found and ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping default admin seed in production");
    return;
  }
  const email = envEmail ?? "admin@cannazen.fr";
  const password = envPassword ?? "ChangeMe!Cannazen2026";
  const passwordHash = await hashPassword(password);
  await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName: "Admin",
    lastName: "CannaZen",
    role: "admin",
    emailVerified: true,
  });
  log?.info({ email }, "Default admin account created");
  if (!envPassword) {
    // eslint-disable-next-line no-console
    console.log(`\n=== Admin créé: ${email} / mot de passe par défaut (DEV uniquement) — définissez ADMIN_PASSWORD pour personnaliser ===\n`);
  }
}
