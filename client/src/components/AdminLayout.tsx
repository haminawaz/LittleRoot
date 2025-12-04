import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location !== prevLocation && prevLocation !== "") {
      setIsNavigating(true);
      setPrevLocation(location);
      
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }

      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 150);

      return () => clearTimeout(timer);
    } else if (prevLocation === "") {
      setPrevLocation(location);
    }
  }, [location, prevLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {isNavigating ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="p-6">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
