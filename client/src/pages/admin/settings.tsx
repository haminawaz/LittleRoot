import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSettings() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure global settings, coupons, and announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings interface coming soon...
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
