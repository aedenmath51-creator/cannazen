import { db, auditLogsTable } from "@workspace/db";
import type { Request } from "express";

export async function logAudit(args: {
  req?: Request;
  userId?: number | null;
  action: string;
  entityType?: string;
  entityId?: string | number;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogsTable).values({
    userId: args.userId ?? args.req?.user?.id ?? null,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId !== undefined ? String(args.entityId) : undefined,
    metadata: args.metadata ? JSON.stringify(args.metadata) : null,
    ipAddress: args.req?.ip,
  });
}
