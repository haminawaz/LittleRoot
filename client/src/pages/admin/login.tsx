import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdminAuthenticated, adminLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!adminLoading && isAdminAuthenticated) {
      setLocation("/admin/dashboard");
    }
  }, [adminLoading, isAdminAuthenticated, setLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Login failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome!",
        description: "You have been logged in successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      setIsLoading(false);
      setLocation("/admin/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-500/50 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <BookOpen className="h-10 w-10 text-purple-400 mr-2" />
              <Shield className="h-5 w-5 text-purple-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-3xl font-bold text-white">LittleRoot</h1>
          </div>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@littleroot.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Admin access only. Unauthorized access is prohibited.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
