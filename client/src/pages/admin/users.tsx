import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminUser() {
  const { isAdminAuthenticated, adminLoading } = useAuth();
  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>View and manage all users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Users list interface coming soon...
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
