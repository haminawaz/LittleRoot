import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowWorks from "@/components/landing/HowWorks";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import Contact from "@/components/landing/Contact";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [bannerVisible, setBannerVisible] = useState(true);

  const handleChoosePlan = (
    planId: string,
    planName: string,
    planPrice: number
  ) => {
    localStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        id: planId,
        name: planName,
        price: planPrice,
      })
    );
    setLocation("/signup");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log("Email submitted:", email);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-white">
      {bannerVisible && (
        <div className="bg-gradient-to-b from-[#00D5BE]  to-[#C27AFF] text-gray-900 py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
              <span className="bg-purple-100/30 px-2 py-2 rounded-full">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                Early Access Join now and get{" "}
                <strong className="underline">40% off</strong> your first 3
                months!
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white hover:bg-white/90 text-[#8200DB] hover:!text-[#8200DB] h-auto py-1.5 px-4 rounded-sm text-sm font-medium"
                onClick={() => handleChoosePlan("trial", "Free Trial", 0)}
              >
                Claim Discount
              </Button>
              <button
                onClick={() => setBannerVisible(false)}
                className="text-white hover:text-white/80 p-1"
                aria-label="Close banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Little Root" className="h-12" />
            </div>

            <nav className="hidden md:flex items-center gap-8 font-medium">
              <a
                href="#features"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-4 font-medium">
              <Button
                variant="ghost"
                onClick={() => setLocation("/signin")}
                className="text-gray-700 hover:text-[#00BBA7] !bg-transparent"
              >
                Log In
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem("selectedPlan");
                  handleChoosePlan("trial", "Free Trial", 0);
                }}
                className="bg-[#00BBA7] hover:bg-[#00BBA7]/80 drop-shadow-lg shadow-[0_6px_12px_0_rgba(0,187,167,0.3)] text-white rounded-full"
              >
                Get Early Access
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Hero handleChoosePlan={handleChoosePlan} />
      <Features />
      <HowWorks />
      <Pricing handleChoosePlan={handleChoosePlan} />
      <Contact
        handleEmailSubmit={handleEmailSubmit}
        email={email}
        setEmail={setEmail}
      />
      <Footer />
    </div>
  );
}
