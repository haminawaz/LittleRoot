import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useRef, useEffect, useState } from "react";

const GoogleLoginButton = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<string>("350");

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const computedWidth = containerRef.current.offsetWidth;
        setWidth(computedWidth.toString());
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
    <div ref={containerRef} className="w-full">
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        type="standard"
        text="continue_with"
        shape="pill"
        width={width}
        onError={() => {
          toast({
            title: "Login failed",
            description: "Google login was cancelled or failed.",
            variant: "destructive",
          });
        }}
      />
    </div>
  );
};

export default GoogleLoginButton;
