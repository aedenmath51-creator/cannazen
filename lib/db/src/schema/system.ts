import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailOutboxTable = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  fromEmail: text("from_email").notNull().default("noreply@cannazen.fr"),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  template: text("template"),
  status: text("status").notNull().default("queued"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cookieConsentsTable = pgTable("cookie_consents", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  userId: integer("user_id").references(() => usersTable.id),
  necessary: boolean("necessary").notNull().default(true),
  analytics: boolean("analytics").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  consentVersion: text("consent_version").notNull().default("1.0"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookEventsTable = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  eventType: text("event_type").notNull(),
  externalId: text("external_id"),
  payload: text("payload").notNull(),
  status: text("status").notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;

export const insertEmailOutboxSchema = createInsertSchema(emailOutboxTable).omit({ id: true, createdAt: true });
export type InsertEmailOutbox = z.infer<typeof insertEmailOutboxSchema>;
export type EmailOutbox = typeof emailOutboxTable.$inferSelect;

export const insertCookieConsentSchema = createInsertSchema(cookieConsentsTable).omit({ id: true, createdAt: true });
export type CookieConsent = typeof cookieConsentsTable.$inferSelect;
