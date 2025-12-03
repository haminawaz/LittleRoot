// Based on javascript_log_in_with_replit integration
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isAdminRoute,
    retry: false,
  });

  const { data: admin, isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdminRoute,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdminAuthenticated: !!admin,
    admin,
    adminLoading,
  };
}