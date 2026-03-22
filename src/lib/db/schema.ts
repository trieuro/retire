import { pgTable, uuid, varchar, text, integer, decimal, boolean, timestamp, jsonb, date, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calculatorProfiles = pgTable("calculator_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull().default("Default"),
  inputs: jsonb("inputs").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }),
  monthlyPayment: decimal("monthly_payment", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  totalAssets: decimal("total_assets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: decimal("total_liabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: decimal("net_worth", { precision: 15, scale: 2 }).notNull(),
  accountBalances: jsonb("account_balances"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("snapshots_user_date_idx").on(table.userId, table.date),
]);

export const scenarios = pgTable("scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  inputs: jsonb("inputs").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialSecurityProfiles = pgTable("social_security_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  birthYear: integer("birth_year").notNull(),
  aime: decimal("aime", { precision: 10, scale: 2 }).notNull(),
  spouseBirthYear: integer("spouse_birth_year"),
  spouseIsWorking: boolean("spouse_is_working").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
