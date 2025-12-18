import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Edit2, Trash2, Plus } from "lucide-react";
import {
  adminPromotionSchema,
  type AdminPromotionInput,
} from "@/validation/adminPromotion";
import { RichTextEditor } from "@/components/RichTextEditor";

interface AdminPromotion {
  id: string;
  couponCode: string;
  discountPercent: number;
  planIds: string[];
  banner: string;
}

interface AdminSubscriptionPlan {
  id: string;
  name: string;
}

type PromotionFormState = {
  id: string;
  couponCode: string;
  discountPercent: string;
  planIds: string[];
  banner: string;
};

export default function AdminPromotions() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] =
    useState<AdminPromotion | null>(null);
  const [promotionToDelete, setPromotionToDelete] =
    useState<AdminPromotion | null>(null);
  const [formError, setFormError] = useState<{
    couponCode?: string;
    discountPercentage?: string;
    subscriptionPlans?: string;
    banner?: string;
  }>({});

  const [formState, setFormState] = useState<PromotionFormState>({
    id: "",
    couponCode: "",
    discountPercent: "",
    planIds: [],
    banner: "",
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery<
    AdminPromotion[]
  >({
    queryKey: ["/api/admin/promotions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promotions");
      if (!res.ok) {
        throw new Error("Failed to fetch promotions");
      }
      return res.json();
    },
    enabled: isAdminAuthenticated,
  });

  const { data: plans } = useQuery<AdminSubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscription-plans");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return res.json();
    },
    enabled: isAdminAuthenticated,
  });

  const sortedPromotions = useMemo(
    () =>
      (promotions || []).slice().sort((a, b) => {
        if (a.couponCode === b.couponCode) {
          return a.id.localeCompare(b.id);
        }
        return a.couponCode.localeCompare(b.couponCode);
      }),
    [promotions]
  );

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const toValidate: AdminPromotionInput = {
        couponCode: formState.couponCode,
        discountPercentage: Number(formState.discountPercent || "0"),
        subscriptionPlans: formState.planIds,
        banner: formState.banner,
      };

      const result = adminPromotionSchema.safeParse(toValidate);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setFormError({
          couponCode: fieldErrors.couponCode?.[0],
          discountPercentage: fieldErrors.discountPercentage?.[0],
          subscriptionPlans: fieldErrors.subscriptionPlans?.[0],
          banner: fieldErrors.banner?.[0],
        });
        throw new Error("Validation failed");
      }

      setFormError({});

      const payload: any = {
        couponCode: formState.couponCode.trim(),
        discountPercent: result.data.discountPercentage,
        planIds: formState.planIds,
        banner: result.data.banner,
      };

      const method = editingPromotion ? "PUT" : "POST";
      const url = editingPromotion
        ? `/api/admin/promotions/${encodeURIComponent(editingPromotion.id)}`
        : "/api/admin/promotions";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save promotion");
      }

      return data;
    },
    onSuccess: () => {
      setFormError({});
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/promotions"],
      });
      setIsFormOpen(false);
      setEditingPromotion(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!promotionToDelete) return;
      const res = await fetch(
        `/api/admin/promotions/${encodeURIComponent(promotionToDelete.id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete promotion");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/promotions"],
      });
      setIsDeleteOpen(false);
      setPromotionToDelete(null);
    },
  });

  const openCreateForm = () => {
    setEditingPromotion(null);
    setFormState({
      id: "",
      couponCode: "",
      discountPercent: "",
      planIds: [],
      banner: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (promotion: AdminPromotion) => {
    setEditingPromotion(promotion);
    setFormState({
      id: promotion.id,
      couponCode: promotion.couponCode,
      discountPercent: promotion.discountPercent.toString(),
      planIds: promotion.planIds || [],
      banner: promotion.banner || "",
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (promotion: AdminPromotion) => {
    setPromotionToDelete(promotion);
    setIsDeleteOpen(true);
  };

  const handleFormChange = (
    field: keyof PromotionFormState,
    value: string | boolean | string[]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Promotions</CardTitle>
              <CardDescription>
                View, create, edit, and delete promotion codes.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={openCreateForm}
              className={`${isFormOpen ? "hidden" : ""}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden min-h-[420px]">
            <AnimatePresence initial={false} mode="wait">
              {!isFormOpen && (
                <motion.div
                  key="promotions-table"
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                  className="space-y-4"
                >
                  {promotionsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                    </div>
                  ) : sortedPromotions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No promotions found. Click &quot;Create Promotion&quot; to
                      add one.
                    </p>
                  ) : (
                    <div className="rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Coupon Code</TableHead>
                            <TableHead>Discount %</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="w-[100px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedPromotions.map((promotion) => {
                            const planNames =
                              promotion.planIds
                                .map((id) => {
                                  const plan = plans?.find((p) => p.id === id);
                                  return plan ? plan.name : id;
                                })
                                .join(", ") || "—";
                            return (
                              <TableRow key={promotion.id}>
                                <TableCell className="font-mono text-xs">
                                  {promotion.couponCode}
                                </TableCell>
                                <TableCell>
                                  {promotion.discountPercent}%
                                </TableCell>
                                <TableCell>{planNames}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditForm(promotion)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-red-600"
                                      onClick={() =>
                                        openDeleteDialog(promotion)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </motion.div>
              )}

              {isFormOpen && (
                <>
                  <motion.div
                    key="promotion-form"
                    initial={{ x: 56, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 56, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                    className="w-full ml-auto bg-card rounded-xl border shadow-sm p-6 space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {editingPromotion
                          ? "Edit Promotion"
                          : "Create Promotion"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {editingPromotion
                          ? "Update the promotion details below."
                          : "Fill in the details to create a new promotion."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coupon-code">Coupon Code</Label>
                        <Input
                          id="coupon-code"
                          value={formState.couponCode}
                          onChange={(e) =>
                            handleFormChange("couponCode", e.target.value)
                          }
                        />
                        {formError.couponCode && (
                          <p className="text-xs text-red-600">
                            {formError.couponCode}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="banner">
                          Banner <span className="text-red-600">*</span>
                        </Label>
                        <RichTextEditor
                          value={formState.banner}
                          onChange={(value) =>
                            handleFormChange("banner", value)
                          }
                          maxLength={120}
                          placeholder="Enter banner text with formatting (bold, underline, italic)..."
                        />
                        {formError.banner && (
                          <p className="text-xs text-red-600">
                            {formError.banner}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount-percent">
                            Discount percentage
                          </Label>
                          <Input
                            id="discount-percent"
                            type="number"
                            min="1"
                            max="100"
                            value={formState.discountPercent}
                            onChange={(e) =>
                              handleFormChange(
                                "discountPercent",
                                e.target.value
                              )
                            }
                          />
                          {formError.discountPercentage && (
                            <p className="text-xs text-red-600">
                              {formError.discountPercentage}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Subscription plans</Label>
                          <div className="border rounded-md px-3 py-2 max-h-56 overflow-y-auto space-y-2">
                            {(plans || [])
                              .filter((plan) => plan.id !== "trial")
                              .map((plan) => {
                                const checked = formState.planIds.includes(
                                  plan.id
                                );
                                return (
                                  <label
                                    key={plan.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(v) => {
                                        const isChecked = Boolean(v);
                                        setFormState((prev) => {
                                          const current = prev.planIds || [];
                                          if (isChecked) {
                                            if (current.includes(plan.id)) {
                                              return prev;
                                            }
                                            return {
                                              ...prev,
                                              planIds: [...current, plan.id],
                                            };
                                          } else {
                                            return {
                                              ...prev,
                                              planIds: current.filter(
                                                (id) => id !== plan.id
                                              ),
                                            };
                                          }
                                        });
                                      }}
                                    />
                                    <span>
                                      {plan.name}{" "}
                                      <span className="text-xs text-muted-foreground">
                                        ({plan.id})
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            {plans &&
                              plans.filter((p) => p.id !== "trial").length ===
                                0 && (
                                <p className="text-xs text-muted-foreground">
                                  No configurable plans available.
                                </p>
                              )}
                          </div>
                          {formError.subscriptionPlans && (
                            <p className="text-xs text-red-600">
                              {formError.subscriptionPlans}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="flex justify-end gap-2 pt-4 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingPromotion(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => upsertMutation.mutate()}
                      disabled={upsertMutation.isPending}
                    >
                      {upsertMutation.isPending
                        ? "Saving..."
                        : editingPromotion
                        ? "Save changes"
                        : "Create promotion"}
                    </Button>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Delete promotion</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Are you sure you want to delete the promotion
                {promotionToDelete ? ` "${promotionToDelete.couponCode}"` : ""}?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setPromotionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
