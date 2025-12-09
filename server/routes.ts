import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { insertStorySchema, insertPageSchema, insertSupportTicketSchema, insertSupportMessageSchema, type GenerateBookRequest, type Page, type UserWithSubscriptionInfo, SUBSCRIPTION_PLANS } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { generateIllustration, splitStoryIntoPages, generateImagePrompt, generateBookIllustrations, generateCoverIllustration } from "./gemini";
import { ObjectStorageService } from "./objectStorage";
import { getImageDimensionsForFormat } from "./pdfGenerator";
import { addTextOverlay } from "./imageUtils";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, hashPassword, comparePassword } from "./localAuth";
import { sendEmail, generatePasswordResetEmail, generateVerificationEmail, generateWelcomeEmail } from "./emailService";
import { verifyGoogleToken } from "./googleAuth";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Initialize Stripe - use test keys in development
  let stripe: Stripe | null = null;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });
    const isLiveMode = stripeSecretKey.startsWith('sk_live');
    console.log(`Stripe initialized in ${isLiveMode ? 'LIVE' : 'TEST'} mode`);
  }

  // Set up authentication (Replit Auth and local email/password)
  await setupAuth(app);
  setupLocalAuth();

  // Object storage routes for public file serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage routes for private file serving
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.status(404).json({ error: "File not found" });
    }
  });

  // Direct upload for character images (simpler than presigned URLs)
  app.post("/api/objects/upload-character-image", isAuthenticated, express.raw({ type: 'image/*', limit: '10mb' }), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const imageBuffer = req.body;
      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Get content type and filename from headers
      const contentType = req.headers['content-type'] || 'image/png';
      const originalName = req.headers['x-file-name'] || 'character-image';
      
      // Determine file extension from content type
      let extension = 'png';
      if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
        extension = 'jpg';
      } else if (contentType === 'image/gif') {
        extension = 'gif';
      } else if (contentType === 'image/webp') {
        extension = 'webp';
      }

      // Generate unique filename with proper extension
      const fileName = `character-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const privateDir = objectStorageService.getPrivateObjectDir();
      const objectPath = `${privateDir}/uploads/${fileName}`;
      
      // Parse object path manually since parseObjectPath is not exported
      let path = objectPath;
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      const parts = path.slice(1).split("/");
      const bucketName = parts[0];
      const objectName = parts.slice(1).join("/");

      // Upload to object storage
      const { objectStorageClient } = await import("./objectStorage");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: contentType
        }
      });

      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(imageBuffer);
      });

      const imageUrl = `/objects/uploads/${fileName}`;
      console.log(`Successfully uploaded character image: ${fileName} (${contentType})`);
      res.json({ url: imageUrl, path: `uploads/${fileName}` });
    } catch (error) {
      console.error("Error uploading character image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Get upload URL for object storage (legacy presigned URL approach)
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Authentication routes (based on javascript_log_in_with_replit integration)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithSubscriptionInfo(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication routes (email/password)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, planId, paymentMethodId } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      let isUpdatingExistingUser = false;
      
      if (existingUser) {
        if (existingUser.emailVerified) {
          return res.status(400).json({ message: "User already exists with this email" });
        }

        if (existingUser.emailVerificationTokenExpires) {
          const now = new Date();
          const tokenExpires = new Date(existingUser.emailVerificationTokenExpires);
          
          if (tokenExpires > now) {
            return res.status(400).json({ 
              message: "This email is already in use. Please use a different email address." 
            });
          }
        }
        isUpdatingExistingUser = true;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Split name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Get plan details
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.trial;

      let userData: any = {
        email,
        passwordHash,
        firstName,
        lastName,
        subscriptionPlan: planId || 'trial',
        subscriptionStatus: 'active',
        booksLimitPerMonth: plan.booksPerMonth,
        booksUsedThisMonth: 0,
        illustrationsLimitPerMonth: (planId === 'trial' || !planId) ? 0 : plan.booksPerMonth * plan.pagesPerBook,
        illustrationsUsedThisMonth: 0,
        templateBooksLimit: plan.templateBooks,
        templateBooksUsed: 0,
        bonusVariationsLimit: plan.bonusVariations,
        bonusVariationsUsed: 0,
        hasCommercialRights: plan.commercialRights,
        hasResellRights: plan.resellRights,
        hasAllFormattingOptions: plan.allFormattingOptions,
      };

      // If free trial (no payment), set trial end date
      if (!paymentMethodId) {
        userData.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days trial
      }

      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      userData.emailVerified = false;
      userData.emailVerificationToken = verificationToken;
      userData.emailVerificationTokenExpires = verificationTokenExpires;

      let user;
      if (isUpdatingExistingUser && existingUser) {
        const { email, ...updateData } = userData;
        user = await storage.updateUserSubscription(existingUser.id, updateData);
        if (!user) {
          return res.status(500).json({ message: "Failed to update user" });
        }
      } else {
        user = await storage.upsertUser(userData);
      }

      // If payment method provided, create Stripe subscription
      if (paymentMethodId && stripe) {
        try {
          // Create Stripe customer
          const customer = await stripe.customers.create({
            email: user.email || '',
            name: `${user.firstName} ${user.lastName}`,
            payment_method: paymentMethodId,
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
            metadata: { userId: user.id }
          });

          // Create subscription
          const newSubscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: plan.stripePriceId! }],
            payment_settings: {
              payment_method_types: ['card'],
              save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
          });

          // Retrieve the subscription to get complete data including period dates
          const subscription = await stripe.subscriptions.retrieve(newSubscription.id);

          // Update user with Stripe info
          await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);
          
          // Type assertion for subscription properties
          const sub = subscription as any;
          
          // Period dates are in the subscription items, not at top level
          const periodStart = sub.items?.data?.[0]?.current_period_start;
          const periodEnd = sub.items?.data?.[0]?.current_period_end;
          
          console.log(`Registration: status=${sub.status}, period_start=${periodStart}, period_end=${periodEnd}`);
          console.log(`Registration period start: ${periodStart ? new Date(periodStart * 1000).toISOString() : 'null'}`);
          console.log(`Registration period end: ${periodEnd ? new Date(periodEnd * 1000).toISOString() : 'null'}`);
          
          await storage.updateUserSubscription(user.id, {
            subscriptionStatus: sub.status === 'active' ? 'active' : 'pending',
            currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            lastPaymentDate: new Date(), // Track initial payment
          });

          console.log(`Created subscription for user ${user.id}: ${subscription.id}`);
        } catch (stripeError: any) {
          console.error("Stripe error during registration:", stripeError);
          // Don't fail the registration, just log the error
          // User account is still created, they can add payment later
        }
      }

      // Send verification email
      const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      const emailContent = generateVerificationEmail(verificationUrl, user.firstName || undefined);
      
      try {
        await sendEmail({
          to: user.email!,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        console.log(`Verification email sent successfully to ${user.email}`);
      } catch (emailError: any) {
        console.error("Error sending verification email:", emailError);
      }

      res.json({ 
        success: true, 
        message: "Registration successful! Please check your email to verify your account.",
        requiresVerification: true,
        user: { id: user.id, email: user.email } 
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ success: true, user });
      });
    })(req, res, next);
  });

  app.post('/api/user/auth/google-login', async (req, res) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ message: "Google credential is required" });
      }

      const googlePayload = await verifyGoogleToken(credential);
      if (!googlePayload.email) {
        return res.status(400).json({ message: "Email is required from Google account" });
      }

      let user = await storage.getUserByEmail(googlePayload.email);

      if (!user) {
        const newUser = await storage.upsertUser({
          email: googlePayload.email,
          emailVerified: true,
          firstName: googlePayload.given_name || null,
          lastName: googlePayload.family_name || null,
          profileImageUrl: googlePayload.picture || null,
          passwordHash: null,
        });

        user = newUser;

        await storage.upsertSocialAccount({
          userId: user.id,
          provider: "google",
          providerId: googlePayload.sub,
          email: googlePayload.email,
          firstName: googlePayload.given_name || null,
          lastName: googlePayload.family_name || null,
          profileImageUrl: googlePayload.picture || null,
        });
      } else {
        if (!user.emailVerified) {
          await storage.updateUserSubscription(user.id, {
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationTokenExpires: null,
          });
        }

        const updates: Partial<typeof users.$inferInsert> = {};
        if (googlePayload.given_name && !user.firstName) {
          updates.firstName = googlePayload.given_name;
        }
        if (googlePayload.family_name && !user.lastName) {
          updates.lastName = googlePayload.family_name;
        }
        if (googlePayload.picture && !user.profileImageUrl) {
          updates.profileImageUrl = googlePayload.picture;
        }
        if (Object.keys(updates).length > 0) {
          await storage.updateUserSubscription(user.id, updates);
        }

        await storage.upsertSocialAccount({
          userId: user.id,
          provider: "google",
          providerId: googlePayload.sub,
          email: googlePayload.email,
          firstName: googlePayload.given_name || null,
          lastName: googlePayload.family_name || null,
          profileImageUrl: googlePayload.picture || null,
        });
      }

      req.login({ claims: { sub: user.id, email: user.email } }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ 
          success: true, 
          user: { claims: { sub: user.id, email: user.email } } 
        });
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      res.status(500).json({ 
        message: error.message || "Google login failed. Please try again." 
      });
    }
  });

  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const userResults = await db.select().from(users).where(
        and(
          eq(users.emailVerificationToken, token),
          gte(users.emailVerificationTokenExpires, new Date())
        )
      );

      if (userResults.length === 0) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      const user = userResults[0];

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email has already been verified" });
      }

      const plan = SUBSCRIPTION_PLANS[user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.trial;
      const planName = plan.name;

      await storage.updateUserSubscription(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      });

      const welcomeEmailContent = generateWelcomeEmail(user.firstName || undefined, planName);
      try {
        await sendEmail({
          to: user.email!,
          subject: welcomeEmailContent.subject,
          html: welcomeEmailContent.html,
          text: welcomeEmailContent.text,
        });
        console.log(`Welcome email sent successfully to ${user.email}`);
      } catch (emailError: any) {
        console.error("Error sending welcome email:", emailError);
      }

      res.json({ success: true, message: "Email verified successfully! Welcome to LittleRoot!" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Update profile (first name, last name)
  app.post('/api/auth/update-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      await storage.updateUserSubscription(userId, {
        firstName,
        lastName,
      });

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Get user
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "User not found or not using password authentication" });
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await storage.updateUserSubscription(userId, {
        passwordHash: newPasswordHash,
      });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (user) {
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

        await storage.updateUserSubscription(user.id, {
          passwordResetToken: resetToken,
          passwordResetTokenExpires: resetTokenExpires,
        });

        const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        const emailContent = generatePasswordResetEmail(resetUrl);
        try {
          await sendEmail({
            to: user.email!,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
          console.log(`Password reset email sent successfully to ${user.email}`);
        } catch (emailError: any) {
          console.error("Error sending password reset email:", emailError);
          console.error("Email error details:", {
            message: emailError.message,
            code: emailError.code,
            response: emailError.response,
          });
          console.log("Reset URL (for manual testing):", resetUrl);
        }
      }

      res.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive password reset instructions." 
      });
    } catch (error) {
      console.error("Error processing forgot password request:", error);
      res.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive password reset instructions." 
      });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const userResults = await db.select().from(users).where(
        and(
          eq(users.passwordResetToken, token),
          gte(users.passwordResetTokenExpires, new Date())
        )
      );

      if (userResults.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const user = userResults[0];

      const newPasswordHash = await hashPassword(newPassword);

      await storage.updateUserSubscription(user.id, {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      });

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get('/api/auth/verify-reset-token', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token is required" });
      }

      const userResults = await db.select().from(users).where(
        and(
          eq(users.passwordResetToken, token),
          gte(users.passwordResetTokenExpires, new Date())
        )
      );

      if (userResults.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      res.json({ success: true, message: "Token is valid" });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ message: "Failed to verify token" });
    }
  });

  // Delete account
  app.post('/api/auth/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user to check if they have Stripe subscription
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cancel Stripe subscription if exists
      if (stripe && user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (error) {
          console.error("Error canceling Stripe subscription:", error);
          // Continue with account deletion even if Stripe cancellation fails
        }
      }

      // Delete user and all associated data
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete account" });
      }

      // Logout user and destroy session completely
      req.logout((err: any) => {
        if (err) {
          console.error("Error logging out:", err);
        }
        // Destroy the session completely
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session:", err);
          }
          // Clear the session cookie
          res.clearCookie('connect.sid');
          res.json({ success: true, message: "Account deleted successfully" });
        });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Subscription management routes
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment processing not configured" });
    }

    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      
      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || '',
          metadata: { userId: userId }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, customerId, '');
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId! }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription: " + error.message });
    }
  });

  // Upgrade existing user subscription (same flow as registration)
  app.post("/api/subscription/upgrade", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment processing not configured" });
    }

    try {
      const userId = req.user.claims.sub;
      const { planId, paymentMethodId } = req.body;

      if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method required" });
      }

      const user = await storage.getUserWithSubscriptionInfo(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      let customerId = user.stripeCustomerId;
      let subscriptionId = user.stripeSubscriptionId;

      console.log(`Upgrading subscription for user ${userId}: planId=${planId}, has customer=${!!customerId}, has subscription=${!!subscriptionId}`);

      // Verify payment method exists before proceeding
      try {
        await stripe.paymentMethods.retrieve(paymentMethodId);
      } catch (pmError: any) {
        console.error("Payment method not found:", pmError.message);
        return res.status(400).json({ error: "Invalid payment method. Please try again with a new card." });
      }

      // Create customer if doesn't exist (for free trial users)
      if (!customerId) {
        console.log("Creating new Stripe customer for free trial user");
        const customer = await stripe.customers.create({
          email: user.email || '',
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: userId },
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, customerId, '');
        console.log(`Created Stripe customer: ${customerId}`);
      } else {
        // Attach payment method to existing customer
        console.log("Attaching payment method to existing customer");
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });

          // Set as default payment method
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        } catch (attachError: any) {
          // If payment method already attached, just update default
          if (attachError.code !== 'resource_already_exists') {
            console.error("Error attaching payment method:", attachError.message);
            throw attachError;
          }
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }
      }

      // Create or update subscription
      if (subscriptionId) {
        // Cancel old subscription and create new one (simpler than modifying)
        console.log(`Cancelling old subscription: ${subscriptionId}`);
        try {
          await stripe.subscriptions.cancel(subscriptionId);
        } catch (cancelError) {
          console.log("Old subscription already cancelled or doesn't exist");
        }
      }
      
      // Create new subscription
      console.log(`Creating new subscription with plan: ${plan.stripePriceId}`);
      const newSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId! }],
        default_payment_method: paymentMethodId,
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
      });
      
      // Retrieve the subscription to get complete data including period dates
      const subscription = await stripe.subscriptions.retrieve(newSubscription.id);
      
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      // Update user's subscription plan and access limits
      const sub = subscription as any;
      
      // Period dates are in the subscription items, not at top level
      const periodStart = sub.items?.data?.[0]?.current_period_start;
      const periodEnd = sub.items?.data?.[0]?.current_period_end;
      
      console.log(`Subscription data: status=${sub.status}, period_start=${periodStart}, period_end=${periodEnd}`);
      console.log(`Period start date: ${periodStart ? new Date(periodStart * 1000).toISOString() : 'null'}`);
      console.log(`Period end date: ${periodEnd ? new Date(periodEnd * 1000).toISOString() : 'null'}`);
      
      await storage.updateUserSubscription(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: sub.status === 'active' ? 'active' : 'pending',
        booksLimitPerMonth: plan.booksPerMonth, // Update book limit based on new plan
        illustrationsLimitPerMonth: plan.booksPerMonth * plan.pagesPerBook, // Illustrations = books * pages (144, 360, 600)
        templateBooksLimit: plan.templateBooks,
        bonusVariationsLimit: plan.bonusVariations,
        hasCommercialRights: plan.commercialRights,
        hasResellRights: plan.resellRights,
        hasAllFormattingOptions: plan.allFormattingOptions,
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
        lastPaymentDate: new Date(), // Track initial payment when upgrading
        trialEndsAt: null, // Clear trial end date when upgrading to paid
      });

      console.log(`Successfully created subscription ${subscription.id} for user ${userId}`);
      res.json({ success: true, message: "Subscription upgraded successfully" });
    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      // Return more specific error message
      const errorMessage = error.message || "Failed to upgrade subscription";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Cancel subscription (at period end)
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment processing not configured" });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription to cancel" });
      }

      // Cancel subscription at period end via Stripe
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update user's cancelAtPeriodEnd flag in database
      await storage.updateUserSubscription(userId, {
        cancelAtPeriodEnd: true,
      });

      console.log(`Subscription ${user.stripeSubscriptionId} set to cancel at period end for user ${userId}`);
      res.json({ 
        success: true, 
        message: "Subscription will be canceled at the end of the current billing period" 
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: error.message || "Failed to cancel subscription" });
    }
  });

  // Stripe webhook handler
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment processing not configured" });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription events
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          console.log(`Payment succeeded for user ${user.id} (${user.email}). Resetting monthly book usage.`);
          
          // Reset monthly usage for the new billing period
          await storage.resetMonthlyUsage(user.id);
          
          // Update subscription period dates and clear cancelAtPeriodEnd if payment succeeded
          const sub = subscription as any;
          
          // Period dates are in the subscription items, not at top level
          const periodStart = sub.items?.data?.[0]?.current_period_start;
          const periodEnd = sub.items?.data?.[0]?.current_period_end;
          
          console.log(`Webhook payment success: period_start=${periodStart}, period_end=${periodEnd}`);
          
          await storage.updateUserSubscription(user.id, {
            subscriptionStatus: sub.status === 'active' ? 'active' : 'pending',
            cancelAtPeriodEnd: false, // Clear cancel flag if payment succeeded
            currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            lastPaymentDate: new Date(), // Track when this payment was received
          });
        } else {
          console.log(`Payment succeeded but no user found for customer: ${customerId}`);
        }
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          console.log(`Payment failed for user ${user.id} (${user.email}). Setting status to past_due.`);
          
          // Update subscription status to past_due
          await storage.updateUserSubscription(user.id, {
            subscriptionStatus: 'past_due',
          });
        } else {
          console.log(`Payment failed but no user found for customer: ${customerId}`);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const user = await storage.getUserByStripeCustomerId(customerId);
      if (user) {
        console.log(`Subscription deleted for user ${user.id} (${user.email}). Setting status to canceled.`);
        
        // Update subscription status to canceled and clear subscription IDs
        await storage.updateUserSubscription(user.id, {
          subscriptionStatus: 'canceled',
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
        });
      } else {
        console.log(`Subscription deleted but no user found for customer: ${customerId}`);
      }
    }

    res.json({ received: true });
  });

  // Get user's stories
  app.get("/api/stories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getStoriesByUserId(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new story (with usage tracking)
  app.post("/api/stories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check user's subscription status and usage limits
      const userWithSubscription = await storage.getUserWithSubscriptionInfo(userId);
      if (!userWithSubscription) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!userWithSubscription.canCreateNewBook) {
        return res.status(403).json({ 
          error: "Book limit reached", 
          message: userWithSubscription.subscriptionStatusText,
          requiresUpgrade: true 
        });
      }

      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory({
        ...storyData,
        userId: userId
      });

      // Increment user's book usage
      await storage.incrementUserBookUsage(userId);

      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(400).json({ error: "Invalid story data" });
    }
  });

  // Get a story with pages (user ownership check)
  app.get("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const story = await storage.getStoryWithPages(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      // Check if user owns this story
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(story);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a story (user ownership check)
  app.put("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingStory = await storage.getStory(req.params.id);
      
      if (!existingStory) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      // Check if user owns this story
      if (existingStory.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates = req.body;
      const story = await storage.updateStory(req.params.id, updates);
      res.json(story);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate book pages from story
  app.post("/api/stories/:id/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = req.params.id;
      const story = await storage.getStory(storyId);
      
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Check if user owns this story
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update story status to generating
      await storage.updateStory(storyId, { status: "generating" });

      // Split story into pages
      const pageTexts = splitStoryIntoPages(story.content, story.pagesCount);
      
      // Delete existing pages
      await storage.deletePagesByStoryId(storyId);

      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), "generated-images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Create pages first with text (no images yet)
      const pages: Awaited<ReturnType<typeof storage.createPage>>[] = [];
      for (let i = 0; i < pageTexts.length; i++) {
        const imagePrompt = generateImagePrompt(pageTexts[i], story.title, story.artStyle);
        const page = await storage.createPage({
          storyId,
          pageNumber: i + 1,
          text: pageTexts[i],
          imagePrompt,
          isGenerating: true,  // Mark as generating while we create images
        });
        pages.push(page);
      }

      // Update story status to completed so pages are visible
      await storage.updateStory(storyId, { status: "completed" });

      // Return immediately so user can see pages with text
      res.json({ story, pages });

      // Generate images in background (don't await)
      const characterDescription = story.characterDescription || undefined;
      console.log(`Starting background image generation for "${story.title}" with ${pageTexts.length} pages`);
      
      // Get user info to check if we need to track illustrations for paid users
      const currentUser = await storage.getUser(userId);
      const isPaidUser = currentUser && currentUser.subscriptionPlan !== "trial";
      
      // Generate cover and images asynchronously in the background with progressive updates
      (async () => {
        try {
          // Generate front cover first
          console.log(`Generating cover for "${story.title}"...`);
          const coverFileName = `${storyId}_cover.webp`;
          const coverPath = path.join(imagesDir, coverFileName);
          
          // Get image dimensions based on PDF format
          const dimensions = getImageDimensionsForFormat(story.pdfFormat);
          
          await generateCoverIllustration(
            story.title,
            story.artStyle,
            story.content,
            characterDescription,
            coverPath,
            story.pdfFormat,  // Pass format for proper orientation in AI prompts
            dimensions.width,
            dimensions.height
          );
          
          const coverUrl = `/generated-images/${coverFileName}?t=${Date.now()}`;
          await storage.updateStory(storyId, { coverImageUrl: coverUrl });
          console.log(`✓ Cover generated and saved`);
          
          // Use callback to update each page immediately as its image is ready
          let imageUrls = await generateBookIllustrations({
            title: story.title,
            content: story.content,
            artStyle: story.artStyle,
            pageTexts: pageTexts,
            characterDescription,
            pdfFormat: story.pdfFormat,  // Pass format for proper orientation in AI prompts
            width: dimensions.width,
            height: dimensions.height
          }, imagesDir, storyId, async (pageIndex: number, imageUrl: string) => {
            // Update this specific page immediately so user sees it right away
            await storage.updatePage(pages[pageIndex].id, { 
              imageUrl, 
              isGenerating: false 
            });
            
            // Track illustration usage for paid users
            if (isPaidUser) {
              await storage.incrementUserIllustrationUsage(userId);
              console.log(`✓ Illustration ${pageIndex + 1} counted for paid user`);
            }
            
            console.log(`✓ Page ${pageIndex + 1} now visible to user`);
          });

          console.log(`✓ Background generation complete: Cover + ${imageUrls.length}/${pages.length} illustrations for "${story.title}"`);

          // Generate PDF after all images are ready
          try {
            console.log(`📄 Generating PDF for "${story.title}"...`);
            const { generatePDFWithReportLab } = await import('./pdfGenerator');
            
            // Get all pages with final image URLs
            const pagesWithImages = await storage.getPagesByStoryId(storyId);
            
            const pdfUrl = await generatePDFWithReportLab({
              storyId: story.id,
              storyTitle: story.title,
              pdfFormat: story.pdfFormat,
              coverImageUrl: coverUrl,
              pages: pagesWithImages.map(p => ({
                pageNumber: p.pageNumber,
                imageUrl: p.imageUrl || '',
                text: p.text
              }))
            });
            
            // Save PDF URL to story
            await storage.updateStory(storyId, { pdfUrl });
            console.log(`✓ PDF ready for instant download: ${pdfUrl}`);
          } catch (pdfError) {
            console.error(`Failed to generate PDF for "${story.title}":`, pdfError);
            // Don't fail the whole process if PDF generation fails
          }

        } catch (error) {
          console.error(`Error generating background illustrations for "${story.title}":`, error);
          
          // Update all pages to not generating on error
          for (const page of pages) {
            await storage.updatePage(page.id, { isGenerating: false });
          }
          
          // Set story status to error since generation failed
          await storage.updateStory(storyId, { status: "error" });
        }
      })().catch(err => {
        console.error("Uncaught error in background image generation:", err);
      });
    } catch (error) {
      console.error("Error generating book:", error);
      await storage.updateStory(req.params.id, { status: "error" });
      res.status(500).json({ error: "Failed to generate book" });
    }
  });

  // Regenerate cover image for a story
  app.post("/api/stories/:id/regenerate-cover", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = req.params.id;
      const story = await storage.getStory(storyId);
      
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Check if user owns this story
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Return immediately
      res.json({ message: "Cover regeneration started" });

      // Regenerate cover in background
      const imagesDir = path.join(process.cwd(), "generated-images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const characterDescription = story.characterDescription || undefined;
      
      (async () => {
        try {
          console.log(`Regenerating cover for "${story.title}"...`);
          const coverFileName = `${storyId}_cover.webp`;
          const coverPath = path.join(imagesDir, coverFileName);
          
          // Get image dimensions based on PDF format
          const dimensions = getImageDimensionsForFormat(story.pdfFormat);
          
          await generateCoverIllustration(
            story.title,
            story.artStyle,
            story.content,
            characterDescription,
            coverPath,
            story.pdfFormat,  // Pass format for proper orientation in AI prompts
            dimensions.width,
            dimensions.height
          );
          
          const coverUrl = `/generated-images/${coverFileName}?t=${Date.now()}`;
          await storage.updateStory(storyId, { coverImageUrl: coverUrl });
          console.log(`✓ Cover regenerated successfully`);
        } catch (error) {
          console.error(`Error regenerating cover for "${story.title}":`, error);
        }
      })().catch(err => {
        console.error("Uncaught error in background cover regeneration:", err);
      });
    } catch (error) {
      console.error("Error regenerating cover:", error);
      res.status(500).json({ error: "Failed to regenerate cover" });
    }
  });

  // Save story as template
  app.post("/api/stories/:id/save-as-template", isAuthenticated, async (req: any, res) => {
    try {
      const storyId = req.params.id;
      const userId = req.user.claims.sub;

      // Get the story
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify the story belongs to the user
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only save your own stories as templates" });
      }

      // Check if this story is already saved as a template
      const existingTemplate = await storage.findTemplateByUserAndContent(
        userId,
        story.title,
        story.content
      );

      if (existingTemplate) {
        return res.status(400).json({ 
          error: "This story is already saved as a template",
          alreadyExists: true
        });
      }

      // Check and consume template book quota
      const quotaResult = await storage.consumeTemplateBook(userId);
      if (!quotaResult.success) {
        return res.status(403).json({ 
          error: quotaResult.error,
          quotaExceeded: true
        });
      }

      // Generate a simple description from the content (first 100 characters)
      const description = story.content.length > 100 
        ? story.content.substring(0, 100) + "..."
        : story.content;

      // Create template
      const template = await storage.createTemplate({
        userId,
        title: story.title,
        content: story.content,
        artStyle: story.artStyle,
        description,
      });

      res.json(template);
    } catch (error) {
      console.error("Error saving story as template:", error);
      res.status(500).json({ error: "Failed to save story as template" });
    }
  });

  // Get all templates (both user-created and system templates)
  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user's templates
      const userTemplates = await storage.getTemplatesByUserId(userId);

      res.json(userTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Delete a template
  app.delete("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const templateId = req.params.id;
      const userId = req.user.claims.sub;

      // Get the template to verify ownership
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Verify the template belongs to the user
      if (template.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only delete your own templates" });
      }

      // Delete the template
      const deleted = await storage.deleteTemplate(templateId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete template" });
      }

      res.json({ success: true, message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Generate illustration for a specific page
  app.post("/api/pages/:id/generate-image", isAuthenticated, async (req: any, res) => {
    try {
      const pageId = req.params.id;
      const userId = req.user.claims.sub;
      const { text } = req.body; // Get updated text from request body
      const page = await storage.getPage(pageId);
      
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      const story = await storage.getStory(page.storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify the story belongs to the user
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only regenerate images for your own stories" });
      }

      // Check if this is a regeneration (page already has an image)
      // Only regenerations consume bonus variations - initial generation is included
      const isRegeneration = !!page.imageUrl;
      
      if (isRegeneration) {
        // Check and consume bonus variation quota for regenerations
        const quotaResult = await storage.consumeBonusVariation(userId);
        if (!quotaResult.success) {
          return res.status(403).json({ 
            error: quotaResult.error,
            quotaExceeded: true
          });
        }
      } else {
        // For initial generation, track illustrations for paid users
        const user = await storage.getUser(userId);
        if (user && user.subscriptionPlan !== "trial") {
          // Paid users: increment illustration count
          await storage.incrementUserIllustrationUsage(userId);
        }
      }

      // Mark page as generating
      await storage.updatePage(pageId, { isGenerating: true });

      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), "generated-images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Generate image using the current text (from request body if provided, otherwise from page)
      const tempImagePath = path.join(imagesDir, `temp_${pageId}.webp`);
      const finalImagePath = path.join(imagesDir, `${pageId}.webp`);
      const characterDescription = story.characterDescription || undefined;
      const currentText = text || page.text; // Use provided text or fall back to stored text
      
      // Get image dimensions based on PDF format
      const dimensions = getImageDimensionsForFormat(story.pdfFormat);

      // Step 1: Generate the base illustration
      await generateIllustration({
        prompt: currentText,
        characterDescription,
        artStyle: story.artStyle,
        pdfFormat: story.pdfFormat,  // Pass format for proper orientation in AI prompts
        width: dimensions.width,
        height: dimensions.height,
      }, tempImagePath);

      // Step 2: Add text overlay on top of the illustration
      await addTextOverlay({
        text: currentText,
        imagePath: tempImagePath,
        outputPath: finalImagePath,
        fontSize: 72,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        textColor: 'white'
      });

      // Step 3: Clean up temp file
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }

      // Update page with image URL (add timestamp to bust browser cache)
      const timestamp = Date.now();
      const imageUrl = `/generated-images/${pageId}.webp?t=${timestamp}`;
      const updatedPage = await storage.updatePage(pageId, { 
        imageUrl, 
        isGenerating: false 
      });

      res.json(updatedPage);
    } catch (error) {
      console.error("Error generating image:", error);
      await storage.updatePage(req.params.id, { isGenerating: false });
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Serve generated images
  app.use("/generated-images", express.static(path.join(process.cwd(), "generated-images")));

  // Update a page
  app.put("/api/pages/:id", async (req, res) => {
    try {
      const updates = req.body;
      const page = await storage.updatePage(req.params.id, updates);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded files (legacy - can be removed if no other files need serving)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Add new page
  app.post("/api/pages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, text, pageNumber } = req.body;
      
      if (!storyId || !text || pageNumber === undefined) {
        return res.status(400).json({ error: "Missing required fields: storyId, text, pageNumber" });
      }

      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      if (story.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only add pages to your own stories" });
      }

      const user = await storage.getUserWithSubscriptionInfo(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.subscriptionPlan !== "trial") {
        const illustrationsUsed = user.illustrationsUsedThisMonth || 0;
        const illustrationsLimit = user.illustrationsLimitPerMonth || 0;
        
        if (illustrationsLimit > 0 && illustrationsUsed >= illustrationsLimit) {
          return res.status(403).json({ 
            error: "You've reached your illustration limit. Please upgrade your plan to add more illustrations.",
            quotaExceeded: true,
            illustrationLimitReached: true
          });
        }
      }

      // Get existing pages to determine insertion point
      const existingPages = await storage.getPagesByStoryId(storyId);
      
      // Renumber pages after the insertion point
      for (const page of existingPages) {
        if (page.pageNumber >= pageNumber) {
          await storage.updatePage(page.id, { pageNumber: page.pageNumber + 1 });
        }
      }

      const imagePrompt = generateImagePrompt(text, story.title, story.artStyle);
      
      // Create page first
      const newPage = await storage.createPage({
        storyId,
        pageNumber,
        text,
        imagePrompt,
        isGenerating: true,  // Mark as generating while we create the image
      });

      try {
        if (user.subscriptionPlan !== "trial") {
          await storage.incrementUserIllustrationUsage(userId);
        }

        // Generate image automatically
        const imagesDir = path.join(process.cwd(), "generated-images");
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        const imagePath = path.join(imagesDir, `${newPage.id}.webp`);
        const characterDescription = story.characterDescription || undefined;
        
        // Get image dimensions based on PDF format
        const dimensions = getImageDimensionsForFormat(story.pdfFormat);

        await generateIllustration({
          prompt: imagePrompt,
          characterDescription,
          artStyle: story.artStyle,
          pdfFormat: story.pdfFormat,  // Pass format for proper orientation in AI prompts
          width: dimensions.width,
          height: dimensions.height,
        }, imagePath);

        // Update page with image URL (add timestamp to bust browser cache)
        const timestamp = Date.now();
        const imageUrl = `/generated-images/${newPage.id}.webp?t=${timestamp}`;
        const updatedPage = await storage.updatePage(newPage.id, { 
          imageUrl, 
          isGenerating: false 
        });

        res.json(updatedPage);
      } catch (error) {
        console.error(`Error generating image for new page ${newPage.id}:`, error);
        if (user.subscriptionPlan !== "trial") {
          const currentUser = await storage.getUser(userId);
          if (currentUser && (currentUser.illustrationsUsedThisMonth || 0) > 0) {
            await storage.updateUserSubscription(userId, {
              illustrationsUsedThisMonth: Math.max(0, (currentUser.illustrationsUsedThisMonth || 0) - 1)
            });
          }
        }
        // Update page to not generating, but keep the page
        const updatedPage = await storage.updatePage(newPage.id, { isGenerating: false });
        res.json(updatedPage);
      }
    } catch (error) {
      console.error("Error adding page:", error);
      res.status(500).json({ error: "Failed to add page" });
    }
  });

  // Delete page
  app.delete("/api/pages/:id", async (req, res) => {
    try {
      const pageId = req.params.id;
      const page = await storage.getPage(pageId);
      
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      // Delete the page
      await storage.deletePage(pageId);
      
      // Renumber remaining pages
      const remainingPages = await storage.getPagesByStoryId(page.storyId);
      const sortedPages = remainingPages
        .filter(p => p.pageNumber > page.pageNumber)
        .sort((a, b) => a.pageNumber - b.pageNumber);
      
      for (let i = 0; i < sortedPages.length; i++) {
        await storage.updatePage(sortedPages[i].id, { 
          pageNumber: page.pageNumber + i 
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "Failed to delete page" });
    }
  });

  // Reorder pages
  app.post("/api/stories/:id/reorder-pages", async (req, res) => {
    try {
      const storyId = req.params.id;
      const { pageOrder } = req.body; // Array of page IDs in new order
      
      if (!Array.isArray(pageOrder)) {
        return res.status(400).json({ error: "pageOrder must be an array" });
      }

      // Update page numbers based on new order
      for (let i = 0; i < pageOrder.length; i++) {
        await storage.updatePage(pageOrder[i], { pageNumber: i + 1 });
      }

      const updatedPages = await storage.getPagesByStoryId(storyId);
      res.json(updatedPages);
    } catch (error) {
      console.error("Error reordering pages:", error);
      res.status(500).json({ error: "Failed to reorder pages" });
    }
  });

  // Split page
  app.post("/api/pages/:id/split", async (req, res) => {
    try {
      const pageId = req.params.id;
      const { splitIndex } = req.body; // Character index where to split
      
      const page = await storage.getPage(pageId);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      if (splitIndex === undefined || splitIndex <= 0 || splitIndex >= page.text.length) {
        return res.status(400).json({ error: "Invalid split index" });
      }

      const firstHalf = page.text.substring(0, splitIndex).trim();
      const secondHalf = page.text.substring(splitIndex).trim();

      if (!firstHalf || !secondHalf) {
        return res.status(400).json({ error: "Split would create empty page" });
      }

      // Update current page with first half
      await storage.updatePage(pageId, { text: firstHalf });

      // Get existing pages to renumber those after this one
      const existingPages = await storage.getPagesByStoryId(page.storyId);
      const pagesToShift = existingPages.filter(p => p.pageNumber > page.pageNumber);
      
      // Shift page numbers up for pages after this one
      for (const pageToShift of pagesToShift) {
        await storage.updatePage(pageToShift.id, { pageNumber: pageToShift.pageNumber + 1 });
      }

      // Create new page with second half
      const newPage = await storage.createPage({
        storyId: page.storyId,
        pageNumber: page.pageNumber + 1,
        text: secondHalf,
        imagePrompt: `Create a children's book illustration for: ${secondHalf}`,
        isGenerating: false,
      });

      res.json({ originalPage: page, newPage });
    } catch (error) {
      console.error("Error splitting page:", error);
      res.status(500).json({ error: "Failed to split page" });
    }
  });

  // Merge pages
  app.post("/api/pages/merge", async (req, res) => {
    try {
      const { pageIds } = req.body; // Array of page IDs to merge, in order
      
      if (!Array.isArray(pageIds) || pageIds.length < 2) {
        return res.status(400).json({ error: "Must provide at least 2 page IDs to merge" });
      }

      // Get all pages to merge
      const pagesToMerge: Page[] = [];
      for (const pageId of pageIds) {
        const page = await storage.getPage(pageId);
        if (!page) {
          return res.status(404).json({ error: `Page ${pageId} not found` });
        }
        pagesToMerge.push(page);
      }

      // Sort by page number
      pagesToMerge.sort((a, b) => a.pageNumber - b.pageNumber);
      
      // Ensure pages are consecutive
      for (let i = 1; i < pagesToMerge.length; i++) {
        if (pagesToMerge[i].pageNumber !== pagesToMerge[i-1].pageNumber + 1) {
          return res.status(400).json({ error: "Pages must be consecutive to merge" });
        }
      }

      // Merge text content
      const mergedText = pagesToMerge.map(p => p.text).join(' ');
      const firstPage = pagesToMerge[0];

      // Update first page with merged content
      await storage.updatePage(firstPage.id, { 
        text: mergedText,
        imagePrompt: `Create a children's book illustration for: ${mergedText}`
      });

      // Delete other pages
      for (let i = 1; i < pagesToMerge.length; i++) {
        await storage.deletePage(pagesToMerge[i].id);
      }

      // Renumber remaining pages
      const allPages = await storage.getPagesByStoryId(firstPage.storyId);
      const pagesToRenumber = allPages
        .filter(p => p.pageNumber > pagesToMerge[pagesToMerge.length - 1].pageNumber)
        .sort((a, b) => a.pageNumber - b.pageNumber);
      
      const deletedCount = pagesToMerge.length - 1;
      for (const page of pagesToRenumber) {
        await storage.updatePage(page.id, { pageNumber: page.pageNumber - deletedCount });
      }

      res.json({ mergedPage: firstPage });
    } catch (error) {
      console.error("Error merging pages:", error);
      res.status(500).json({ error: "Failed to merge pages" });
    }
  });

  // Create a new support ticket
  app.post("/api/support/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        userId,
      });
      const ticket = await storage.createSupportTicket(ticketData);

      if (req.body.message) {
        await storage.createSupportMessage({
          ticketId: ticket.id,
          senderId: userId,
          senderType: "user",
          message: req.body.message,
          seenByUser: true,
          seenByAdmin: false,
        });
      }
      
      const ticketWithMessages = await storage.getSupportTicketWithMessages(ticket.id);
      res.json(ticketWithMessages);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(400).json({ error: "Invalid ticket data" });
    }
  });

  // Get all support tickets for the current user
  app.get("/api/support/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tickets = await storage.getSupportTicketsByUserId(userId);

      const ticketsWithUnseenCount = await Promise.all(
        tickets.map(async (ticket) => {
          const unseenCount = await storage.getUnseenMessagesCountForTicket(ticket.id);
          return {
            ...ticket,
            unseenCount,
          };
        })
      );
      
      res.json(ticketsWithUnseenCount);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get a specific support ticket with messages
  app.get("/api/support/tickets/:ticketId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketId = req.params.ticketId;
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      if (ticket.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const ticketWithMessages = await storage.getSupportTicketWithMessages(ticketId);
      res.json(ticketWithMessages);
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add a message to a support ticket
  app.post("/api/support/tickets/:ticketId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketId = req.params.ticketId;
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      if (ticket.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messageData = insertSupportMessageSchema.parse({
        ticketId,
        senderId: userId,
        senderType: "user",
        message: req.body.message,
        seenByUser: true,
        seenByAdmin: false,
      });
      
      const message = await storage.createSupportMessage(messageData);
      
      if (ticket.status === "closed") {
        await storage.updateSupportTicket(ticketId, { status: "open" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error creating support message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.post("/api/support/tickets/:ticketId/mark-seen", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketId = req.params.ticketId;

      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      if (ticket.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.markMessagesAsSeenByUser(ticketId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/support/unseen-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnseenMessagesCountForUser(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unseen messages count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
