import { Link, useLocation } from "wouter";
import {
  BookOpen,
  LogOut,
  Crown,
  CreditCard,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserWithSubscriptionInfo } from "@shared/schema";
import { SUBSCRIPTION_PLANS } from "@shared/schema";

interface HeaderProps {
  onHomeClick?: () => void;
  onMyBooksClick?: () => void;
  viewMode?: "create" | "my-books";
}

export default function Header({
  onHomeClick,
  onMyBooksClick,
  viewMode,
}: HeaderProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isDashboard = location === "/dashboard";

  const { data: userWithSubscription, isLoading: userLoading } =
    useQuery<UserWithSubscriptionInfo>({
      queryKey: ["/api/auth/user"],
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout");
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.clear();
      if (data.logoutUrl) {
        window.location.href = data.logoutUrl;
      } else {
        setLocation("/home");
      }
    },
  });

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return isDashboard && viewMode === "create";
    }
    if (path === "/dashboard/my-books") {
      return isDashboard && viewMode === "my-books";
    }
    return location === path || location.startsWith(path + "/");
  };

  const isMyBooksActive = () => {
    return isDashboard && viewMode === "my-books";
  };

  const handleMyBooksClick = () => {
    if (isDashboard && onMyBooksClick) {
      onMyBooksClick();
    } else {
      setLocation("/dashboard?view=my-books");
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between h-16 px-6">
          {isDashboard && onHomeClick ? (
            <button
              onClick={onHomeClick}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
              data-testid="button-home"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold">LittleRoot</h1>
                <p className="text-xs text-muted-foreground">
                  Children's Book Creator
                </p>
              </div>
            </button>
          ) : (
            <Link href="/dashboard">
              <button className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-serif font-bold">LittleRoot</h1>
                  <p className="text-xs text-muted-foreground">
                    Children's Book Creator
                  </p>
                </div>
              </button>
            </Link>
          )}

          <nav className="hidden md:flex items-center space-x-6">
            {isDashboard && onHomeClick ? (
              <button
                onClick={onHomeClick}
                className={`text-sm font-medium transition-colors ${
                  viewMode === "create"
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-nav-home"
              >
                Home
              </button>
            ) : (
              <Link href="/dashboard">
                <button
                  className={`text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "text-primary font-semibold"
                      : "text-foreground hover:text-primary"
                  }`}
                  data-testid="button-nav-home"
                >
                  Home
                </button>
              </Link>
            )}

            {isDashboard && onMyBooksClick ? (
              <button
                onClick={onMyBooksClick}
                className={`text-sm font-medium transition-colors ${
                  viewMode === "my-books"
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-my-books"
              >
                My Books
              </button>
            ) : (
              <button
                onClick={handleMyBooksClick}
                className={`text-sm font-medium transition-colors ${
                  isMyBooksActive()
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-my-books"
              >
                My Books
              </button>
            )}

            <Link href="/dashboard/template-books">
              <button
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard/template-books")
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-templates"
              >
                Templates
              </button>
            </Link>

            <Link href="/help">
              <button
                className={`text-sm font-medium transition-colors ${
                  isActive("/help")
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-help"
              >
                Help
              </button>
            </Link>

            <Link href="/faq">
              <button
                className={`text-sm font-medium transition-colors ${
                  isActive("/faq")
                    ? "text-primary font-semibold"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="button-faq"
              >
                FAQ
              </button>
            </Link>
          </nav>

          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0"
                    data-testid="button-user-avatar"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {userLoading
                          ? "U"
                          : userWithSubscription?.firstName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            userWithSubscription?.email
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            "U"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64"
                  align="end"
                  forceMount
                  data-testid="dropdown-user-menu"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {userLoading ? (
                        <>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        </>
                      ) : userWithSubscription ? (
                        <>
                          <p
                            className="text-sm font-medium leading-none"
                            data-testid="text-user-name"
                          >
                            {userWithSubscription.firstName &&
                            userWithSubscription.lastName
                              ? `${userWithSubscription.firstName} ${userWithSubscription.lastName}`
                              : userWithSubscription.firstName || "User"}
                          </p>
                          <p
                            className="text-xs leading-none text-muted-foreground"
                            data-testid="text-user-email"
                          >
                            {userWithSubscription.email || ""}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium leading-none">
                            User
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            Loading...
                          </p>
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <div
                      className="flex items-center space-x-2"
                      data-testid="text-account-type"
                    >
                      <Crown className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Account Type
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userLoading ? (
                            <div className="h-3 bg-muted rounded animate-pulse w-20" />
                          ) : userWithSubscription?.subscriptionPlan ? (
                            SUBSCRIPTION_PLANS[
                              userWithSubscription.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS
                            ]?.name || "Free Trial"
                          ) : (
                            "Loading..."
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setLocation("/subscription")}
                    className="cursor-pointer"
                    data-testid="link-manage-subscription"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/settings")}
                    className="cursor-pointer"
                    data-testid="link-settings"
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
