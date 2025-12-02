import type { Express } from "express";
import passport from "passport";
import { isAdminAuthenticated } from "./middleware";
import { setupAdminAuth } from "./auth";
import { db } from "../db";
import { users, stories, pages } from "@shared/schema";
import { eq, and, gte, desc, sql, like, or } from "drizzle-orm";
import { storage } from "../storage";

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
      if (plan) {
        whereConditions.push(eq(users.subscriptionPlan, plan));
      }

      // Status filter
      if (status === "active") {
        whereConditions.push(eq(users.subscriptionStatus, "active"));
      } else if (status === "canceled") {
        whereConditions.push(eq(users.subscriptionStatus, "canceled"));
      } else if (status === "past_due") {
        whereConditions.push(eq(users.subscriptionStatus, "past_due"));
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
}

