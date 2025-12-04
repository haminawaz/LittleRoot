import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminActivity() {
  const { isAdminAuthenticated, adminLoading } = useAuth();

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>View all admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Activity log interface coming soon...
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
