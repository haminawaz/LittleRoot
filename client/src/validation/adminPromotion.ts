import { z } from "zod";

const getTextFromHtml = (html: string): string => {
  if (!html) return "";
  const emptyPatterns = [
    "<p><br></p>",
    "<p></p>",
    "<p><br/></p>",
    "<p><br /></p>",
    "",
  ];
  if (emptyPatterns.includes(html.trim())) {
    return "";
  }
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const textContent = (tempDiv.textContent || "").trim();
  if (!textContent || textContent.replace(/\s+/g, "").length === 0) {
    return "";
  }
  return textContent;
};

const bannerRefinement = (html: string): boolean => {
  const textContent = getTextFromHtml(html);
  return textContent.length > 0;
};

export const adminPromotionSchema = z.object({
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
  banner: z
    .string()
    .trim()
    .refine(bannerRefinement, {
      message: "Banner is required",
    })
    .refine(
      (html) => {
        const textContent = getTextFromHtml(html);
        return textContent.length <= 120;
      },
      {
        message: "Banner must not exceed 120 characters",
      }
    ),
});

export type AdminPromotionInput = z.infer<typeof adminPromotionSchema>;
