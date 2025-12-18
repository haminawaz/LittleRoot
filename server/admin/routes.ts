import type { Express } from "express";
import passport from "passport";
import { isAdminAuthenticated } from "./middleware";
import { setupAdminAuth } from "./auth";
import { db } from "../db";
import {
  users,
  stories,
  pages,
  earlyAccessSignups,
  subscriptionPlans,
  coupons,
  type SubscriptionPlan,
  type Coupon,
} from "@shared/schema";
import { eq, and, gte, desc, sql, like, or } from "drizzle-orm";
import { storage } from "../storage";
import Stripe from "stripe";
import { sendEmail } from "../emailService";

export function registerAdminRoutes(app: Express) {
  setupAdminAuth();

  // Admin login endpoint
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("admin-local", (err: any, admin: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!admin) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid email or password" });
      }

      req.login(admin, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          success: true,
          admin: { id: admin.claims.sub, email: admin.claims.email },
        });
      });
    })(req, res, next);
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current admin info
  app.get("/api/admin/me", isAdminAuthenticated, async (req: any, res) => {
    try {
      const admin = (req as any).admin;
      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }
      // Don't send password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({ message: "Failed to fetch admin" });
    }
  });

  // Dashboard analytics
  app.get(
    "/api/admin/dashboard",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        // Calculate MRR (Monthly Recurring Revenue)
        const mrrQuery = await db
          .select({
            total: sql<number>`SUM(CASE 
            WHEN subscription_plan = 'hobbyist' THEN 19.99
            WHEN subscription_plan = 'pro' THEN 39.99
            WHEN subscription_plan = 'reseller' THEN 74.99
            ELSE 0
          END)`,
          })
          .from(users)
          .where(
            and(
              eq(users.subscriptionStatus, "active"),
              sql`${users.subscriptionPlan} != 'trial'`
            )
          );

        const mrr = Number(mrrQuery[0]?.total || 0);
        const arr = mrr * 12;

        // Calculate new sign-ups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newSignupsQuery = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(users)
          .where(gte(users.createdAt, sevenDaysAgo));

        const newSignupsLast7Days = Number(newSignupsQuery[0]?.count || 0);

        // Calculate active trials
        const activeTrialsQuery = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(users)
          .where(
            and(
              eq(users.subscriptionPlan, "trial"),
              gte(users.trialEndsAt!, new Date())
            )
          );

        const activeTrials = Number(activeTrialsQuery[0]?.count || 0);

        // Calculate churned users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const churnedQuery = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(users)
          .where(
            and(
              or(
                eq(users.subscriptionStatus, "canceled"),
                and(
                  eq(users.subscriptionStatus, "past_due"),
                  sql`${users.currentPeriodEnd} < NOW()`
                )
              )!,
              gte(users.updatedAt, thirtyDaysAgo)
            )
          );

        const churnedLast30Days = Number(churnedQuery[0]?.count || 0);

        // Calculate illustrations generated this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const illustrationsQuery = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pages)
          .where(gte(pages.createdAt, startOfMonth));

        const illustrationsThisMonth = Number(
          illustrationsQuery[0]?.count || 0
        );

        res.json({
          mrr,
          arr,
          newSignups: {
            last7Days: newSignupsLast7Days,
          },
          activeTrials,
          churnedLast30Days,
          illustrationsThisMonth,
          apiSpendThisMonth: 0, // TODO: Integrate with Google Cloud billing API
        });
      } catch (error) {
        console.error("Dashboard analytics error:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch dashboard analytics" });
      }
    }
  );

  app.get(
    "/api/admin/early-access-signups",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "20", 10);

        if (page < 1) {
          return res
            .status(400)
            .json({ message: "Page must be greater than 0" });
        }
        if (limit < 1 || limit > 100) {
          return res
            .status(400)
            .json({ message: "Limit must be between 1 and 100" });
        }

        const [signups, total] = await Promise.all([
          storage.getEarlyAccessSignupsPaginated(page, limit),
          storage.getEarlyAccessSignupsCount(),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
          signups,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        });
      } catch (error) {
        console.error("Error fetching early access signups:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch early access signups" });
      }
    }
  );

  app.get(
    "/api/admin/subscription-plans",
    isAdminAuthenticated,
    async (_req, res) => {
      try {
        const plans = await db
          .select()
          .from(subscriptionPlans)
          .orderBy(subscriptionPlans.sortOrder);
        res.json(plans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({ message: "Failed to fetch subscription plans" });
      }
    }
  );

  app.post(
    "/api/admin/subscription-plans",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const body = req.body as Partial<SubscriptionPlan>;
        if (!body.id || !body.name) {
          return res.status(400).json({ 
            message: "Plan id and name are required"
          });
        }

        const priceCents =
          typeof body.priceCents === "number"
            ? body.priceCents
            : Math.round((Number((body as any).price) || 0) * 100);

        const [plan] = await db
          .insert(subscriptionPlans)
          .values({
            id: body.id,
            name: body.name,
            priceCents,
            booksPerMonth: body.booksPerMonth ?? 0,
            templateBooks: body.templateBooks ?? 0,
            bonusVariations: body.bonusVariations ?? 0,
            pagesPerBook: body.pagesPerBook ?? 24,
            stripePriceId: body.stripePriceId ?? null,
            paypalPlanId: body.paypalPlanId ?? null,
            commercialRights: body.commercialRights ?? false,
            resellRights: body.resellRights ?? false,
            allFormattingOptions: body.allFormattingOptions ?? false,
            sortOrder: body.sortOrder ?? 0,
            isActive: body.isActive ?? true,
          })
          .returning();

        res.status(201).json(plan);
      } catch (error: any) {
        console.error("Error creating subscription plan:", error);
        res.status(500).json({ 
          message: error.message || "Failed to create plan"
        });
      }
    }
  );

  app.put(
    "/api/admin/subscription-plans/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const body = req.body as Partial<SubscriptionPlan>;
        if (!id) {
          return res.status(400).json({ message: "Plan id is required" });
        }

        const { id: _ignoredId, ...updates } = body as any;
        if ((updates as any).price !== undefined) {
          (updates as any).priceCents = Math.round(
            Number((updates as any).price) * 100
          );
          delete (updates as any).price;
        }

        const [plan] = await db
          .update(subscriptionPlans)
          .set(updates)
          .where(eq(subscriptionPlans.id, id))
          .returning();

        if (!plan) {
          return res.status(404).json({ message: "Plan not found" });
        }

        res.json(plan);
      } catch (error: any) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({ 
          message: error.message || "Failed to update plan"
        });
      }
    }
  );

  app.delete(
    "/api/admin/subscription-plans/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).json({ message: "Plan id is required" });
        }
        if (id === "trial") {
          return res.status(400).json({ 
            message: "Trial plan cannot be deleted"
          });
        }

        const result = await db
          .delete(subscriptionPlans)
          .where(eq(subscriptionPlans.id, id));

        if ((result.rowCount || 0) === 0) {
          return res.status(404).json({ message: "Plan not found" });
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting subscription plan:", error);
        res.status(500).json({ 
          message: error.message || "Failed to delete plan"
        });
      }
    }
  );

  app.get(
    "/api/admin/coupons",
    isAdminAuthenticated,
    async (_req, res) => {
      try {
        const allCoupons = await db
          .select()
          .from(coupons)
          .orderBy(desc(coupons.createdAt));
        res.json(allCoupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    },
  );

  app.post(
    "/api/admin/coupons",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const body = req.body as Partial<Coupon> & {
          planIds?: string[];
        };
        if (!body.code || !body.discountPercent || !body.planIds || body.planIds.length === 0) {
          return res.status(400).json({
            message: "Coupon code, discountPercent, and at least one planId are required",
          });
        }

        const discountPercent = Number(body.discountPercent);
        if (Number.isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
          return res
            .status(400)
            .json({ message: "discountPercent must be between 1 and 100" });
        }

        const cleanedPlanIds = body.planIds.map((id) => id.trim()).filter(Boolean);

        const [coupon] = await db
          .insert(coupons)
          .values({
            code: body.code.trim(),
            discountPercent,
            planIds: cleanedPlanIds,
          })
          .returning();

        res.status(201).json(coupon);
      } catch (error: any) {
        console.error("Error creating coupon:", error);
        res.status(500).json({
          message: error.message || "Failed to create coupon",
        });
      }
    },
  );

  app.put(
    "/api/admin/coupons/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const body = req.body as Partial<Coupon> & {
          planIds?: string[];
        };

        if (!id) {
          return res.status(400).json({ message: "Coupon id is required" });
        }

        const updates: Partial<Coupon> = {};
        if (body.code !== undefined) {
          updates.code = body.code.trim();
        }
        if (body.discountPercent !== undefined) {
          const discountPercent = Number(body.discountPercent);
          if (
            Number.isNaN(discountPercent) ||
            discountPercent <= 0 ||
            discountPercent > 100
          ) {
            return res
              .status(400)
              .json({ message: "discountPercent must be between 1 and 100" });
          }
          updates.discountPercent = discountPercent;
        }
        if (body.planIds !== undefined) {
          updates.planIds = body.planIds.map((id) => id.trim()).filter(Boolean);
        }

        const [coupon] = await db
          .update(coupons)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(coupons.id, id))
          .returning();

        if (!coupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        res.json(coupon);
      } catch (error: any) {
        console.error("Error updating coupon:", error);
        res.status(500).json({
          message: error.message || "Failed to update coupon",
        });
      }
    },
  );

  app.delete(
    "/api/admin/coupons/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        if (!id) {
          return res.status(400).json({ message: "Coupon id is required" });
        }

        const result = await db.delete(coupons).where(eq(coupons.id, id));
        if ((result.rowCount || 0) === 0) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({
          message: error.message || "Failed to delete coupon",
        });
      }
    },
  );
}
