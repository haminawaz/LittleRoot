import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface AdminPromotion {
  id: string;
  couponCode: string;
  discountPercent: number;
  banner: string;
}

interface AdminMeResponse {
  id: string;
  email: string;
  promotionId: string | null;
}

export default function AdminSettings() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isPromotionEnabled, setIsPromotionEnabled] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
    null
  );
  const [initialPromotionId, setInitialPromotionId] = useState<string | null>(
    null
  );
  const [isEditingPromotion, setIsEditingPromotion] = useState(false);

  const { data: adminMe, isLoading: adminMeLoading } =
    useQuery<AdminMeResponse>({
      queryKey: ["/api/admin/me"],
      queryFn: async () => {
        const res = await fetch("/api/admin/me");
        if (!res.ok) {
          throw new Error("Failed to fetch admin info");
        }
        return res.json();
      },
      enabled: isAdminAuthenticated,
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

  useEffect(() => {
    if (adminMe) {
      const currentPromotionId = adminMe.promotionId ?? null;
      setInitialPromotionId(currentPromotionId);
      setSelectedPromotionId(currentPromotionId);
      setIsPromotionEnabled(Boolean(currentPromotionId));
      setIsEditingPromotion(false);
    }
  }, [adminMe]);

  const isDirty = useMemo(() => {
    if (!adminMe) return false;

    const currentTargetId = isPromotionEnabled ? selectedPromotionId : null;
    return currentTargetId !== initialPromotionId;
  }, [adminMe, isPromotionEnabled, selectedPromotionId, initialPromotionId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetPromotionId = isPromotionEnabled ? selectedPromotionId : null;

      if (isPromotionEnabled && !targetPromotionId) {
        throw new Error("Please select a promotion or disable the toggle.");
      }

      const res = await fetch("/api/admin/settings/promotion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ promotionId: targetPromotionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save promotion settings");
      }

      return data;
    },
    onSuccess: async () => {
      const targetPromotionId = isPromotionEnabled ? selectedPromotionId : null;
      setInitialPromotionId(targetPromotionId);
      setIsEditingPromotion(false);

      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });

      toast({
        title: "Settings saved",
        description: "Promotion settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (adminLoading || !isAdminAuthenticated || adminMeLoading) {
    return null;
  }

  const handleToggleChange = (checked: boolean) => {
    setIsPromotionEnabled(checked);
    if (!checked) {
      setSelectedPromotionId(null);
      setIsEditingPromotion(false);
    } else if (!selectedPromotionId && promotions && promotions.length > 0) {
      setSelectedPromotionId(promotions[0].id);
      setIsEditingPromotion(true);
    } else {
      setIsEditingPromotion(true);
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure global settings, promotions, and announcements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Promotion</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a promotion to highlight across the admin experience.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="promotion-toggle" className="text-sm">
                  Enable promotion
                </Label>
                <Switch
                  id="promotion-toggle"
                  checked={isPromotionEnabled}
                  onCheckedChange={handleToggleChange}
                />
              </div>
            </div>

            {isPromotionEnabled && (
              <div className="mt-4 space-y-3 border rounded-lg p-4 bg-muted/40">
                {promotionsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading promotions...
                  </p>
                ) : !promotions || promotions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No promotions available. Create one in the Promotions page
                    first.
                  </p>
                ) : isEditingPromotion ? (
                  <RadioGroup
                    value={selectedPromotionId ?? ""}
                    onValueChange={(value) =>
                      setSelectedPromotionId(value || null)
                    }
                    className="space-y-2"
                  >
                    {promotions.map((promotion) => (
                      <label
                        key={promotion.id}
                        className="flex items-start gap-3 rounded-md border bg-background/80 px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <RadioGroupItem value={promotion.id} className="mt-1" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {promotion.couponCode}
                            </span>
                            <span className="text-xs rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              {promotion.discountPercent}% off
                            </span>
                          </div>
                          <p
                            className="text-xs text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: promotion.banner,
                            }}
                          />
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <>
                    {(() => {
                      const currentId =
                        selectedPromotionId ?? initialPromotionId;
                      const currentPromotion = promotions.find(
                        (p) => p.id === currentId
                      );

                      if (!currentPromotion) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No promotion selected. Click &quot;Change
                            promotion&quot; to choose one.
                          </p>
                        );
                      }

                      return (
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {currentPromotion.couponCode}
                              </span>
                              <span className="text-xs rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                {currentPromotion.discountPercent}% off
                              </span>
                            </div>
                            <p
                              className="text-xs text-muted-foreground line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: currentPromotion.banner,
                              }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingPromotion(true)}
                          >
                            Change promotion
                          </Button>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t mt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!isDirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
