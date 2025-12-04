import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingUp, UserPlus, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface DashboardAnalytics {
  mrr: number;
  arr: number;
  newSignups: { last7Days: number };
  activeTrials: number;
  churnedLast30Days: number;
  illustrationsThisMonth: number;
}

export default function AdminDashboard() {
  const { isAdminAuthenticated, adminLoading } = useAuth();

  const { data: analytics, isLoading: analyticsLoading } =
    useQuery<DashboardAnalytics>({
      queryKey: ["/api/admin/dashboard"],
      enabled: isAdminAuthenticated,
      retry: false,
    });

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      {analyticsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Recurring Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {analytics?.mrr.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  From active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Sign-ups
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.newSignups.last7Days || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Trials
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activeTrials || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Illustrations Generated
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.illustrationsThisMonth || 0}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Annual Recurring Revenue</CardTitle>
                <CardDescription>ARR calculation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  $
                  {analytics?.arr.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churned Users</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.churnedLast30Days || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
