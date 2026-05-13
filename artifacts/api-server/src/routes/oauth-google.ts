import { Router, type Request } from "express";
import { randomBytes } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createSession, sessionCookieOptions, SESSION_COOKIE_NAME } from "../lib/auth";
import { logAudit } from "../lib/audit";

const router = Router();

type RequestWithCookies = Request & { cookies?: Record<string, string> };

const STATE_COOKIE = "cz_oauth_state";

function publicBaseUrl(): string {
  const domains = process.env["REPLIT_DOMAINS"] ?? "";
  const first = domains.split(",")[0]?.trim();
  if (first) return `https://${first}`;
  return "http://localhost:80";
}

function callbackUrl(): string {
  return `${publicBaseUrl()}/api/auth/google/callback`;
}

router.get("/auth/google", (req, res) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) return res.status(503).send("Connexion Google non configurée.");

  const state = randomBytes(24).toString("base64url");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: req.secure,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", async (req, res) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return res.redirect("/connexion?error=oauth_unconfigured");

  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;
  const cookieState = (req as RequestWithCookies).cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { path: "/" });

  if (!code || !state || !cookieState || state !== cookieState) {
    return res.redirect("/connexion?error=oauth_state");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl(),
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      req.log?.error({ status: tokenRes.status }, "[oauth:google] token exchange failed");
      return res.redirect("/connexion?error=oauth_token");
    }
    const token = (await tokenRes.json()) as { access_token: string; id_token?: string };

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userInfoRes.ok) {
      req.log?.error({ status: userInfoRes.status }, "[oauth:google] userinfo failed");
      return res.redirect("/connexion?error=oauth_userinfo");
    }
    const profile = (await userInfoRes.json()) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      name?: string;
    };

    if (!profile.email) {
      return res.redirect("/connexion?error=oauth_no_email");
    }
    // Strict assurance: Google must explicitly say email is verified.
    if (profile.email_verified !== true) {
      return res.redirect("/connexion?error=oauth_email_unverified");
    }
    const email = profile.email.toLowerCase();

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({
        email,
        firstName: profile.given_name ?? profile.name ?? null,
        lastName: profile.family_name ?? null,
        emailVerified: true,
        role: "customer",
      }).returning();
      await logAudit({ req, userId: user.id, action: "user.signup.google", entityType: "user", entityId: user.id });
    } else if (!user.emailVerified) {
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
    }

    const session = await createSession(user.id, { ipAddress: req.ip, userAgent: req.get("user-agent") ?? undefined });
    res.cookie(SESSION_COOKIE_NAME, session.id, sessionCookieOptions(req.secure));
    await logAudit({ req, userId: user.id, action: "user.login.google" });

    return res.redirect("/mon-compte");
  } catch (err) {
    req.log?.error({ err }, "[oauth:google] callback error");
    return res.redirect("/connexion?error=oauth_unknown");
  }
});

export default router;
