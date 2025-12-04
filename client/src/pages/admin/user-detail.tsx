import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  DollarSign,
  CreditCard,
  User,
  Calendar,
  FileText,
  Plus,
  Minus,
  RefreshCw,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";
import AdminLayout from "@/components/AdminLayout";

interface UserDetail extends UserType {
  stats?: {
    storiesCount: number;
    illustrationsCount: number;
  };
}

interface BillingHistory {
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    periodStart: string | null;
    periodEnd: string | null;
    invoicePdf: string | null;
    hostedInvoiceUrl: string | null;
  }>;
}

export default function AdminUserDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/users/:id");
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = params?.id;

  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsType, setCreditsType] = useState<"add" | "remove">("add");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId && isAdminAuthenticated && !adminLoading,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: billingHistory, isLoading: billingLoading } =
    useQuery<BillingHistory>({
      queryKey: [`/api/admin/users/${userId}/billing`],
      enabled: !!userId && isAdminAuthenticated && !adminLoading,
      retry: false,
      staleTime: 60000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({
      amount,
      type,
    }: {
      amount: number;
      type: "add" | "remove";
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, type }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update credits");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/users/${userId}`],
      });
      setCreditsDialogOpen(false);
      setCreditsAmount("");
      toast({
        title: "Success",
        description: "Credits updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/users/${userId}`],
      });
      setPlanDialogOpen(false);
      setNewPlan("");
      toast({
        title: "Success",
        description: "Plan changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to process refund");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/users/${userId}/billing`],
      });
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({
      subject,
      body,
    }: {
      subject: string;
      body: string;
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send email");
      }
      return response.json();
    },
    onSuccess: () => {
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailBody("");
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button onClick={() => setLocation("/admin/users")}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPlan = (plan: string | null | undefined) => {
    if (!plan) return "N/A";
    const planInfo =
      SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
    return planInfo?.name || plan;
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "canceled":
        return <Badge className="bg-gray-500">Canceled</Badge>;
      case "past_due":
        return <Badge className="bg-red-500">Past Due</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleUpdateCredits = () => {
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    updateCreditsMutation.mutate({ amount, type: creditsType });
  };

  const handleChangePlan = () => {
    if (!newPlan) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }
    changePlanMutation.mutate(newPlan);
  };

  const handleSendEmail = () => {
    if (!emailSubject || !emailBody) {
      toast({
        title: "Error",
        description: "Please fill in both subject and body",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate({ subject: emailSubject, body: emailBody });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            User Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Name
                </Label>
                <p className="text-md">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Email
                </Label>
                <p className="text-md">{user.email || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Sign-up Date
                </Label>
                <p className="text-md">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Last Updated
                </Label>
                <p className="text-md">{formatDate(user.updatedAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Email Verified
                </Label>
                <p className="text-md">
                  {user.emailVerified ? (
                    <Badge className="bg-green-500">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Not Verified</Badge>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Plan
                </Label>
                <p className="text-md">{formatPlan(user.subscriptionPlan)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Status
                </Label>
                <p className="text-md">
                  {getStatusBadge(user.subscriptionStatus)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Credits Used (This Month)
                </Label>
                <p className="text-md">
                  {user.illustrationsUsedThisMonth || 0} /{" "}
                  {user.illustrationsLimitPerMonth || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Books Used (This Month)
                </Label>
                <p className="text-md">
                  {user.booksUsedThisMonth || 0} /{" "}
                  {user.booksLimitPerMonth || 0}
                </p>
              </div>
              {user.trialEndsAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Trial Ends
                  </Label>
                  <p className="text-md">{formatDate(user.trialEndsAt)}</p>
                </div>
              )}
              {user.currentPeriodEnd && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Current Period Ends
                  </Label>
                  <p className="text-md">{formatDate(user.currentPeriodEnd)}</p>
                </div>
              )}
              {user.stripeCustomerId && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Stripe Customer ID
                  </Label>
                  <p className="text-md font-mono">{user.stripeCustomerId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Total Illustrations Generated
                </Label>
                <p className="text-3xl font-bold">
                  {user.stats?.illustrationsCount || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Total Stories Created
                </Label>
                <p className="text-3xl font-bold">
                  {user.stats?.storiesCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Payment history from Stripe</CardDescription>
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : !billingHistory?.invoices ||
              billingHistory.invoices.length === 0 ? (
              <p className="text-gray-500">No billing history available</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>
                          ${invoice.amount.toFixed(2)}{" "}
                          {invoice.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              invoice.status === "paid"
                                ? "bg-green-500"
                                : invoice.status === "open"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.periodStart && invoice.periodEnd
                            ? `${formatDate(
                                invoice.periodStart
                              )} - ${formatDate(invoice.periodEnd)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {invoice.hostedInvoiceUrl && (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline"
                            >
                              View Invoice
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Manage user account and subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => {
                  setCreditsType("add");
                  setCreditsDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Credits
              </Button>
              <Button
                onClick={() => {
                  setCreditsType("remove");
                  setCreditsDialogOpen(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Minus className="h-4 w-4" />
                Remove Credits
              </Button>
              <Button
                onClick={() => {
                  setNewPlan(user.subscriptionPlan || "");
                  setPlanDialogOpen(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Change Plan
              </Button>
              <Button
                onClick={() => refundMutation.mutate()}
                variant="outline"
                className="flex items-center gap-2"
                disabled={refundMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Refund Last Charge
              </Button>
              <Button
                onClick={() => setEmailDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Custom Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {creditsType === "add" ? "Add" : "Remove"} Credits
            </DialogTitle>
            <DialogDescription>
              {creditsType === "add"
                ? "Add available credits by reducing the used count"
                : "Remove credits by increasing the used count"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCredits}
              disabled={updateCreditsMutation.isPending}
            >
              {updateCreditsMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Change Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Select a new subscription plan for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Free 7 Day Trial</SelectItem>
                  <SelectItem value="hobbyist">
                    Hobbyist ($19.99/month)
                  </SelectItem>
                  <SelectItem value="pro">Pro ($39.99/month)</SelectItem>
                  <SelectItem value="reseller">
                    Business ($74.99/month)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={changePlanMutation.isPending}
            >
              {changePlanMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Custom Email</DialogTitle>
            <DialogDescription>Send an email to {user.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Body (HTML)</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email body (HTML supported)"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
