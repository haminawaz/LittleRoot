import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { adminStorage } from "./storage";

export function setupAdminAuth() {
  if (passport.strategies && (passport.strategies as any)['admin-local']) {
    console.log('Admin auth strategy already registered');
    return;
  }
  
  passport.use(
    "admin-local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: false,
      },
      async (email, password, done) => {
        try {
          const admin = await adminStorage.getAdminByEmail(email);
          
          if (!admin) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Return admin in same format as user auth for consistency
          return done(null, { 
            claims: { 
              sub: admin.id, 
              email: admin.email,
              type: "admin" // Distinguish from user auth
            } 
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export async function hashAdminPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

