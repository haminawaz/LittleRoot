import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminRevenue() {
  const { isAdminAuthenticated, adminLoading } = useAuth();

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>View revenue data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Revenue data coming soon...</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
