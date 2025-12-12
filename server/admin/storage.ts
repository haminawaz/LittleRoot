import { db } from "../db";
import { admins, type Admin } from "@shared/schema";
import { eq } from "drizzle-orm";

export class AdminStorage {
  async getAdminById(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email));
    return admin;
  }
}

export const adminStorage = new AdminStorage();
