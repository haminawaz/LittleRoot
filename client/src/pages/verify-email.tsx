import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const getSearchParams = () => {
        const search = window.location.search;
        return new URLSearchParams(search);
      };
      const searchParams = getSearchParams();
      const token = searchParams.get("token");

      if (!token) {
        setError("No verification token provided");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setIsVerified(true);
          toast({
            title: "Email Verified!",
            description: "Your email has been verified successfully. Welcome to LittleRoot!",
          });
        } else {
          setError(data.message || "Failed to verify email");
          toast({
            title: "Verification Failed",
            description: data.message || "Failed to verify email",
            variant: "destructive",
          });
        }
      } catch (error) {
        setError("An error occurred while verifying your email");
        toast({
          title: "Error",
          description: "Failed to verify email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Verifying your email...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LittleRoot</h1>
          </div>
          {isVerified ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You can now sign in to your account.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>
                {error || "Unable to verify your email address"}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isVerified ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  🎉 Welcome to LittleRoot! Your account is now active. You can start creating beautiful children's books right away!
                </p>
              </div>
              <Button
                onClick={() => setLocation('/signin')}
                className="w-full"
                data-testid="button-go-to-signin"
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error || "The verification link is invalid or has expired. Please request a new verification email."}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

