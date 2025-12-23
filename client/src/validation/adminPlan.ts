import { z } from "zod";

export const adminPlanSchema = z.object({
  planId: z.string().trim().min(1, "Plan ID is required"),
  name: z.string().trim().min(1, "Name is required"),
  price: z
    .number({
      invalid_type_error: "Price must be a number",
    })
    .min(0, "Price must be greater than or equal to 0"),
  booksPerMonth: z
    .number({
      invalid_type_error: "Books per month must be a number",
    })
    .int("Books per month must be an integer")
    .min(0, "Books per month must be greater than or equal to 0"),
  templateBooks: z
    .number({
      invalid_type_error: "Template books must be a number",
    })
    .int("Template books must be an integer")
    .min(0, "Template books must be greater than or equal to 0"),
  bonusVariations: z
    .number({
      invalid_type_error: "Bonus variations must be a number",
    })
    .int("Bonus variations must be an integer")
    .min(0, "Bonus variations must be greater than or equal to 0"),
  pagesPerBook: z
    .number({
      invalid_type_error: "Pages per book must be a number",
    })
    .int("Pages per book must be an integer")
    .min(1, "Pages per book must be at least 1"),
  sortOrder: z
    .number({
      invalid_type_error: "Sort order must be a number",
    })
    .int("Sort order must be an integer")
    .min(0, "Sort order must be greater than or equal to 0"),
});

export type AdminPlanInput = z.infer<typeof adminPlanSchema>;
