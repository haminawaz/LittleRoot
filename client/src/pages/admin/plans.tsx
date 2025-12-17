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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Edit2, Trash2, Plus } from "lucide-react";

interface AdminSubscriptionPlan {
  id: string;
  name: string;
  priceCents: number;
  booksPerMonth: number;
  templateBooks: number;
  bonusVariations: number;
  pagesPerBook: number;
  stripePriceId: string | null;
  paypalPlanId: string | null;
  commercialRights: boolean;
  resellRights: boolean;
  allFormattingOptions: boolean;
  sortOrder: number;
  isActive: boolean;
}

type PlanFormState = {
  id: string;
  name: string;
  price: string;
  booksPerMonth: string;
  templateBooks: string;
  bonusVariations: string;
  pagesPerBook: string;
  stripePriceId: string;
  paypalPlanId: string;
  commercialRights: boolean;
  resellRights: boolean;
  allFormattingOptions: boolean;
  sortOrder: string;
  isActive: boolean;
};

export default function AdminPlans() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminSubscriptionPlan | null>(
    null
  );
  const [planToDelete, setPlanToDelete] =
    useState<AdminSubscriptionPlan | null>(null);

  const [formState, setFormState] = useState<PlanFormState>({
    id: "",
    name: "",
    price: "",
    booksPerMonth: "",
    templateBooks: "",
    bonusVariations: "",
    pagesPerBook: "24",
    stripePriceId: "",
    paypalPlanId: "",
    commercialRights: false,
    resellRights: false,
    allFormattingOptions: false,
    sortOrder: "0",
    isActive: true,
  });

  const { data: plans, isLoading } = useQuery<AdminSubscriptionPlan[]>({
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

  const sortedPlans = useMemo(
    () =>
      (plans || []).slice().sort((a, b) => {
        if (a.sortOrder === b.sortOrder) {
          return a.id.localeCompare(b.id);
        }
        return a.sortOrder - b.sortOrder;
      }),
    [plans]
  );

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        id: formState.id.trim(),
        name: formState.name.trim(),
        priceCents: Math.round(Number(formState.price || "0") * 100),
        booksPerMonth: Number(formState.booksPerMonth || "0"),
        templateBooks: Number(formState.templateBooks || "0"),
        bonusVariations: Number(formState.bonusVariations || "0"),
        pagesPerBook: Number(formState.pagesPerBook || "24"),
        stripePriceId: formState.stripePriceId.trim() || null,
        paypalPlanId: formState.paypalPlanId.trim() || null,
        commercialRights: formState.commercialRights,
        resellRights: formState.resellRights,
        allFormattingOptions: formState.allFormattingOptions,
        sortOrder: Number(formState.sortOrder || "0"),
        isActive: formState.isActive,
      };

      const method = editingPlan ? "PUT" : "POST";
      const url = editingPlan
        ? `/api/admin/subscription-plans/${encodeURIComponent(editingPlan.id)}`
        : "/api/admin/subscription-plans";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save plan");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/subscription-plans"],
      });
      setIsFormOpen(false);
      setEditingPlan(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!planToDelete) return;
      const res = await fetch(
        `/api/admin/subscription-plans/${encodeURIComponent(planToDelete.id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete plan");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/subscription-plans"],
      });
      setIsDeleteOpen(false);
      setPlanToDelete(null);
    },
  });

  const openCreateForm = () => {
    setEditingPlan(null);
    setFormState({
      id: "",
      name: "",
      price: "",
      booksPerMonth: "",
      templateBooks: "",
      bonusVariations: "",
      pagesPerBook: "24",
      stripePriceId: "",
      paypalPlanId: "",
      commercialRights: false,
      resellRights: false,
      allFormattingOptions: false,
      sortOrder: (plans?.length ?? 0).toString(),
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (plan: AdminSubscriptionPlan) => {
    setEditingPlan(plan);
    setFormState({
      id: plan.id,
      name: plan.name,
      price: (plan.priceCents / 100).toString(),
      booksPerMonth: plan.booksPerMonth.toString(),
      templateBooks: plan.templateBooks.toString(),
      bonusVariations: plan.bonusVariations.toString(),
      pagesPerBook: plan.pagesPerBook.toString(),
      stripePriceId: plan.stripePriceId || "",
      paypalPlanId: plan.paypalPlanId || "",
      commercialRights: plan.commercialRights,
      resellRights: plan.resellRights,
      allFormattingOptions: plan.allFormattingOptions,
      sortOrder: plan.sortOrder.toString(),
      isActive: plan.isActive,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (plan: AdminSubscriptionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteOpen(true);
  };

  const handleFormChange = (
    field: keyof PlanFormState,
    value: string | boolean
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
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                View, create, edit, and delete subscription plans.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={openCreateForm}
              className={`${isFormOpen ? "hidden" : ""}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden min-h-[420px]">
            <AnimatePresence initial={false} mode="wait">
              {!isFormOpen && (
                <motion.div
                  key="plans-table"
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                  className="space-y-4"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                    </div>
                  ) : sortedPlans.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No subscription plans found. Click &quot;Create Plan&quot;
                      to add one.
                    </p>
                  ) : (
                    <div className="rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Books / Month</TableHead>
                            <TableHead>Template Books</TableHead>
                            <TableHead>Bonus Variations</TableHead>
                            <TableHead>Flags</TableHead>
                            <TableHead className="w-[100px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedPlans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-mono text-xs">
                                {plan.id}
                              </TableCell>
                              <TableCell>{plan.name}</TableCell>
                              <TableCell>
                                ${(plan.priceCents / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>{plan.booksPerMonth}</TableCell>
                              <TableCell>{plan.templateBooks}</TableCell>
                              <TableCell>{plan.bonusVariations}</TableCell>
                              <TableCell>
                                <div className="flex flex-col text-xs space-y-1">
                                  {plan.commercialRights && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                      Commercial
                                    </span>
                                  )}
                                  {plan.resellRights && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                      Resell
                                    </span>
                                  )}
                                  {plan.allFormattingOptions && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                      All Formats
                                    </span>
                                  )}
                                  {!plan.isActive && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditForm(plan)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  {plan.id !== "trial" && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-red-600"
                                      onClick={() => openDeleteDialog(plan)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </motion.div>
              )}

              {isFormOpen && (
                <>
                  <motion.div
                    key="plan-form"
                    initial={{ x: 56, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 56, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                    className="w-full ml-auto bg-card rounded-xl border shadow-sm p-6 space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {editingPlan
                          ? "Edit Subscription Plan"
                          : "Create Subscription Plan"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {editingPlan
                          ? "Update the subscription plan details below."
                          : "Fill in the details to create a new subscription plan."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {!editingPlan && (
                        <div className="space-y-2">
                          <Label htmlFor="plan-id">Plan ID</Label>
                          <Input
                            id="plan-id"
                            placeholder="e.g. hobbyist, pro, reseller"
                            value={formState.id}
                            onChange={(e) =>
                              handleFormChange("id", e.target.value)
                            }
                          />
                        </div>
                      )}
                      {editingPlan && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">
                            ID: {editingPlan.id}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Name</Label>
                        <Input
                          id="plan-name"
                          value={formState.name}
                          onChange={(e) =>
                            handleFormChange("name", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan-price">
                            Price (USD / month)
                          </Label>
                          <Input
                            id="plan-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formState.price}
                            onChange={(e) =>
                              handleFormChange("price", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-books">Books per month</Label>
                          <Input
                            id="plan-books"
                            type="number"
                            min="0"
                            value={formState.booksPerMonth}
                            onChange={(e) =>
                              handleFormChange("booksPerMonth", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan-templates">Template books</Label>
                          <Input
                            id="plan-templates"
                            type="number"
                            min="0"
                            value={formState.templateBooks}
                            onChange={(e) =>
                              handleFormChange("templateBooks", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-bonus">Bonus variations</Label>
                          <Input
                            id="plan-bonus"
                            type="number"
                            min="0"
                            value={formState.bonusVariations}
                            onChange={(e) =>
                              handleFormChange(
                                "bonusVariations",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-pages">Pages per book</Label>
                          <Input
                            id="plan-pages"
                            type="number"
                            min="1"
                            value={formState.pagesPerBook}
                            onChange={(e) =>
                              handleFormChange("pagesPerBook", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stripe-price-id">
                            Stripe price ID
                          </Label>
                          <Input
                            id="stripe-price-id"
                            value={formState.stripePriceId}
                            onChange={(e) =>
                              handleFormChange("stripePriceId", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paypal-plan-id">PayPal plan ID</Label>
                          <Input
                            id="paypal-plan-id"
                            value={formState.paypalPlanId}
                            onChange={(e) =>
                              handleFormChange("paypalPlanId", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sort-order">Sort order</Label>
                          <Input
                            id="sort-order"
                            type="number"
                            value={formState.sortOrder}
                            onChange={(e) =>
                              handleFormChange("sortOrder", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Flags</Label>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={formState.commercialRights}
                                onCheckedChange={(v) =>
                                  handleFormChange(
                                    "commercialRights",
                                    Boolean(v)
                                  )
                                }
                              />
                              <span>Commercial rights</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={formState.resellRights}
                                onCheckedChange={(v) =>
                                  handleFormChange("resellRights", Boolean(v))
                                }
                              />
                              <span>Resell rights</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={formState.allFormattingOptions}
                                onCheckedChange={(v) =>
                                  handleFormChange(
                                    "allFormattingOptions",
                                    Boolean(v)
                                  )
                                }
                              />
                              <span>All formatting options</span>
                            </label>
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
                      </div>
                    </div>
                  </motion.div>
                  <div className="flex justify-end gap-2 pt-4 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingPlan(null);
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
                        : editingPlan
                        ? "Save changes"
                        : "Create plan"}
                    </Button>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan
              {planToDelete ? ` "${planToDelete.name}"` : ""}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setPlanToDelete(null);
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
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
