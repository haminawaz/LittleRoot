import type { RequestHandler } from "express";
import { adminStorage } from "./storage";

export const isAdminAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req as any).user as any;

  if (!req.isAuthenticated() || !user || !user.claims || !user.claims.sub) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  if (user.claims.type !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }

  try {
    const admin = await adminStorage.getAdminById(user.claims.sub);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    console.error("Admin authentication middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const isAdminOnly: RequestHandler = async (req, res, next) => {
  const user = (req as any).user as any;

  if (!req.isAuthenticated() || !user || !user.claims || !user.claims.sub) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  if (user.claims.type !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }

  try {
    const admin = await adminStorage.getAdminById(user.claims.sub);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    console.error("Admin-only middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
