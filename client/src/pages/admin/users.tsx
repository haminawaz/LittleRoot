import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  UserCog,
  X,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import type { User } from "@shared/schema";
import AdminHeader from "@/components/AdminHeader";

interface UsersResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", search, planFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (planFilter !== "all") params.append("plan", planFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", limit.toString());
      params.append("offset", (page * limit).toString());

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      return res.json();
    },
    enabled: isAdminAuthenticated && !adminLoading,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const getLastSeen = (user: User) => {
    return user.updatedAt || user.createdAt;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>{total} total users</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={planFilter}
                onValueChange={(value) => {
                  setPlanFilter(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="hobbyist">Hobbyist</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="reseller">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Credits (This Month)</TableHead>
                        <TableHead>Sign-up Date</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ""} ${
                                  user.lastName || ""
                                }`.trim()
                              : "N/A"}
                          </TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{formatPlan(user.subscriptionPlan)}</span>
                              {getStatusBadge(user.subscriptionStatus)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.illustrationsUsedThisMonth || 0} /{" "}
                            {user.illustrationsLimitPerMonth || 0}
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>{formatDate(getLastSeen(user))}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setLocation(`/admin/users/${user.id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setLocation(
                                      `/admin/users/${user.id}?edit=true`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Implement impersonation
                                    console.log("Impersonate user", user.id);
                                  }}
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Impersonate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Implement cancel subscription
                                    console.log("Cancel subscription", user.id);
                                  }}
                                  className="text-orange-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Implement refund
                                    console.log("Refund", user.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Refund
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Showing {page * limit + 1} to{" "}
                      {Math.min((page + 1) * limit, total)} of {total} users
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
