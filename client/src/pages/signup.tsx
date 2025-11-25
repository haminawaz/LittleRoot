import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Validation schema for signup form
const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<{id: string; name: string; price: number} | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Retrieve selected plan from localStorage
    const planData = localStorage.getItem('selectedPlan');
    if (planData) {
      setSelectedPlan(JSON.parse(planData));
    } else {
      // If no plan selected, default to free trial
      setSelectedPlan({
        id: 'trial',
        name: 'Free Trial',
        price: 0
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = signupSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    // Clear errors if validation passed
    setErrors({});
    setIsLoading(true);

    // Default to free trial if no plan selected
    const planToUse = selectedPlan || { id: 'trial', name: 'Free Trial', price: 0 };

    try {
      // If free trial, register user directly and skip checkout
      if (planToUse.id === 'trial') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            planId: planToUse.id,
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          toast({
            title: "Registration failed",
            description: data.message || "Failed to create account",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Clear localStorage
        localStorage.removeItem('selectedPlan');

        toast({
          title: "Welcome to LittleRoot!",
          description: "Your 7-day free trial has started.",
        });

        // Invalidate auth query to refresh user data, then navigate
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation('/dashboard');
        return;
      }

      // For paid plans, save to localStorage and go to checkout
      // Note: Only storing name and email (NOT password for security)
      localStorage.setItem('signupData', JSON.stringify({
        name: formData.name,
        email: formData.email,
        planId: planToUse.id,
      }));

      // Store password separately in memory (will be cleared on checkout)
      sessionStorage.setItem('signupPassword', formData.password);

      // Clear any upgrade flag from previous sessions (prevent sticky state)
      localStorage.removeItem('isUpgrade');

      // Redirect to checkout page
      setLocation('/checkout');
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const displayPlan = selectedPlan || { id: 'trial', name: 'Free Trial', price: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LittleRoot</h1>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Sign up for the <span className="font-semibold text-purple-600">{displayPlan.name}</span> plan
            {displayPlan.price > 0 && <span> - ${displayPlan.price}/month</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
                data-testid="input-signup-name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="input-signup-email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  data-testid="input-signup-password"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signup-submit"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="text-purple-600 hover:underline" data-testid="link-signin">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
