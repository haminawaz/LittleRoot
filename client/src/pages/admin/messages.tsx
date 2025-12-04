import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminMessages() {
  const { isAdminAuthenticated, adminLoading } = useAuth();

  if (adminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Support Messages</CardTitle>
          <CardDescription>
            Manage customer support conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Messaging interface coming soon...
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
