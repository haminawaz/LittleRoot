import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CreditCard, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Load Stripe with public key - use test key in development
const isDevelopment = import.meta.env.MODE === 'development';
const stripePublicKey = isDevelopment 
  ? import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY 
  : import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = loadStripe(stripePublicKey || '');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<{id: string; name: string; price: number} | null>(null);
  const [signupData, setSignupData] = useState<{name: string; email: string; planId: string} | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);

  useEffect(() => {
    // Retrieve plan and check if this is an upgrade
    const planData = localStorage.getItem('selectedPlan');
    const upgradeFlag = localStorage.getItem('isUpgrade');
    
    if (!planData) {
      toast({
        title: "Missing information",
        description: "Please select a plan first",
        variant: "destructive"
      });
      setLocation('/');
      return;
    }
    
    setSelectedPlan(JSON.parse(planData));
    
    // Check if this is an upgrade or new signup
    // Priority: If we have signup data, treat as new signup (even if upgrade flag exists)
    const userData = localStorage.getItem('signupData');
    const userPassword = sessionStorage.getItem('signupPassword');
    
    if (userData && userPassword) {
      // This is a new signup - clear any stale upgrade flag
      localStorage.removeItem('isUpgrade');
      setIsUpgrade(false);
      setSignupData(JSON.parse(userData));
      setPassword(userPassword);
    } else if (upgradeFlag === 'true') {
      // This is an upgrade
      setIsUpgrade(true);
    } else {
      // Missing data - can't proceed
      toast({
        title: "Missing information",
        description: "Please select a plan and complete signup first",
        variant: "destructive"
      });
      setLocation('/');
      return;
    }
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPlan) {
      return;
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
        type: 'card',
        card: cardElement,
        billing_details: isUpgrade ? {} : {
          name: signupData!.name,
          email: signupData!.email,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      let response;
      
      if (isUpgrade) {
        // Upgrade existing user's subscription
        response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: selectedPlan.id,
            paymentMethodId: paymentMethod.id,
          }),
          credentials: 'include',
        });
      } else {
        // Register new user with payment information
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: signupData!.name,
            email: signupData!.email,
            password: password,
            planId: selectedPlan.id,
            paymentMethodId: paymentMethod.id,
          }),
          credentials: 'include',
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isUpgrade ? "Failed to upgrade subscription" : "Failed to create account"));
      }

      // Clear all stored data
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('signupData');
      localStorage.removeItem('isUpgrade');
      sessionStorage.removeItem('signupPassword');

      toast({
        title: isUpgrade ? "Subscription upgraded!" : "Welcome to LittleRoot!",
        description: `Your ${selectedPlan.name} subscription is now active.`,
      });

      // Invalidate auth query to refresh user data, then navigate
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to subscription page for upgrades, dashboard for new signups
      setLocation(isUpgrade ? '/subscription' : '/dashboard');

    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Please check your card details and try again.",
        variant: "destructive"
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LittleRoot</h1>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Selected Plan</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  ${selectedPlan.price}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
              </div>
            </div>
          </div>

          {/* User Info - only show for new signups */}
          {!isUpgrade && signupData && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Account</p>
              <p className="font-medium text-gray-900 dark:text-white">{signupData.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{signupData.email}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Element */}
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
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
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
                  Pay ${selectedPlan.price}/month
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Your payment is secure and encrypted. You can cancel anytime.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
