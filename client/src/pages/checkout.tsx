import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, CreditCard, Lock, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Load Stripe with public key - use test key in development
const isDevelopment = import.meta.env.MODE === "development";
const stripePublicKey = isDevelopment
  ? import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY
  : import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = loadStripe(stripePublicKey || "");

type SelectedPlan = {
  id: string;
  name: string;
  price: number;
  paypalPlanId?: string | null;
};

type SelectedPlanPromotion = {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
};

type SelectedPlanCoupon = {
  code: string;
  discountPercent: number;
  originalPrice: number;
  discountedPrice: number;
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [promotionInfo, setPromotionInfo] =
    useState<SelectedPlanPromotion | null>(null);
  const [couponInfo, setCouponInfo] = useState<SelectedPlanCoupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponSkipped, setCouponSkipped] = useState(false);
  const [signupData, setSignupData] = useState<{
    name: string;
    email: string;
    planId: string;
  } | null>(null);
  const [password, setPassword] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe"
  );
  const [isPromotionLoading, setIsPromotionLoading] = useState(true);

  useEffect(() => {
    // Retrieve plan and check if this is an upgrade
    const planData = localStorage.getItem("selectedPlan");
    const upgradeFlag = localStorage.getItem("isUpgrade");

    if (!planData) {
      toast({
        title: "Missing information",
        description: "Please select a plan first",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    const parsedPlan: SelectedPlan = JSON.parse(planData);
    setSelectedPlan(parsedPlan);

    (async () => {
      try {
        setIsPromotionLoading(true);
        const res = await apiRequest("GET", "/api/subscription/plans");
        const data = await res.json();

        const activePromotion = data?.promotion;
        if (
          activePromotion &&
          Array.isArray(activePromotion.planIds) &&
          activePromotion.planIds.includes(parsedPlan.id)
        ) {
          const originalPrice = parsedPlan.price;
          const discountedPrice = parseFloat(
            (
              originalPrice *
              (1 - activePromotion.discountPercent / 100)
            ).toFixed(2)
          );

          setPromotionInfo({
            originalPrice,
            discountedPrice,
            discountPercent: activePromotion.discountPercent,
          });
        } else {
          setPromotionInfo(null);
        }
      } catch (error: any) {
        console.error("Failed to load active promotion:", error);
        setPromotionInfo(null);
      } finally {
        setIsPromotionLoading(false);
      }
    })();

    // Check if this is an upgrade or new signup
    // Priority: If we have signup data, treat as new signup (even if upgrade flag exists)
    const userData = localStorage.getItem("signupData");
    const userPassword = sessionStorage.getItem("signupPassword");

    if (userData && userPassword) {
      // This is a new signup - clear any stale upgrade flag
      localStorage.removeItem("isUpgrade");
      setIsUpgrade(false);
      setSignupData(JSON.parse(userData));
      setPassword(userPassword);
    } else if (upgradeFlag === "true") {
      // This is an upgrade
      setIsUpgrade(true);
    } else {
      // Missing data - can't proceed
      toast({
        title: "Missing information",
        description: "Please select a plan and complete signup first",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [setLocation, toast]);

  const handlePayPalCreateSubscription = async (data: any, actions: any) => {
    if (!selectedPlan) {
      throw new Error("No plan selected");
    }

    if (!selectedPlan.paypalPlanId) {
      throw new Error("PayPal plan is not configured for this subscription");
    }

    return actions.subscription.create({
      plan_id: selectedPlan.paypalPlanId,
    });
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    if (!selectedPlan) {
      return;
    }

    if (promotionInfo && !couponInfo && !couponSkipped) {
      const confirmWithoutCoupon = window.confirm(
        `You have an active promotion for this plan. If you do not enter the coupon code, you will be charged $${selectedPlan.price.toFixed(
          2
        )}. Continue without coupon?`
      );
      if (!confirmWithoutCoupon) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: "paypal",
          subscriptionId: data.subscriptionID,
          planId: selectedPlan.id,
          isUpgrade,
          ...(isUpgrade
            ? {}
            : {
                name: signupData!.name,
                email: signupData!.email,
                password: password,
              }),
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to process PayPal payment"
        );
      }

      localStorage.removeItem("selectedPlan");
      localStorage.removeItem("signupData");
      localStorage.removeItem("isUpgrade");
      sessionStorage.removeItem("signupPassword");

      toast({
        title: isUpgrade ? "Subscription upgraded!" : "Welcome to LittleRoot!",
        description: `Your ${selectedPlan.name} subscription is now active.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation(isUpgrade ? "/subscription" : "/dashboard");
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error("PayPal error:", err);
    toast({
      title: "Payment error",
      description: "An error occurred with PayPal. Please try again.",
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPlan) {
      return;
    }

    if (promotionInfo && !couponInfo && !couponSkipped) {
      const confirmWithoutCoupon = window.confirm(
        `You have an active promotion for this plan. If you do not enter the coupon code, you will be charged $${selectedPlan.price.toFixed(
          2
        )}. Continue without coupon?`
      );
      if (!confirmWithoutCoupon) {
        return;
      }
    }

    // For new signup, we need signup data
    if (!isUpgrade && !signupData) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method (token) from card details
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: isUpgrade
          ? {}
          : {
              name: signupData!.name,
              email: signupData!.email,
            },
      });

      if (error) {
        throw new Error(error.message);
      }

      const response = await fetch("/api/payment/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: "stripe",
          planId: selectedPlan.id,
          paymentMethodId: paymentMethod.id,
          couponCode: couponInfo?.code,
          isUpgrade,
          ...(isUpgrade
            ? {}
            : {
                name: signupData!.name,
                email: signupData!.email,
                password: password,
              }),
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            (isUpgrade
              ? "Failed to upgrade subscription"
              : "Failed to create account")
        );
      }

      // Clear all stored data
      localStorage.removeItem("selectedPlan");
      localStorage.removeItem("signupData");
      localStorage.removeItem("isUpgrade");
      sessionStorage.removeItem("signupPassword");

      toast({
        title: isUpgrade ? "Subscription upgraded!" : "Welcome to LittleRoot!",
        description: `Your ${selectedPlan.name} subscription is now active.`,
      });

      // Invalidate auth query to refresh user data, then navigate
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Navigate to subscription page for upgrades, dashboard for new signups
      setLocation(isUpgrade ? "/subscription" : "/dashboard");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description:
          error.message || "Please check your card details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPlan || (!isUpgrade && !signupData)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LittleRoot
            </h1>
          </div>
          <CardTitle className="text-2xl">Complete Your Purchase</CardTitle>
          <CardDescription>
            Enter your payment details to activate your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Plan Summary */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected Plan
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPlan.name}
                </p>
              </div>
              <div className="text-right">
                {couponInfo ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-500 line-through">
                      ${couponInfo.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${couponInfo.discountedPrice.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    ${selectedPlan.price.toFixed(2)}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  per month
                </p>
              </div>
            </div>
          </div>

          {isPromotionLoading && (
            <div className="text-center mb-4 text-md font-medium text-gray-500 dark:text-gray-400">
              Checking available promotions...
            </div>
          )}

          {couponInfo && (
            <div className="text-center mb-4 text-md font-medium text-green-700 dark:text-green-400">
              Coupon <span className="font-semibold">{couponInfo.code}</span>{" "}
              applied – {couponInfo.discountPercent}% off.
            </div>
          )}

          {!isPromotionLoading &&
            promotionInfo &&
            !couponSkipped &&
            !couponInfo && (
              <div className="mb-6 space-y-2 rounded-lg border border-dashed border-purple-300 bg-purple-50/60 p-3 text-sm dark:border-purple-700 dark:bg-purple-950/30">
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  Enter coupon code to get {promotionInfo.discountPercent}% off
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    ${selectedPlan.price.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    ${promotionInfo.discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      if (couponError) setCouponError(null);
                    }}
                  />
                  {couponError && (
                    <p className="text-xs text-red-500">{couponError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isValidatingCoupon}
                      onClick={async () => {
                        if (!couponCode.trim()) {
                          setCouponError("Please enter a coupon code.");
                          return;
                        }

                        if (!selectedPlan) return;

                        setIsValidatingCoupon(true);
                        setCouponError(null);
                        try {
                          const res = await apiRequest(
                            "POST",
                            "/api/subscription/validate-coupon",
                            {
                              planId: selectedPlan.id,
                              couponCode: couponCode.trim(),
                            }
                          );
                          const data = await res.json();

                          const original = selectedPlan.price;
                          const discounted = parseFloat(
                            (
                              original *
                              (1 - data.discountPercent / 100)
                            ).toFixed(2)
                          );

                          const appliedCoupon = {
                            code: data.couponCode,
                            discountPercent: data.discountPercent,
                            originalPrice: original,
                            discountedPrice: discounted,
                          };

                          setCouponInfo(appliedCoupon);
                          setCouponSkipped(false);
                        } catch (error: any) {
                          setCouponInfo(null);
                          setCouponError(error.message || "Code is not valid");
                        } finally {
                          setIsValidatingCoupon(false);
                        }
                      }}
                    >
                      {isValidatingCoupon ? "Applying..." : "Apply & continue"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCouponSkipped(true);
                        setCouponInfo(null);
                        setCouponError(null);
                      }}
                    >
                      Skip coupon
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* User Info - only show for new signups */}
          {!isUpgrade && signupData && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {signupData.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {signupData.email}
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all ${
                  paymentMethod === "stripe"
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all ${
                  paymentMethod === "paypal"
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span className="font-medium">PayPal</span>
              </button>
            </div>
          </div>

          {paymentMethod === "stripe" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Card Information
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424770",
                          "::placeholder": {
                            color: "#aab7c4",
                          },
                        },
                        invalid: {
                          color: "#9e2146",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!stripe || isProcessing}
                data-testid="button-complete-payment"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay $
                    {couponInfo
                      ? couponInfo.discountedPrice.toFixed(2)
                      : selectedPlan.price.toFixed(2)}
                    /month
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Your payment is secure and encrypted. You can cancel anytime.
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <PayPalButtons
                createSubscription={handlePayPalCreateSubscription}
                onApprove={handlePayPalApprove}
                onError={handlePayPalError}
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "paypal",
                }}
              />
              {isProcessing && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Processing your payment...
                </p>
              )}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Your payment is secure and encrypted. You can cancel anytime.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Checkout() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb";

  return (
    <Elements stripe={stripePromise}>
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId,
          currency: "USD",
          intent: "subscription",
          vault: true,
        }}
      >
        <CheckoutForm />
      </PayPalScriptProvider>
    </Elements>
  );
}
