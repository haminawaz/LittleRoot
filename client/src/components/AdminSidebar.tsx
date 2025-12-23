import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  MessageSquare,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";

const navLinks = [
  { path: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/early-access", label: "Early Access", icon: Sparkles },
  { path: "/admin/plans", label: "Subscription Plans", icon: DollarSign },
  //   { path: "/admin/messages", label: "Messages", icon: MessageSquare },
  //   { path: "/admin/activity", label: "Activity", icon: Activity },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const [location] = useLocation();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-40 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ top: "73px", height: "calc(100vh - 73px)" }}
      >
        <nav className="p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location === link.path ||
              (link.path === "/admin/dashboard" && location === "/admin");
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
