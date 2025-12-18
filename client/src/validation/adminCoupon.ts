import { z } from "zod";

export const adminCouponSchema = z.object({
  couponCode: z.string().trim().min(1, "Coupon code is required"),
  discountPercentage: z
    .number({
      invalid_type_error: "Discount must be a number",
    })
    .gt(0, "Discount must be greater than 0")
    .max(100, "Discount must be 100 or less"),
  subscriptionPlans: z
    .array(z.string().trim())
    .min(1, "Select at least one subscription plan"),
});

export type AdminCouponInput = z.infer<typeof adminCouponSchema>;
