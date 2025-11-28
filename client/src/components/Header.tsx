import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  BookOpen,
  LogOut,
  Crown,
  CreditCard,
  Settings as SettingsIcon,
  Menu,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex items-center justify-between h-16 px-3 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0">
            {isDashboard && onHomeClick ? (
              <button
                onClick={onHomeClick}
                className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-opacity"
                data-testid="button-home"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                  <BookOpen size={18} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-serif font-bold truncate">LittleRoot</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                    Children's Book Creator
                  </p>
                </div>
              </button>
            ) : (
              <Link href="/dashboard">
                <button className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-opacity">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                    <BookOpen size={18} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-serif font-bold truncate">LittleRoot</h1>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                      Children's Book Creator
                    </p>
                  </div>
                </button>
              </Link>
            )}
          </div>

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

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Menu Button - moved to right */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 flex-shrink-0"
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
                  sideOffset={8}
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

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-80">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-8">
            {isDashboard && onHomeClick ? (
              <button
                onClick={() => {
                  onHomeClick();
                  setSidebarOpen(false);
                }}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md ${
                  viewMode === "create"
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-nav-home-mobile"
              >
                Home
              </button>
            ) : (
              <Link href="/dashboard">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md w-full ${
                    isActive("/dashboard")
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-foreground hover:text-primary hover:bg-accent"
                  }`}
                  data-testid="button-nav-home-mobile"
                >
                  Home
                </button>
              </Link>
            )}

            {isDashboard && onMyBooksClick ? (
              <button
                onClick={() => {
                  onMyBooksClick();
                  setSidebarOpen(false);
                }}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md ${
                  viewMode === "my-books"
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-my-books-mobile"
              >
                My Books
              </button>
            ) : (
              <button
                onClick={() => {
                  handleMyBooksClick();
                  setSidebarOpen(false);
                }}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md w-full ${
                  isMyBooksActive()
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-my-books-mobile"
              >
                My Books
              </button>
            )}

            <Link href="/dashboard/template-books">
              <button
                onClick={() => setSidebarOpen(false)}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md w-full ${
                  isActive("/dashboard/template-books")
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-templates-mobile"
              >
                Templates
              </button>
            </Link>

            <Link href="/help">
              <button
                onClick={() => setSidebarOpen(false)}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md w-full ${
                  isActive("/help")
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-help-mobile"
              >
                Help
              </button>
            </Link>

            <Link href="/faq">
              <button
                onClick={() => setSidebarOpen(false)}
                className={`text-left text-base font-medium transition-colors py-2 px-4 rounded-md w-full ${
                  isActive("/faq")
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`}
                data-testid="button-faq-mobile"
              >
                FAQ
              </button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
