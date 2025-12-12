import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { FaFacebook } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const FacebookLoginButton = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const scriptLoaded = useRef(false);
  const sdkReady = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;

    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!facebookAppId) {
      console.warn(
        "VITE_FACEBOOK_APP_ID is not set. Facebook login will not work."
      );
      return;
    }

    const errorSuppressor = (event: ErrorEvent) => {
      if (
        event.message?.includes("Failed to fetch") &&
        event.filename?.includes("facebook.net")
      ) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    };

    window.addEventListener("error", errorSuppressor, true);
    window.addEventListener("unhandledrejection", (event) => {
      if (
        event.reason?.message?.includes("Failed to fetch") ||
        event.reason?.stack?.includes("facebook.net")
      ) {
        event.preventDefault();
      }
    });

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: true,
          version: "v18.0",
          status: false,
          autoLogAppEvents: false,
        });
        sdkReady.current = true;
        console.log("Facebook SDK initialized successfully");
      } catch (error) {
        console.error("Error initializing Facebook SDK:", error);
        sdkReady.current = false;
      }
    };

    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js?v=18.0";
      js.async = true;
      js.onerror = () => {
        console.error("Failed to load Facebook SDK script");
        sdkReady.current = false;
      };
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, "script", "facebook-jssdk");

    scriptLoaded.current = true;
  }, []);

  const handleFacebookLogin = () => {
    if (isProcessing.current) {
      return;
    }

    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!facebookAppId) {
      toast({
        title: "Configuration Error",
        description: "Facebook login is not configured.",
        variant: "destructive",
      });
      return;
    }

    if (!window.FB || !sdkReady.current) {
      toast({
        title: "Loading",
        description:
          "Facebook SDK is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    isProcessing.current = true;

    try {
      window.FB.login(
        (response: any) => {
          setTimeout(() => {
            isProcessing.current = false;
          }, 1000);

          if (response.error) {
            if (response.error.error_code === 200) {
              isProcessing.current = false;
              return;
            }

            console.error("Facebook login error:", response.error);
            let errorMessage = "Facebook login failed. Please try again.";

            if (response.error.errorMessage) {
              errorMessage = response.error.errorMessage;
            } else if (response.error.error_code === 190) {
              errorMessage = "Invalid Facebook token. Please try again.";
            } else if (response.error.error_code === 10) {
              errorMessage =
                "Facebook login permission denied. Please check your Facebook App settings.";
            }

            toast({
              title: "Login failed",
              description: errorMessage,
              variant: "destructive",
            });
            return;
          }

          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            (async () => {
              try {
                const loginResponse = await fetch(
                  `/api/user/auth/facebook-login`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken }),
                    credentials: "include",
                  }
                );

                const result = await loginResponse.json();

                if (!loginResponse.ok) {
                  toast({
                    title: "Login failed",
                    description:
                      result.message ||
                      "Facebook login failed. Please try again.",
                    variant: "destructive",
                  });
                  isProcessing.current = false;
                  return;
                }

                toast({
                  title: "Welcome!",
                  description:
                    "You have been logged in successfully with Facebook.",
                });

                await queryClient.invalidateQueries({
                  queryKey: ["/api/auth/user"],
                });
                setLocation("/dashboard");
                isProcessing.current = false;
              } catch (err) {
                toast({
                  title: "Login failed",
                  description: "Something went wrong. Please try again.",
                  variant: "destructive",
                });
                console.error("Facebook login failed:", err);
                isProcessing.current = false;
              }
            })();
          } else {
            isProcessing.current = false;
          }
        },
        { scope: "email,public_profile" }
      );
    } catch (error: any) {
      isProcessing.current = false;
      console.error("Error calling Facebook login:", error);
      toast({
        title: "Login failed",
        description:
          error?.message ||
          "Failed to initiate Facebook login. Please check your Facebook App configuration.",
        variant: "destructive",
      });
    }
  };

  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!facebookAppId) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleFacebookLogin}
      className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white border-0 rounded-full"
      disabled={isProcessing.current}
    >
      <FaFacebook className="w-5 h-5 text-white" />
      <span className="text-sm font-medium text-white">Continue with Facebook</span>
    </Button>
  );
};

export default FacebookLoginButton;
