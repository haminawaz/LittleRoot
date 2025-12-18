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
  adminCouponSchema,
  type AdminCouponInput,
} from "@/validation/adminCoupon";

interface AdminCoupon {
  id: string;
  code: string;
  discountPercent: number;
  planIds: string[];
  isActive: boolean;
}

interface AdminSubscriptionPlan {
  id: string;
  name: string;
}

type CouponFormState = {
  id: string;
  code: string;
  discountPercent: string;
  planIds: string[];
  isActive: boolean;
};

export default function AdminCoupons() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<AdminCoupon | null>(
    null
  );
  const [formError, setFormError] = useState<{
    couponCode?: string;
    discountPercentage?: string;
    subscriptionPlans?: string;
  }>({});

  const [formState, setFormState] = useState<CouponFormState>({
    id: "",
    code: "",
    discountPercent: "",
    planIds: [],
    isActive: true,
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery<AdminCoupon[]>({
    queryKey: ["/api/admin/coupons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) {
        throw new Error("Failed to fetch coupons");
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

  const sortedCoupons = useMemo(
    () =>
      (coupons || []).slice().sort((a, b) => {
        if (a.code === b.code) {
          return a.id.localeCompare(b.id);
        }
        return a.code.localeCompare(b.code);
      }),
    [coupons]
  );

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const toValidate: AdminCouponInput = {
        couponCode: formState.code,
        discountPercentage: Number(formState.discountPercent || "0"),
        subscriptionPlans: formState.planIds,
      };

      const result = adminCouponSchema.safeParse(toValidate);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setFormError({
          couponCode: fieldErrors.couponCode?.[0],
          discountPercentage: fieldErrors.discountPercentage?.[0],
          subscriptionPlans: fieldErrors.subscriptionPlans?.[0],
        });
        throw new Error("Validation failed");
      }

      setFormError({});

      const payload: any = {
        code: formState.code.trim(),
        discountPercent: result.data.discountPercentage,
        planIds: formState.planIds,
        isActive: formState.isActive,
      };

      const method = editingCoupon ? "PUT" : "POST";
      const url = editingCoupon
        ? `/api/admin/coupons/${encodeURIComponent(editingCoupon.id)}`
        : "/api/admin/coupons";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save coupon");
      }

      return data;
    },
    onSuccess: () => {
      setFormError({});
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/coupons"],
      });
      setIsFormOpen(false);
      setEditingCoupon(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!couponToDelete) return;
      const res = await fetch(
        `/api/admin/coupons/${encodeURIComponent(couponToDelete.id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete coupon");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/coupons"],
      });
      setIsDeleteOpen(false);
      setCouponToDelete(null);
    },
  });

  const openCreateForm = () => {
    setEditingCoupon(null);
    setFormState({
      id: "",
      code: "",
      discountPercent: "",
      planIds: [],
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setFormState({
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent.toString(),
      planIds: coupon.planIds || [],
      isActive: coupon.isActive,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (coupon: AdminCoupon) => {
    setCouponToDelete(coupon);
    setIsDeleteOpen(true);
  };

  const handleFormChange = (
    field: keyof CouponFormState,
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
              <CardTitle>Coupons</CardTitle>
              <CardDescription>
                View, create, edit, and delete coupon codes.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={openCreateForm}
              className={`${isFormOpen ? "hidden" : ""}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden min-h-[420px]">
            <AnimatePresence initial={false} mode="wait">
              {!isFormOpen && (
                <motion.div
                  key="coupons-table"
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                  className="space-y-4"
                >
                  {couponsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                    </div>
                  ) : sortedCoupons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No coupons found. Click &quot;Create Coupon&quot; to add
                      one.
                    </p>
                  ) : (
                    <div className="rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount %</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedCoupons.map((coupon) => {
                            const planNames =
                              coupon.planIds
                                .map((id) => {
                                  const plan = plans?.find((p) => p.id === id);
                                  return plan ? plan.name : id;
                                })
                                .join(", ") || "—";
                            return (
                              <TableRow key={coupon.id}>
                                <TableCell className="font-mono text-xs">
                                  {coupon.code}
                                </TableCell>
                                <TableCell>{coupon.discountPercent}%</TableCell>
                                <TableCell>{planNames}</TableCell>
                                <TableCell>
                                  {coupon.isActive ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs">
                                      Inactive
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditForm(coupon)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-red-600"
                                      onClick={() => openDeleteDialog(coupon)}
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
                    key="coupon-form"
                    initial={{ x: 56, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 56, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                    className="w-full ml-auto bg-card rounded-xl border shadow-sm p-6 space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {editingCoupon
                          ? "Update the coupon details below."
                          : "Fill in the details to create a new coupon."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coupon-code">Coupon Code</Label>
                        <Input
                          id="coupon-code"
                          value={formState.code}
                          onChange={(e) =>
                            handleFormChange("code", e.target.value)
                          }
                        />
                        {formError.couponCode && (
                          <p className="text-xs text-red-600">
                            {formError.couponCode}
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

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={formState.isActive}
                            onCheckedChange={(v) =>
                              handleFormChange("isActive", Boolean(v))
                            }
                          />
                          <span>Active</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                  <div className="flex justify-end gap-2 pt-4 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingCoupon(null);
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
                        : editingCoupon
                        ? "Save changes"
                        : "Create coupon"}
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
              <h2 className="text-lg font-semibold">Delete coupon</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Are you sure you want to delete the coupon
                {couponToDelete ? ` "${couponToDelete.code}"` : ""}? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setCouponToDelete(null);
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
