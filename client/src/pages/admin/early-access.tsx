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
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Mail, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface EarlyAccessSignup {
  id: string;
  email: string;
  code: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface EarlyAccessResponse {
  signups: EarlyAccessSignup[];
  pagination: PaginationInfo;
}

export default function AdminEarlyAccess() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const { data, isLoading: signupsLoading } = useQuery<EarlyAccessResponse>({
    queryKey: ["/api/admin/early-access-signups", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/early-access-signups?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch signups");
      }
      return response.json();
    },
    enabled: isAdminAuthenticated,
    retry: false,
  });

  const signups = data?.signups || [];
  const pagination = data?.pagination;

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  const formatDate = (dateString: string) => {
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
      const response = await fetch(
        "/api/admin/early-access-signups?page=1&limit=10000"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch all signups");
      }
      const data: EarlyAccessResponse = await response.json();
      const allSignups = data.signups;

      if (!allSignups || allSignups.length === 0) return;

      const headers = ["Email", "Code", "Signed Up"];
      const rows = allSignups.map((signup) => [
        signup.email,
        signup.code,
        formatDate(signup.createdAt),
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
        `early-access-signups-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const showPageNumbers = pagination.totalPages > 1;
    const pages = [];

    if (showPageNumbers) {
      const maxVisiblePages = 7;
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

          {showPageNumbers && (
            <>
              {pages[0] > 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(1);
                      }}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {pages[0] > 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {pages.map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                    isActive={pageNum === page}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {pages[pages.length - 1] < pagination.totalPages && (
                <>
                  {pages[pages.length - 1] < pagination.totalPages - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pagination.totalPages);
                      }}
                      className="cursor-pointer"
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
            </>
          )}

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

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>Early Access Signups</CardTitle>
            </div>
            {pagination && pagination.total > 0 && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
          <CardDescription>
            View all users who signed up for early access{" "}
            {pagination && `(${pagination.total} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : signups && signups.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Signed Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {signup.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 font-mono">
                          {signup.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(signup.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No early access signups yet.
            </p>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page:
              </Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger id="rows-per-page" className="w-[100px]">
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
              Showing {signups.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
              early access users
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
