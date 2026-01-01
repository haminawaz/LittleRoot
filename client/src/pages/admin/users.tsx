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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  ArrowUpDown,
  Eye,
  Trash2,
  Shield,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  subscriptionPlan: string;
  subscriptionProvider: string;
  subscriptionStatus: string;
  booksUsedThisMonth: number;
  booksLimitPerMonth: number;
  illustrationsUsedThisMonth: number;
  illustrationsLimitPerMonth: number;
  templateBooksUsed: number;
  templateBooksLimit: number;
  createdAt: string;
  lastPaymentDate: string | null;
  stripeCustomerId: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export default function AdminUsers() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  // Query
  const { data, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: [
      "/api/admin/users",
      page,
      limit,
      debouncedSearch,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: isAdminAuthenticated,
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteOpen(false);
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
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

  // Handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch("/api/admin/users?page=1&limit=10000");
      if (!response.ok) {
        throw new Error("Failed to fetch all users");
      }
      const data: UsersResponse = await response.json();
      const allUsers = data.users;

      if (!allUsers || allUsers.length === 0) return;

      const headers = [
        "ID",
        "Email",
        "First Name",
        "Last Name",
        "Plan",
        "Status",
        "Joined",
      ];
      const rows = allUsers.map((user) => [
        user.id,
        user.email,
        user.firstName || "",
        user.lastName || "",
        user.subscriptionPlan,
        user.subscriptionStatus,
        formatDate(user.createdAt),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const showPageNumbers = pagination.totalPages > 1;
    const pages = [];

    if (showPageNumbers) {
      const maxVisiblePages = 5;
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(
        pagination.totalPages,
        startPage + maxVisiblePages - 1
      );

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (pagination.hasPrevPage) {
                  setPage(page - 1);
                }
              }}
              className={
                !pagination.hasPrevPage
                  ? "pointer-events-none opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {showPageNumbers &&
            pages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNum);
                  }}
                  isActive={pageNum === page}
                  className="cursor-pointer">
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (pagination.hasNextPage) {
                  setPage(page + 1);
                }
              }}
              className={
                !pagination.hasNextPage
                  ? "pointer-events-none opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const getSubscriptionBadgeVariant = (amount: string, status: string) => {
    if (status === "active") return "default";
    if (status === "past_due") return "destructive";
    if (status === "canceled") return "secondary";
    return "outline";
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case "trial":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200";
      case "hobbyist":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200";
      case "pro":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200";
      case "reseller":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200";
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200"; // Fallback for status-like usage if any
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-100/80 border-slate-200";
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <CardTitle>Users</CardTitle>
            </div>
          </div>
          <CardDescription>
            Manage users, view details, and monitor usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {pagination && pagination.total > 0 && (
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : users && users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("firstName")}>
                      <div className="flex items-center gap-1">
                        First Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("lastName")}>
                      <div className="flex items-center gap-1">
                        Last Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1">
                        Email
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("subscriptionPlan")}>
                      <div className="flex items-center gap-1">
                        Plan
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="hidden md:table-cell cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center gap-1">
                        Joined
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName || "-"}</TableCell>
                      <TableCell>{user.lastName || "-"}</TableCell>
                      <TableCell>
                        <span className="text-xs">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPlanBadgeColor(user.subscriptionPlan)}>
                          {user.subscriptionPlan}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(user)}
                            title="View Details">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                            title="Delete User">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/10">
              <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No users found
              </h3>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page:
              </Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger id="rows-per-page" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pagination && <div className="mt-6">{renderPagination()}</div>}
          </div>

          {pagination && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
              users
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <ScrollArea className="max-h-[80vh]">
              <div className="space-y-6 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <Shield className="h-4 w-4" />
                    Account Info
                  </div>
                  <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        First Name
                      </div>
                      <div className="font-medium">
                        {selectedUser.firstName ?? "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Last Name
                      </div>
                      <div className="font-medium">
                        {selectedUser.lastName ?? "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div
                        className="font-medium truncate"
                        title={selectedUser.email}>
                        {selectedUser.email ?? "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Joined
                      </div>
                      <div className="font-medium">
                        {formatDate(selectedUser.createdAt ?? "-")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <Calendar className="h-4 w-4" />
                    Subscription
                  </div>
                  <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Current Plan
                      </div>
                      <div className="font-medium text-lg capitalize">
                        {selectedUser.subscriptionPlan ?? "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Current Status
                      </div>
                      <Badge
                        className="capitalize"
                        variant={
                          selectedUser.subscriptionStatus === "active"
                            ? "default"
                            : "secondary"
                        }>
                        {selectedUser.subscriptionStatus}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Current Provider
                      </div>
                      <div className="font-medium text-lg capitalize">
                        {selectedUser.subscriptionProvider ?? "-"}
                      </div>
                    </div>
                    {selectedUser.stripeCustomerId && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Stripe Customer ID
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {selectedUser.stripeCustomerId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <BookOpen className="h-4 w-4" />
                    Monthly Usage
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Books</span>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedUser.booksUsedThisMonth}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          / {selectedUser.booksLimitPerMonth}
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full mt-2">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (selectedUser.booksUsedThisMonth /
                                (selectedUser.booksLimitPerMonth || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Illustrations
                        </span>
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedUser.illustrationsUsedThisMonth}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          / {selectedUser.illustrationsLimitPerMonth}
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full mt-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (selectedUser.illustrationsUsedThisMonth /
                                (selectedUser.illustrationsLimitPerMonth ||
                                  1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Templates</span>
                        <BookOpen className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedUser.templateBooksUsed}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          / {selectedUser.templateBooksLimit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user
              <span className="font-semibold text-foreground">
                {" "}
                {userToDelete?.email}{" "}
              </span>
              and all of their data including stories, images, and subscription
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
