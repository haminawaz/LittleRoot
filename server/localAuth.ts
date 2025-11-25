import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";

export function setupLocalAuth() {
  // Local strategy for email/password authentication
  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "No account found with this email. Please sign up first." });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: "Please use Replit login for this account" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Incorrect password. Please try again." });
          }

          // Return user in same format as Replit Auth for consistency
          return done(null, { claims: { sub: user.id, email: user.email } });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
