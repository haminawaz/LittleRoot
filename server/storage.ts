import { 
  type Story, 
  type InsertStory, 
  type Page, 
  type InsertPage, 
  type StoryWithPages,
  type User,
  type UpsertUser,
  type UserWithSubscriptionInfo,
  type Template,
  type InsertTemplate,
  SUBSCRIPTION_PLANS,
  stories, 
  pages, 
  users,
  templates 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth and local auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithSubscriptionInfo(id: string): Promise<UserWithSubscriptionInfo | undefined>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateUserSubscription(id: string, updates: Partial<User>): Promise<User | undefined>;
  incrementUserBookUsage(id: string): Promise<User | undefined>;
  incrementUserIllustrationUsage(id: string): Promise<User | undefined>;
  incrementTemplateBookUsage(id: string): Promise<User | undefined>;
  incrementBonusVariationUsage(id: string): Promise<User | undefined>;
  consumeTemplateBook(id: string): Promise<{ success: boolean; error?: string; user?: User }>;
  consumeBonusVariation(id: string): Promise<{ success: boolean; error?: string; user?: User }>;
  resetMonthlyUsage(id: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Stories
  createStory(story: InsertStory): Promise<Story>;
  getStory(id: string): Promise<Story | undefined>;
  getStoryWithPages(id: string): Promise<StoryWithPages | undefined>;
  getAllStories(): Promise<Story[]>;
  getStoriesByUserId(userId: string): Promise<Story[]>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;
  
  // Pages
  createPage(page: InsertPage): Promise<Page>;
  getPage(id: string): Promise<Page | undefined>;
  getPagesByStoryId(storyId: string): Promise<Page[]>;
  updatePage(id: string, updates: Partial<Page>): Promise<Page | undefined>;
  deletePage(id: string): Promise<boolean>;
  deletePagesByStoryId(storyId: string): Promise<void>;

  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByUserId(userId: string): Promise<Template[]>;
  findTemplateByUserAndContent(userId: string, title: string, content: string): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth and local auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        // Set trial defaults for new users
        trialEndsAt: userData.trialEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        booksLimitPerMonth: userData.booksLimitPerMonth || 1,
        booksUsedThisMonth: userData.booksUsedThisMonth || 0,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithSubscriptionInfo(id: string): Promise<UserWithSubscriptionInfo | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // BACKFILL: For existing paid users, calculate illustration limits if not set
    let illustrationsLimit = user.illustrationsLimitPerMonth ?? 0;
    if (user.subscriptionPlan !== "trial" && illustrationsLimit === 0) {
      const planInfo = SUBSCRIPTION_PLANS[user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];
      if (planInfo) {
        illustrationsLimit = planInfo.booksPerMonth * planInfo.pagesPerBook;
        // Update the database with the calculated limit
        await this.updateUserSubscription(id, {
          illustrationsLimitPerMonth: illustrationsLimit
        });
      }
    }

    const now = new Date();
    const booksUsed = user.booksUsedThisMonth ?? 0;
    const booksLimit = user.booksLimitPerMonth ?? 1;
    const hasQuotaRemaining = booksUsed < booksLimit;
    
    let subscriptionStatusText = "";
    let daysLeftInTrial: number | undefined;
    let isPlanActive = false;

    if (user.subscriptionPlan === "trial") {
      // Trial: Check if trial period has expired
      const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > now;
      isPlanActive = Boolean(isTrialActive);
      
      if (isTrialActive && user.trialEndsAt) {
        daysLeftInTrial = Math.ceil((new Date(user.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        subscriptionStatusText = `${daysLeftInTrial} days left in trial`;
      } else {
        subscriptionStatusText = "Trial expired - upgrade to continue";
      }
    } else {
      // Paid plans: Check if subscription period is still valid
      const periodActive = !user.currentPeriodEnd || new Date(user.currentPeriodEnd) > now;
      
      // User retains access until currentPeriodEnd, even if payment failed (past_due)
      // Only lose access if period has ended AND status is not active
      if (periodActive) {
        // Period is still active - user has access
        isPlanActive = true;
        const planInfo = SUBSCRIPTION_PLANS[user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];
        
        if (user.subscriptionStatus === "past_due") {
          subscriptionStatusText = `${planInfo.name} - Payment failed (access until period ends) - ${booksUsed}/${booksLimit} books used`;
        } else if (user.cancelAtPeriodEnd) {
          subscriptionStatusText = `${planInfo.name} - Cancels at period end - ${booksUsed}/${booksLimit} books used`;
        } else {
          subscriptionStatusText = `${planInfo.name} - ${booksUsed}/${booksLimit} books used`;
        }
      } else {
        // Period has ended - check if subscription should continue
        if (user.subscriptionStatus === "active") {
          // Period ended but subscription is active (shouldn't normally happen, but keep access)
          isPlanActive = true;
          const planInfo = SUBSCRIPTION_PLANS[user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];
          subscriptionStatusText = `${planInfo.name} - ${booksUsed}/${booksLimit} books used`;
        } else {
          // Period ended and subscription is not active
          isPlanActive = false;
          subscriptionStatusText = user.subscriptionStatus === "past_due" 
            ? "Payment failed - please update payment method"
            : "Subscription ended - resubscribe to continue";
        }
      }
    }

    // User can only create new books and use features if plan is active AND has quota remaining
    return {
      ...user,
      illustrationsLimitPerMonth: illustrationsLimit, // Include backfilled value
      canCreateNewBook: Boolean(isPlanActive && hasQuotaRemaining),
      canUseTemplateBooks: Boolean(isPlanActive && (user.templateBooksUsed || 0) < (user.templateBooksLimit || 0)),
      canUseBonusVariations: Boolean(isPlanActive && (user.bonusVariationsUsed || 0) < (user.bonusVariationsLimit || 0)),
      templateBooksRemaining: isPlanActive ? Math.max(0, (user.templateBooksLimit || 0) - (user.templateBooksUsed || 0)) : 0,
      bonusVariationsRemaining: isPlanActive ? Math.max(0, (user.bonusVariationsLimit || 0) - (user.bonusVariationsUsed || 0)) : 0,
      daysLeftInTrial,
      subscriptionStatusText,
    };
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async incrementUserBookUsage(id: string): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const [user] = await db
      .update(users)
      .set({
        booksUsedThisMonth: (currentUser.booksUsedThisMonth || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async incrementUserIllustrationUsage(id: string): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const [user] = await db
      .update(users)
      .set({
        illustrationsUsedThisMonth: (currentUser.illustrationsUsedThisMonth || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async incrementTemplateBookUsage(id: string): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const [user] = await db
      .update(users)
      .set({
        templateBooksUsed: (currentUser.templateBooksUsed || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async incrementBonusVariationUsage(id: string): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const [user] = await db
      .update(users)
      .set({
        bonusVariationsUsed: (currentUser.bonusVariationsUsed || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async consumeTemplateBook(id: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }
    
    // Handle NULL limit as unlimited
    const limit = currentUser.templateBooksLimit ?? Number.MAX_SAFE_INTEGER;
    const used = currentUser.templateBooksUsed ?? 0;
    
    // Check if limit would be exceeded
    if (used >= limit) {
      return { 
        success: false, 
        error: "Template book limit reached. Upgrade your plan to save more templates!" 
      };
    }
    
    // Atomically increment usage ONLY if under limit
    // This prevents race conditions where multiple requests could exceed the limit
    // Use COALESCE to handle NULL usage counters (treat NULL as 0)
    const [user] = await db
      .update(users)
      .set({
        templateBooksUsed: sql`COALESCE(${users.templateBooksUsed}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, id),
          // Handle both NULL (unlimited) and numeric limits
          // COALESCE ensures NULL counters are treated as 0
          sql`(${users.templateBooksLimit} IS NULL OR COALESCE(${users.templateBooksUsed}, 0) < ${users.templateBooksLimit})`
        )
      )
      .returning();
    
    // If no rows were updated, the limit was reached between our check and the update
    if (!user) {
      return { 
        success: false, 
        error: "Template book limit reached. Upgrade your plan to save more templates!" 
      };
    }
    
    return { success: true, user };
  }

  async consumeBonusVariation(id: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }
    
    // Handle NULL limit as unlimited
    const limit = currentUser.bonusVariationsLimit ?? Number.MAX_SAFE_INTEGER;
    const used = currentUser.bonusVariationsUsed ?? 0;
    
    // Check if limit would be exceeded
    if (used >= limit) {
      return { 
        success: false, 
        error: "Bonus variation limit reached. Upgrade your plan to regenerate more images!" 
      };
    }
    
    // Atomically increment usage ONLY if under limit
    // This prevents race conditions where multiple requests could exceed the limit
    // Use COALESCE to handle NULL usage counters (treat NULL as 0)
    const [user] = await db
      .update(users)
      .set({
        bonusVariationsUsed: sql`COALESCE(${users.bonusVariationsUsed}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, id),
          // Handle both NULL (unlimited) and numeric limits
          // COALESCE ensures NULL counters are treated as 0
          sql`(${users.bonusVariationsLimit} IS NULL OR COALESCE(${users.bonusVariationsUsed}, 0) < ${users.bonusVariationsLimit})`
        )
      )
      .returning();
    
    // If no rows were updated, the limit was reached between our check and the update
    if (!user) {
      return { 
        success: false, 
        error: "Bonus variation limit reached. Upgrade your plan to regenerate more images!" 
      };
    }
    
    return { success: true, user };
  }

  async resetMonthlyUsage(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        booksUsedThisMonth: 0,
        illustrationsUsedThisMonth: 0,
        templateBooksUsed: 0,
        bonusVariationsUsed: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First, get all stories by this user
      const userStories = await this.getStoriesByUserId(id);
      
      // Delete all pages for each story (cascade)
      for (const story of userStories) {
        await this.deletePagesByStoryId(story.id);
      }
      
      // Delete all stories
      await db.delete(stories).where(eq(stories.userId, id));
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Stories
  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story || undefined;
  }

  async getStoryWithPages(id: string): Promise<StoryWithPages | undefined> {
    const story = await this.getStory(id);
    if (!story) return undefined;
    
    const storyPages = await db
      .select()
      .from(pages)
      .where(eq(pages.storyId, id))
      .orderBy(pages.pageNumber);
    
    return {
      ...story,
      pages: storyPages,
    };
  }

  async getAllStories(): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .orderBy(stories.createdAt);
  }

  async getStoriesByUserId(userId: string): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const [story] = await db
      .update(stories)
      .set(updates)
      .where(eq(stories.id, id))
      .returning();
    return story || undefined;
  }

  async deleteStory(id: string): Promise<boolean> {
    const result = await db
      .delete(stories)
      .where(eq(stories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Pages
  async createPage(insertPage: InsertPage): Promise<Page> {
    const [page] = await db
      .insert(pages)
      .values(insertPage)
      .returning();
    return page;
  }

  async getPage(id: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page || undefined;
  }

  async getPagesByStoryId(storyId: string): Promise<Page[]> {
    return await db
      .select()
      .from(pages)
      .where(eq(pages.storyId, storyId))
      .orderBy(pages.pageNumber);
  }

  async updatePage(id: string, updates: Partial<Page>): Promise<Page | undefined> {
    const [page] = await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, id))
      .returning();
    return page || undefined;
  }

  async deletePage(id: string): Promise<boolean> {
    const result = await db
      .delete(pages)
      .where(eq(pages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deletePagesByStoryId(storyId: string): Promise<void> {
    await db
      .delete(pages)
      .where(eq(pages.storyId, storyId));
  }

  // Templates
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .orderBy(templates.createdAt);
  }

  async getTemplatesByUserId(userId: string): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.userId, userId))
      .orderBy(desc(templates.createdAt));
  }

  async findTemplateByUserAndContent(userId: string, title: string, content: string): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.userId, userId),
          eq(templates.title, title),
          eq(templates.content, content)
        )
      );
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(templates)
      .where(eq(templates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
