import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { FaXTwitter } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

function generateRandomString(length: number): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    ""
  );
}

function generateCodeVerifier(): string {
  return generateRandomString(32);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(digest)))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const TwitterLoginButton = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        toast({
          title: "Login failed",
          description: "Twitter login was cancelled or failed.",
          variant: "destructive",
        });
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        return;
      }

      if (code && state) {
        const storedState = sessionStorage.getItem("twitter_oauth_state");
        const codeVerifier = sessionStorage.getItem("twitter_code_verifier");

        if (state !== storedState || !codeVerifier) {
          toast({
            title: "Login failed",
            description: "Invalid OAuth state. Please try again.",
            variant: "destructive",
          });
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          return;
        }

        sessionStorage.removeItem("twitter_oauth_state");
        sessionStorage.removeItem("twitter_code_verifier");

        try {
          const response = await fetch(`/api/user/auth/twitter-callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              codeVerifier,
              redirectUri: window.location.origin + window.location.pathname,
            }),
            credentials: "include",
          });

          const result = await response.json();

          if (!response.ok) {
            toast({
              title: "Login failed",
              description:
                result.message || "Twitter login failed. Please try again.",
              variant: "destructive",
            });
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
            return;
          }

          toast({
            title: "Welcome!",
            description: "You have been logged in successfully with Twitter.",
          });

          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          setLocation("/dashboard");
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (err) {
          toast({
            title: "Login failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
          console.error("Twitter login failed:", err);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    };

    handleCallback();
  }, [setLocation, toast]);

  const handleTwitterLogin = async () => {
    if (isProcessing.current) {
      return;
    }

    const twitterClientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
    if (!twitterClientId) {
      toast({
        title: "Configuration Error",
        description: "Twitter login is not configured.",
        variant: "destructive",
      });
      return;
    }

    isProcessing.current = true;

    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(16);

      sessionStorage.setItem("twitter_oauth_state", state);
      sessionStorage.setItem("twitter_code_verifier", codeVerifier);

      const redirectUri = encodeURIComponent(
        window.location.origin + window.location.pathname
      );
      const authUrl =
        `https://twitter.com/i/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${twitterClientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=tweet.read%20users.read%20offline.access&` +
        `state=${state}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

      window.location.href = authUrl;
    } catch (error: any) {
      isProcessing.current = false;
      console.error("Error initiating Twitter login:", error);
      toast({
        title: "Login failed",
        description: error?.message || "Failed to initiate Twitter login.",
        variant: "destructive",
      });
    }
  };

  const twitterClientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
  if (!twitterClientId) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleTwitterLogin}
      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white border-0 rounded-full"
      disabled={isProcessing.current || !twitterClientId}
    >
      <FaXTwitter className="w-5 h-5 text-white" />
      <span className="text-sm font-medium text-white">Continue with X</span>
    </Button>
  );
};

export default TwitterLoginButton;
