import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Menu } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import AOS from "aos";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [userCode, setUserCode] = useState<string>("");

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
      offset: 100,
    });
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const scrollToSection = () => {
        const element = document.getElementById(hash);
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
          return true;
        }
        return false;
      };

      if (!scrollToSection()) {
        const retryInterval = setInterval(() => {
          if (scrollToSection()) {
            clearInterval(retryInterval);
          }
        }, 100);
        setTimeout(() => clearInterval(retryInterval), 2000);
      }
    }
  }, []);

  const signupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sign up");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setIsReturning(data.isReturning);
      setUserCode(data.code);
      setShowSuccessModal(true);
      setEmail("");
    },
    onError: (error: any) => {
      console.error("Error signing up:", error);
      alert(error.message || "Failed to sign up. Please try again.");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      signupMutation.mutate(email);
    }
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {bannerVisible && (
        <div
          className="bg-gradient-to-b from-[#00D5BE]  to-[#C27AFF] text-gray-900 py-2 md:py-3"
          data-aos="fade-down"
        >
          <div className="container mx-auto px-4 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium text-white flex-1 min-w-0">
              <span className="bg-purple-100/30 px-1.5 md:px-2 py-1 md:py-2 rounded-full flex-shrink-0">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              </span>
              <span className="truncate">
                Early Access Join now and get{" "}
                <strong className="underline">40% off</strong> your first 3
                months!
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href="#contact"
                className="bg-white hover:bg-white/90 text-[#8200DB] hover:!text-[#8200DB] h-auto py-1 md:py-1.5 px-2 md:px-4 rounded-sm text-xs md:text-sm font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">Claim Discount</span>
                <span className="sm:hidden">Claim</span>
              </a>
              <button
                onClick={() => setBannerVisible(false)}
                className="text-white hover:text-white/80 p-1"
                aria-label="Close banner"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="Little Root"
                className="h-8 md:h-10 lg:h-12"
              />
            </div>

            <nav className="hidden md:flex items-center gap-4 lg:gap-8 font-medium text-sm lg:text-base">
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
            <div className="flex items-center gap-2 md:gap-4 font-medium">
              <a
                href="#contact"
                className="hidden sm:flex text-gray-700 hover:text-[#00BBA7] !bg-transparent text-sm md:text-base"
              >
                Log In
              </a>
              <a
                href="#contact"
                className="bg-[#00BBA7] hover:bg-[#00BBA7]/80 drop-shadow-lg shadow-[0_6px_12px_0_rgba(0,187,167,0.3)] text-white rounded-full text-xs md:text-sm px-3 md:px-6 py-1.5 md:py-2"
              >
                <span className="hidden sm:inline">Get Early Access</span>
                <span className="sm:hidden">Get Access</span>
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-700 p-2"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
          <nav
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-96 opacity-100 mt-4 pb-4 border-t border-gray-200 pt-4"
                : "max-h-0 opacity-0 mt-0 pb-0 pt-0 border-t-0"
            }`}
          >
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-[#00BBA7] !bg-transparent justify-start"
              >
                Log In
              </a>
            </div>
          </nav>
        </div>
      </header>

      <Hero />
      <Features />
      <HowWorks />
      <Pricing />
      <Contact
        handleEmailSubmit={handleEmailSubmit}
        signupMutation={signupMutation}
        email={email}
        setEmail={setEmail}
        isReturning={isReturning}
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        userCode={userCode}
      />
      <Footer />
    </div>
  );
}
