import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, CreditCard, Check, Crown, AlertCircle, BookOpen, Sparkles, Shield, FileText, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { UserWithSubscriptionInfo } from "@shared/schema";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get user subscription data - always refetch to show latest illustration/book counts
  const { data: user, isLoading } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
    refetchOnMount: "always",
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/cancel");
      return response;
    },
    onSuccess: () => {
      // Invalidate user query to refresh subscription status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of your current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const getPlanDetails = (planId: string) => {
    const plans: any = SUBSCRIPTION_PLANS;
    return plans[planId] || plans.trial;
  };

  const currentPlan = user?.subscriptionPlan ? getPlanDetails(user.subscriptionPlan) : null;
  const isTrial = user?.subscriptionPlan === 'trial';

  const handleChoosePlan = (planId: string, planName: string, planPrice: number) => {
    // Save plan details to localStorage (same as landing page flow)
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: planId,
      name: planName,
      price: planPrice
    }));
    
    // Clear any stale signup data from abandoned previous signups
    localStorage.removeItem('signupData');
    sessionStorage.removeItem('signupPassword');
    
    // Mark this as an upgrade (not a new signup)
    localStorage.setItem('isUpgrade', 'true');
    
    // Redirect to checkout page
    setLocation('/checkout');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Manage Subscription</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Trial Warning */}
            {isTrial && user?.daysLeftInTrial !== undefined && user.daysLeftInTrial <= 3 && (
              <Alert data-testid="alert-trial-ending">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your free trial ends in {user.daysLeftInTrial} {user.daysLeftInTrial === 1 ? 'day' : 'days'}. 
                  Upgrade now to continue creating beautiful children's books!
                </AlertDescription>
              </Alert>
            )}

            {/* Current Plan */}
            <Card data-testid="card-current-plan">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      Current Plan
                    </CardTitle>
                    <CardDescription>
                      Your active subscription details
                    </CardDescription>
                  </div>
                  <Badge variant={isTrial ? "secondary" : "default"} data-testid="badge-plan-name">
                    {currentPlan?.name || "Free Trial"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isTrial ? "Books per Month" : "Illustrations per Month"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-books-limit">
                      {isTrial ? (user?.booksLimitPerMonth || 0) : (user?.illustrationsLimitPerMonth || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isTrial ? "Books Used" : "Illustrations Used"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-books-used">
                      {isTrial ? (user?.booksUsedThisMonth || 0) : (user?.illustrationsUsedThisMonth || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isTrial ? "Books Remaining" : "Illustrations Remaining"}
                    </p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-books-remaining">
                      {isTrial 
                        ? (user?.booksLimitPerMonth || 0) - (user?.booksUsedThisMonth || 0)
                        : (user?.illustrationsLimitPerMonth || 0) - (user?.illustrationsUsedThisMonth || 0)
                      }
                    </p>
                  </div>
                </div>

                {/* Plan Features Section - Professional Redesign */}
                  <div className="pt-6 border-t border-border space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-lg">Your Plan Features</h3>
                    </div>

                    {/* Usage Cards with Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Template Books</p>
                            <p className="text-2xl font-bold">
                              {user?.templateBooksRemaining || 0}
                              <span className="text-sm text-muted-foreground font-normal"> / {user?.templateBooksLimit || 0}</span>
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={((user?.templateBooksLimit || 0) - (user?.templateBooksRemaining || 0)) / (user?.templateBooksLimit || 1) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {user?.templateBooksLimit && user?.templateBooksRemaining ? 
                            `${((user.templateBooksLimit - user.templateBooksRemaining) / user.templateBooksLimit * 100).toFixed(0)}% used` : 
                            "0% used"}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Bonus Variations</p>
                            <p className="text-2xl font-bold">
                              {user?.bonusVariationsUsed || 0}
                              <span className="text-sm text-muted-foreground font-normal"> / {user?.bonusVariationsLimit || 0}</span>
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={((user?.bonusVariationsLimit || 0) - (user?.bonusVariationsRemaining || 0)) / (user?.bonusVariationsLimit || 1) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {user?.bonusVariationsLimit && user?.bonusVariationsRemaining ? 
                            `${((user.bonusVariationsLimit - user.bonusVariationsRemaining) / user.bonusVariationsLimit * 100).toFixed(0)}% used` : 
                            "0% used"}
                        </p>
                      </motion.div>
                    </div>

                    {/* Included Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">Up to 24 Pages Per Book</span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">All Art Styles</span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">Character Consistency</span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">PDF Export</span>
                      </motion.div>

                      {/* Commercial Rights Badge */}
                      {user?.hasCommercialRights ? (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors md:col-span-2"
                        >
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm font-medium">
                            {user?.hasResellRights ? "Commercial Rights + Resell Rights" : "Commercial Rights (Personal Publishing)"}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                          className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/30 md:col-span-2"
                        >
                          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-sm text-muted-foreground">No commercial rights · Upgrade for commercial use</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                {!isTrial && (
                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          ${currentPlan?.price || 0}/month
                        </span>
                      </div>
                      {user?.subscriptionStatus && (
                        <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'} data-testid="badge-subscription-status">
                          {user.subscriptionStatus}
                        </Badge>
                      )}
                    </div>

                    {/* Cancel Subscription Button */}
                    {user?.subscriptionStatus === 'active' && !user?.cancelAtPeriodEnd && user?.stripeSubscriptionId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-muted-foreground hover:text-destructive hover:border-destructive"
                            data-testid="button-cancel-subscription"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-testid="dialog-cancel-subscription">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your subscription will remain active until the end of your current billing period. 
                              You'll continue to have access to all features until then, but you won't be charged again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-dialog">Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => cancelSubscriptionMutation.mutate()}
                              disabled={cancelSubscriptionMutation.isPending}
                              className="bg-destructive hover:bg-destructive/90"
                              data-testid="button-confirm-cancel"
                            >
                              {cancelSubscriptionMutation.isPending ? "Canceling..." : "Yes, Cancel"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Show message if subscription is set to cancel */}
                    {user?.cancelAtPeriodEnd && (
                      <Alert data-testid="alert-subscription-canceling">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription will be canceled at the end of your current billing period. 
                          You can continue to use all features until then.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {isTrial && user?.daysLeftInTrial !== undefined && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-trial-days">
                        {user.daysLeftInTrial} {user.daysLeftInTrial === 1 ? 'day' : 'days'} remaining in trial
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Plans */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {isTrial ? "Upgrade Your Plan" : "Other Available Plans"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Hobbyist Plan */}
                <Card className={`${user?.subscriptionPlan === 'hobbyist' ? 'border-violet-600 border-[3px]' : 'border-violet-500 border-2'} bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group`} data-testid="card-plan-hobbyist">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600"></div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Hobbyist</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-violet-600">$19.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">144 Illustrations (6+ Books)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">3 Template Books</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Up to 24 Pages Each</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">10 Bonus Illustration Variations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Full Commercial Rights (personal publishing)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">PDF Export</span>
                      </li>
                    </ul>
                    {user?.subscriptionPlan === 'hobbyist' ? (
                      <Badge variant="default" className="w-full justify-center py-2">Current Plan</Badge>
                    ) : (
                      <Button 
                        className="w-full shadow-md hover:shadow-lg transition-all duration-300" 
                        onClick={() => handleChoosePlan('hobbyist', 'Hobbyist', 19.99)}
                        data-testid="button-upgrade-hobbyist"
                      >
                        Choose Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className={`${user?.subscriptionPlan === 'pro' ? 'border-purple-600 border-[3px]' : 'border-purple-500 border-2'} bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group`} data-testid="card-plan-pro">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"></div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Pro</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-purple-600">$39.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">360 Illustrations (15+ Books)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">15 Template Books</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Up to 24 Pages Each</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">25 Bonus Illustration Variations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Full Commercial Rights (publishing & selling)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">PDF Export</span>
                      </li>
                    </ul>
                    {user?.subscriptionPlan === 'pro' ? (
                      <Badge variant="default" className="w-full justify-center py-2">Current Plan</Badge>
                    ) : (
                      <Button 
                        className="w-full shadow-md hover:shadow-lg transition-all duration-300" 
                        onClick={() => handleChoosePlan('pro', 'Pro', 39.99)}
                        data-testid="button-upgrade-pro"
                      >
                        Choose Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Business Plan */}
                <Card className={`${user?.subscriptionPlan === 'reseller' ? 'border-orange-600 border-[3px]' : 'border-orange-500 border-2'} bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group`} data-testid="card-plan-reseller">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Business</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-orange-600">$74.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">600 Illustrations (25+ Books)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">30 Template Books</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Up to 24 Pages Each</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">75 Bonus Illustration Variations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">Full Commercial Rights (publishing & selling)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">PDF Export</span>
                      </li>
                    </ul>
                    {user?.subscriptionPlan === 'reseller' ? (
                      <Badge variant="default" className="w-full justify-center py-2">Current Plan</Badge>
                    ) : (
                      <Button 
                        className="w-full shadow-md hover:shadow-lg transition-all duration-300" 
                        onClick={() => handleChoosePlan('reseller', 'Business', 74.99)}
                        data-testid="button-upgrade-reseller"
                      >
                        Choose Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Billing Information - Only for paid plans */}
            {!isTrial && (
              <Card data-testid="card-billing-info">
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                  <CardDescription>
                    Manage your payment method and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Payment Method</p>
                        <p className="text-sm text-muted-foreground">
                          Managed through Stripe
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" disabled data-testid="button-update-payment">
                      Update Payment
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment management coming soon. Contact support for billing changes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
