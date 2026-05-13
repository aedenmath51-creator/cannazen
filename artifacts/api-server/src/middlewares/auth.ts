import type { Request, Response, NextFunction } from "express";
import { getSessionUser, SESSION_COOKIE_NAME, GUEST_SESSION_COOKIE, getGuestSession, sanitizeUser } from "../lib/auth";
import type { User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
      guestSessionId?: string;
    }
  }
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      const session = await getSessionUser(token);
      if (session) {
        req.user = session.user;
        req.sessionToken = session.sessionId;
      }
    }
    if (!req.user) {
      const guestToken = req.cookies?.[GUEST_SESSION_COOKIE];
      if (guestToken) {
        const validated = await getGuestSession(guestToken);
        if (validated) {
          req.guestSessionId = validated;
        }
      }
    }
  } catch (err) {
    req.log?.error({ err }, "loadUser failed");
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentification requise" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Accès admin requis" });
  next();
}

export function meResponse(user: User) {
  return sanitizeUser(user);
}
