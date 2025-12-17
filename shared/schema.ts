import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  jsonb,
  integer,
  timestamp,
  boolean,
  index,
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

// User storage table (supports both Replit Auth and local email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"), // For local auth (optional, null for Replit Auth users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionProvider: varchar("subscription_provider"),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  subscriptionPlan: varchar("subscription_plan").default("trial"), // trial, hobbyist, pro, reseller
  subscriptionStatus: varchar("subscription_status").default("active"), // active, canceled, past_due
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  lastPaymentDate: timestamp("last_payment_date"), // Track when last recurring payment was received
  booksUsedThisMonth: integer("books_used_this_month").default(0),
  booksLimitPerMonth: integer("books_limit_per_month").default(1), // 1 for trial
  illustrationsUsedThisMonth: integer("illustrations_used_this_month").default(0), // For paid users
  illustrationsLimitPerMonth: integer("illustrations_limit_per_month").default(0), // For paid users
  // New feature limits
  templateBooksLimit: integer("template_books_limit").default(0),
  templateBooksUsed: integer("template_books_used").default(0),
  bonusVariationsLimit: integer("bonus_variations_limit").default(2),
  bonusVariationsUsed: integer("bonus_variations_used").default(0),
  hasCommercialRights: boolean("has_commercial_rights").default(false),
  hasResellRights: boolean("has_resell_rights").default(false),
  hasAllFormattingOptions: boolean("has_all_formatting_options").default(false),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetTokenExpires: timestamp("password_reset_token_expires"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationTokenExpires: timestamp("email_verification_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  characterDescription: text("character_description"),
  characterImageUrl: text("character_image_url"),
  coverImageUrl: text("cover_image_url"),
  artStyle: text("art_style").notNull().default("watercolor"),
  pagesCount: integer("pages_count").notNull().default(8),
  pdfFormat: text("pdf_format").notNull().default("8x10"), // Standard format: 8x10
  pdfUrl: text("pdf_url"), // Pre-generated PDF stored in cloud storage for instant downloads
  status: text("status").notNull().default("draft"), // draft, generating, completed, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  imagePrompt: text("image_prompt"),
  isGenerating: boolean("is_generating").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  artStyle: text("art_style").notNull().default("watercolor"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_admins_email").on(table.email),
]);

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  status: varchar("status").notNull().default("open").$type<("open" | "closed" | "pending")>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull(),
  senderType: varchar("sender_type").notNull(),
  message: text("message").notNull(),
  seenByUser: boolean("seen_by_user").default(false).notNull(),
  seenByAdmin: boolean("seen_by_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(),
  providerId: varchar("provider_id").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const earlyAccessSignups = pgTable("early_access_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  code: varchar("code").notNull().default("EAO2026"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_early_access_email").on(table.email),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  discountPercentage: integer("discount_percentage").notNull().default(0),
  booksPerMonth: integer("books_per_month").notNull().default(0),
  templateBooks: integer("template_books").notNull().default(0),
  bonusVariations: integer("bonus_variations").notNull().default(0),
  pagesPerBook: integer("pages_per_book").notNull().default(24),
  stripePriceId: varchar("stripe_price_id"),
  paypalPlanId: varchar("paypal_plan_id"),
  commercialRights: boolean("commercial_rights").notNull().default(false),
  resellRights: boolean("resell_rights").notNull().default(false),
  allFormattingOptions: boolean("all_formatting_options").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  stories: many(stories),
  templates: many(templates),
  supportTickets: many(supportTickets),
  socialAccounts: many(socialAccounts),
}));

export const storiesRelations = relations(stories, ({ many, one }) => ({
  pages: many(pages),
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  story: one(stories, {
    fields: [pages.storyId],
    references: [stories.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ many, one }) => ({
  messages: many(supportMessages),
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportMessages.ticketId],
    references: [supportTickets.id],
  }),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

export const usersRelationsWithSocial = relations(users, ({ many }) => ({
  stories: many(stories),
  templates: many(templates),
  supportTickets: many(supportTickets),
  socialAccounts: many(socialAccounts),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEarlyAccessSignupSchema = createInsertSchema(earlyAccessSignups).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertEarlyAccessSignup = z.infer<typeof insertEarlyAccessSignupSchema>;
export type EarlyAccessSignup = typeof earlyAccessSignups.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type SubscriptionPlanId = SubscriptionPlan["id"];

// Extended interfaces
export interface StoryWithPages extends Story {
  pages: Page[];
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
}

export interface UserWithSubscriptionInfo extends User {
  canCreateNewBook: boolean;
  canUseTemplateBooks: boolean;
  canUseBonusVariations: boolean;
  templateBooksRemaining: number;
  bonusVariationsRemaining: number;
  daysLeftInTrial?: number;
  subscriptionStatusText: string;
}

export interface GenerateBookRequest {
  title: string;
  content: string;
  characterDescription?: string;
  characterImageUrl?: string;
  artStyle: string;
  pagesCount: number;
  pdfFormat?: string;
}
