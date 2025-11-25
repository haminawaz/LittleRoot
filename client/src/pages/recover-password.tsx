import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RecoverPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to send password reset email",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LittleRoot</h1>
          </div>
          <CardTitle className="text-2xl">Recover Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for password reset instructions"
              : "Enter your email address and we'll send you instructions to reset your password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  If an account exists with the email <strong>{email}</strong>, you will receive password reset instructions shortly.
                </p>
              </div>
              <Button
                onClick={() => setLocation('/signin')}
                className="w-full"
                variant="outline"
                data-testid="button-back-to-signin"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-recover-email"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-recover-submit"
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              <Button
                type="button"
                onClick={() => setLocation('/signin')}
                className="w-full"
                variant="outline"
                data-testid="button-back-to-signin"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-purple-600 hover:underline" data-testid="link-signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

