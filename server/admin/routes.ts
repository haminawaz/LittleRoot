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
  promotions,
  admins,
  type SubscriptionPlan,
  type Promotion,
  type Admin,
} from "@shared/schema";
import { eq, and, gte, desc, sql, like, or } from "drizzle-orm";
import { storage } from "../storage";
import Stripe from "stripe";
import { sendEmail } from "../emailService";
import { getPayPalAccessToken, updatePayPalPlan } from "../setupPayPalProducts";

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

  app.put(
    "/api/admin/settings/promotion",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const sessionAdmin = (req as any).admin as Admin | undefined;
        if (!sessionAdmin) {
          return res.status(401).json({ message: "Admin not found" });
        }

        const { promotionId } = req.body as {
          promotionId?: string | null;
        };

        let newPromotionId: string | null = null;

        if (promotionId) {
          const [promotion] = await db
            .select()
            .from(promotions)
            .where(eq(promotions.id, promotionId));

          if (!promotion) {
            return res
              .status(400)
              .json({ message: "Selected promotion does not exist" });
          }

          newPromotionId = promotion.id;
        }

        const [updatedAdmin] = await db
          .update(admins)
          .set({ promotionId: newPromotionId })
          .where(eq(admins.id, sessionAdmin.id))
          .returning();

        if (!updatedAdmin) {
          return res.status(404).json({ message: "Admin not found" });
        }

        res.json({
          success: true,
        });
      } catch (error: any) {
        console.error("Error updating admin promotion:", error);
        res.status(500).json({
          message: error.message || "Failed to update admin promotion",
        });
      }
    },
  );

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

        const plan = await storage.getSubscriptionPlanById(id);
        if (!plan) {
          return res.status(404).json({ message: "Plan not found" });
        }

        const [updatedPlan] = await db
          .update(subscriptionPlans)
          .set(updates)
          .where(eq(subscriptionPlans.id, id))
          .returning();

        if (
          plan &&
          updates.priceCents !== undefined &&
          plan.priceCents !== updatedPlan.priceCents
        ) {
          console.log(
            `Price change detected for plan ${id}: ${updatedPlan.priceCents} -> ${updates.priceCents}`
          );

          const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY2;
          if (stripeSecretKey && updatedPlan.stripePriceId) {
            try {
              const stripe = new Stripe(stripeSecretKey, {
                apiVersion: "2025-08-27.basil",
              });

              const oldPrice = await stripe.prices.retrieve(
                updatedPlan.stripePriceId!
              );
              const productId = oldPrice.product as string;

              if (productId) {
                const newPrice = await stripe.prices.create({
                  product: productId,
                  unit_amount: updates.priceCents,
                  currency: "usd",
                  recurring: { interval: "month" },
                  nickname: updates.name || updatedPlan.name,
                });

                await stripe.products.update(productId, {
                  default_price: newPrice.id,
                });

                await db
                  .update(subscriptionPlans)
                  .set({ stripePriceId: newPrice.id })
                  .where(eq(subscriptionPlans.id, id));

                console.log(
                  `  ✓ Created new Stripe Price: ${newPrice.id} for product ${productId} and set as default`
                );
              }
            } catch (stripeError) {
              console.error("Error syncing with Stripe:", stripeError);
            }
          }

          const paypalClientId = process.env.PAYPAL_CLIENT_ID;
          const paypalSecret = process.env.PAYPAL_SECRET;
          const paypalMode = process.env.PAYPAL_MODE;

          if (
            paypalClientId &&
            paypalSecret &&
            updatedPlan.paypalPlanId
          ) {
            try {
              const paypalBaseUrl =
                paypalMode === "live"
                  ? "https://api-m.paypal.com"
                  : "https://api-m.sandbox.paypal.com";

              const accessToken = await getPayPalAccessToken(
                paypalBaseUrl,
                paypalClientId,
                paypalSecret
              );

              const newPriceString = (updates.priceCents / 100).toFixed(2);
              await updatePayPalPlan(
                paypalBaseUrl,
                accessToken,
                updatedPlan.paypalPlanId,
                newPriceString
              );
            } catch (paypalError) {
              console.error("Error syncing with PayPal:", paypalError);
            }
          }
        }

        res.json(updatedPlan);
      } catch (error: any) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({ 
          message: error.message || "Failed to update plan",
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
    "/api/admin/promotions",
    isAdminAuthenticated,
    async (_req, res) => {
      try {
        const allPromotions = await db
          .select()
          .from(promotions)
          .orderBy(desc(promotions.createdAt));
        res.json(allPromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        res.status(500).json({ message: "Failed to fetch promotions" });
      }
    },
  );

  app.post(
    "/api/admin/promotions",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const body = req.body as Partial<Promotion> & {
          planIds?: string[];
        };
        if (!body.couponCode || !body.discountPercent || !body.planIds || body.planIds.length === 0 || !body.banner) {
          return res.status(400).json({
            message: "Coupon code, discountPercent, banner, and at least one planId are required",
          });
        }

        const discountPercent = Number(body.discountPercent);
        if (Number.isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
          return res
            .status(400)
            .json({ message: "discountPercent must be between 1 and 100" });
        }

        if (body.banner.length > 120) {
          return res
            .status(400)
            .json({ message: "Banner must not exceed 120 characters" });
        }

        const cleanedPlanIds = body.planIds.map((id) => id.trim()).filter(Boolean);

        const [promotion] = await db
          .insert(promotions)
          .values({
            couponCode: body.couponCode.trim(),
            discountPercent,
            planIds: cleanedPlanIds,
            banner: body.banner,
          })
          .returning();

        res.status(201).json(promotion);
      } catch (error: any) {
        console.error("Error creating promotion:", error);
        res.status(500).json({
          message: error.message || "Failed to create promotion",
        });
      }
    },
  );

  app.put(
    "/api/admin/promotions/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const body = req.body as Partial<Promotion> & {
          planIds?: string[];
        };

        if (!id) {
          return res.status(400).json({ message: "Promotion id is required" });
        }

        const updates: Partial<Promotion> = {};
        if (body.couponCode !== undefined) {
          updates.couponCode = body.couponCode.trim();
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
        if (body.banner !== undefined) {
          if (body.banner.length > 120) {
            return res
              .status(400)
              .json({ message: "Banner must not exceed 120 characters" });
          }
          updates.banner = body.banner;
        }

        const [promotion] = await db
          .update(promotions)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(promotions.id, id))
          .returning();

        if (!promotion) {
          return res.status(404).json({ message: "Promotion not found" });
        }

        res.json(promotion);
      } catch (error: any) {
        console.error("Error updating promotion:", error);
        res.status(500).json({
          message: error.message || "Failed to update promotion",
        });
      }
    },
  );

  app.delete(
    "/api/admin/promotions/:id",
    isAdminAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        if (!id) {
          return res.status(400).json({ message: "Promotion id is required" });
        }

        const result = await db.delete(promotions).where(eq(promotions.id, id));
        if ((result.rowCount || 0) === 0) {
          return res.status(404).json({ message: "Promotion not found" });
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting promotion:", error);
        res.status(500).json({
          message: error.message || "Failed to delete promotion",
        });
      }
    },
  );
}
