import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const GoogleLoginButton = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await fetch(`/api/user/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Login failed",
          description:
            result.message || "Google login failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome!",
        description: "You have been logged in successfully with Google.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/dashboard");
    } catch (err) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Google login failed:", err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={() => {
        toast({
          title: "Login failed",
          description: "Google login was cancelled or failed.",
          variant: "destructive",
        });
      }}
    />
  );
};

export default GoogleLoginButton;
