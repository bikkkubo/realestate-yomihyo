import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "MANAGER", "AGENT", "VIEWER"]);
export const dealTypeEnum = pgEnum("deal_type", ["RENTAL", "SALES"]);
export const rankEnum = pgEnum("rank", ["A", "B", "C"]);
export const dealStageEnum = pgEnum("deal_stage", [
  "R_ENQUIRY", "R_VIEW", "R_APP", "R_SCREEN", "R_APPROVE", "R_CONTRACT", "R_MOVEIN",
  "S_ENQUIRY", "S_VIEW", "S_LOI", "S_DEPOSIT", "S_DD", "S_APPROVE", "S_CONTRACT", "S_CLOSING"
]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").notNull().default("AGENT"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deals table
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().notNull(),
  type: dealTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  clientName: varchar("client_name").notNull(),
  stage: dealStageEnum("stage").notNull(),
  score: integer("score").notNull().default(0),
  rank: rankEnum("rank").notNull().default("C"),
  amountYen: integer("amount_yen").notNull(),
  nextAction: text("next_action"),
  nextActionDue: timestamp("next_action_due"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedDeals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  assignedTo: one(users, {
    fields: [deals.assignedToId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  score: true,
  rank: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  nextActionDue: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const updateDealSchema = insertDealSchema.partial().extend({
  id: z.string(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type UpdateDeal = z.infer<typeof updateDealSchema>;
export type Role = typeof users.$inferSelect.role;
export type DealType = typeof deals.$inferSelect.type;
export type DealStage = typeof deals.$inferSelect.stage;
export type Rank = typeof deals.$inferSelect.rank;
