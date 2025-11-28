import { useState, useEffect, useMemo } from "react";
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
import { BookOpen, Eye, EyeOff, Check, X, Lock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const hasUpperCase = (password: string) => /[A-Z]/.test(password);
const hasLowerCase = (password: string) => /[a-z]/.test(password);
const hasNumberOrSymbol = (password: string) =>
  /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
const hasMinLength = (password: string) => password.length >= 8;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const getSearchParams = () => {
    const search = window.location.search;
    return new URLSearchParams(search);
  };
  const searchParams = getSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          toast({
            title: "Invalid Token",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsTokenValid(false);
        toast({
          title: "Error",
          description: "Failed to verify reset token.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, toast]);

  const passwordRequirements = useMemo(() => {
    const password = formData.password;
    return {
      hasBothCases: hasUpperCase(password) && hasLowerCase(password),
      hasNumberOrSymbol: hasNumberOrSymbol(password),
      hasMinLength: hasMinLength(password),
      passwordsMatch:
        formData.password === formData.confirmPassword &&
        formData.confirmPassword.length > 0,
    };
  }, [formData.password, formData.confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);

    if (e.target.name === "password" && errors.password) {
      setErrors({ ...errors, password: undefined });
    }
    if (e.target.name === "confirmPassword" && errors.confirmPassword) {
      setErrors({ ...errors, confirmPassword: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setErrors({
        ...errors,
        password: "Please meet all password requirements",
      });
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      setErrors({ ...errors, confirmPassword: "Passwords do not match" });
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Password Reset",
        description:
          "Your password has been reset successfully. You can now sign in.",
      });

      setTimeout(() => {
        setLocation("/signin");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Verifying reset token...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-purple-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                LittleRoot
              </h1>
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/recover-password")}
              className="w-full"
              data-testid="button-request-new-reset"
            >
              Request New Reset Link
            </Button>
            <Button
              onClick={() => setLocation("/signin")}
              className="w-full mt-2"
              variant="outline"
              data-testid="button-back-to-signin"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LittleRoot
            </h1>
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleInputChange}
                  data-testid="input-reset-password"
                  className={`pr-10 ${
                    errors.password || (formData.password && !isPasswordValid)
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  data-testid="input-reset-confirm-password"
                  className={`pr-10 ${
                    errors.confirmPassword ||
                    (formData.confirmPassword && !passwordsMatch)
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-toggle-confirm-password-visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}

              <div
                className={`mt-2 p-3 rounded-md border-2 ${
                  errors.password || errors.confirmPassword || !isPasswordValid
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : "border-green-500 bg-green-50 dark:bg-green-950/20"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lock
                    className={`h-4 w-4 mt-0.5 ${
                      errors.password ||
                      errors.confirmPassword ||
                      !isPasswordValid
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      errors.password ||
                      errors.confirmPassword ||
                      !isPasswordValid
                        ? "text-red-700 dark:text-red-400"
                        : "text-green-700 dark:text-green-400"
                    }`}
                  >
                    Your password needs to:
                  </p>
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    {passwordRequirements.hasBothCases ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasBothCases
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      include both lower and upper case characters.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    {passwordRequirements.hasNumberOrSymbol ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasNumberOrSymbol
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      include at least one number or symbol.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    {passwordRequirements.hasMinLength ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasMinLength
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      be at least 8 characters long.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    {passwordRequirements.passwordsMatch ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.passwordsMatch
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      match the password confirmation.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-reset-submit"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              onClick={() => setLocation("/signin")}
              className="w-full"
              variant="outline"
              data-testid="button-back-to-signin"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
