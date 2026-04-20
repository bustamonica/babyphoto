import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  email: text("email").notNull(),
  creditBalance: integer("credit_balance").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    momUploadKey: text("mom_upload_key"),
    dadUploadKey: text("dad_upload_key"),
    outputKey: text("output_key"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    check(
      "generations_status_check",
      sql`${t.status} in ('pending','running','succeeded','failed')`,
    ),
    index("generations_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("generations_status_idx").on(t.status),
  ],
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    stripeSessionId: text("stripe_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "credit_transactions_reason_check",
      sql`${t.reason} in ('signup_bonus','purchase','generation','refund')`,
    ),
    uniqueIndex("credit_transactions_stripe_session_idx")
      .on(t.stripeSessionId)
      .where(sql`${t.stripeSessionId} is not null`),
    index("credit_transactions_user_idx").on(t.userId, t.createdAt.desc()),
  ],
);

export const uploadReferences = pgTable(
  "upload_references",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    check("upload_references_kind_check", sql`${t.kind} in ('mom','dad','output')`),
    index("upload_references_user_idx").on(t.userId),
  ],
);
