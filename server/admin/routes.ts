import type { Express } from "express";
import passport from "passport";
import { isAdminAuthenticated } from "./middleware";
import { setupAdminAuth } from "./auth";
import { db } from "../db";
import { users, stories, pages, SUBSCRIPTION_PLANS } from "@shared/schema";
import { eq, and, gte, desc, sql, like, or } from "drizzle-orm";
import { storage } from "../storage";
import Stripe from "stripe";
import { sendEmail } from "../emailService";

export function registerAdminRoutes(app: Express) {
  setupAdminAuth();
  
  // Admin login endpoint
  app.post('/api/admin/login', (req, res, next) => {
    passport.authenticate('admin-local', (err: any, admin: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!admin) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      
      req.login(admin, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ success: true, admin: { id: admin.claims.sub, email: admin.claims.email } });
      });
    })(req, res, next);
  });

  // Admin logout endpoint
  app.post('/api/admin/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current admin info
  app.get('/api/admin/me', isAdminAuthenticated, async (req: any, res) => {
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
  app.get('/api/admin/dashboard', isAdminAuthenticated, async (req: any, res) => {
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

      const illustrationsThisMonth = Number(illustrationsQuery[0]?.count || 0);

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
      res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
  });

  // Get users list with filters
  app.get('/api/admin/users', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { search, plan, status, limit = 50, offset = 0 } = req.query;

      let whereConditions: any[] = [];

      // Search filter
      if (search) {
        whereConditions.push(
          or(
            like(users.email, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )!
        );
      }

      // Plan filter
      if (plan && plan !== "all") {
        whereConditions.push(eq(users.subscriptionPlan, plan));
      }

      // Status filter
      if (status && status !== "all") {
        if (status === "active") {
          whereConditions.push(eq(users.subscriptionStatus, "active"));
        } else if (status === "canceled") {
          whereConditions.push(eq(users.subscriptionStatus, "canceled"));
        } else if (status === "past_due") {
          whereConditions.push(eq(users.subscriptionStatus, "past_due"));
        }
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const usersList = await db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      // Get total count
      const totalQuery = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereClause);

      const total = Number(totalQuery[0]?.count || 0);

      res.json({
        users: usersList,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user details
  app.get('/api/admin/users/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's stories count
      const storiesCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(stories)
        .where(eq(stories.userId, id));

      // Get total illustrations generated
      const illustrationsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pages)
        .innerJoin(stories, eq(stories.id, pages.storyId))
        .where(eq(stories.userId, id));

      res.json({
        ...user,
        stats: {
          storiesCount: Number(storiesCount[0]?.count || 0),
          illustrationsCount: Number(illustrationsCount[0]?.count || 0),
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user
  app.put('/api/admin/users/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedUser = await storage.updateUserSubscription(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get user billing history
  app.get('/api/admin/users/:id/billing', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey || !user.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-08-27.basil",
      });

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100,
      });

      res.json({
        invoices: invoices.data.map((inv) => ({
          id: inv.id,
          amount: inv.amount_paid / 100,
          currency: inv.currency,
          status: inv.status,
          date: new Date(inv.created * 1000).toISOString(),
          periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
          invoicePdf: inv.invoice_pdf,
          hostedInvoiceUrl: inv.hosted_invoice_url,
        })),
      });
    } catch (error) {
      console.error("Get billing history error:", error);
      res.status(500).json({ message: "Failed to fetch billing history" });
    }
  });

  // Add/remove credits
  app.post('/api/admin/users/:id/credits', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { amount, type } = req.body; // type: 'add' or 'remove'

      if (!amount || !type || (type !== 'add' && type !== 'remove')) {
        return res.status(400).json({ message: "Invalid request. Amount and type (add/remove) required." });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentCredits = user.illustrationsUsedThisMonth || 0;
      const newCredits = type === 'add' 
        ? Math.max(0, currentCredits - Number(amount)) // Subtract from used (effectively adding available)
        : Math.min(user.illustrationsLimitPerMonth || 0, currentCredits + Number(amount)); // Add to used

      const updatedUser = await storage.updateUserSubscription(id, {
        illustrationsUsedThisMonth: newCredits,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Update credits error:", error);
      res.status(500).json({ message: "Failed to update credits" });
    }
  });

  // Change user plan
  app.post('/api/admin/users/:id/plan', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { plan } = req.body;

      if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const planInfo = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
      const illustrationsLimit = planInfo.booksPerMonth * planInfo.pagesPerBook;

      const updates: any = {
        subscriptionPlan: plan,
        booksLimitPerMonth: planInfo.booksPerMonth,
        illustrationsLimitPerMonth: illustrationsLimit,
        templateBooksLimit: planInfo.templateBooks,
        bonusVariationsLimit: planInfo.bonusVariations,
        hasCommercialRights: planInfo.commercialRights,
        hasResellRights: planInfo.resellRights,
        hasAllFormattingOptions: planInfo.allFormattingOptions,
      };

      // If changing to trial, set trial end date
      if (plan === 'trial') {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        updates.trialEndsAt = trialEndsAt;
        updates.subscriptionStatus = 'active';
      }

      const updatedUser = await storage.updateUserSubscription(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Change plan error:", error);
      res.status(500).json({ message: "Failed to change plan" });
    }
  });

  // Refund last charge
  app.post('/api/admin/users/:id/refund', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey || !user.stripeCustomerId) {
        return res.status(400).json({ message: "User has no Stripe customer ID" });
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-08-27.basil",
      });

      // Get the most recent paid invoice
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 1,
        status: 'paid',
      });

      if (invoices.data.length === 0) {
        return res.status(404).json({ message: "No paid invoices found" });
      }

      const invoice = invoices.data[0];
      const paymentIntentId = typeof (invoice as any).payment_intent === 'string' 
        ? (invoice as any).payment_intent 
        : (invoice as any).payment_intent?.id;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "No payment intent found for invoice" });
      }

      // Create refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      res.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
        },
      });
    } catch (error: any) {
      console.error("Refund error:", error);
      res.status(500).json({ message: error.message || "Failed to process refund" });
    }
  });

  // Send custom email
  app.post('/api/admin/users/:id/email', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { subject, body } = req.body;

      if (!subject || !body) {
        return res.status(400).json({ message: "Subject and body are required" });
      }

      const user = await storage.getUser(id);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or has no email" });
      }

      await sendEmail({
        to: user.email,
        subject,
        html: body,
      });

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Send email error:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });
}

