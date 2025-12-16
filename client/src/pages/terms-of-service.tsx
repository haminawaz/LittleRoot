import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: string) => {
    setLocation(`/home#${section}`);
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/home">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src="/logo.svg"
                  alt="Little Root"
                  className="h-8 md:h-10 lg:h-12"
                />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-4 lg:gap-8 font-medium text-sm lg:text-base">
              <button
                onClick={() => handleNavClick("features")}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("how-it-works")}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                How it Works
              </button>
              <button
                onClick={() => handleNavClick("pricing")}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors"
              >
                Pricing
              </button>
            </nav>
            <div className="flex items-center gap-2 md:gap-4 font-medium">
              <button
                onClick={() => handleNavClick("contact")}
                className="hidden sm:flex text-gray-700 hover:text-[#00BBA7] !bg-transparent text-sm md:text-base"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick("contact")}
                className="bg-[#00BBA7] hover:bg-[#00BBA7]/80 drop-shadow-lg shadow-[0_6px_12px_0_rgba(0,187,167,0.3)] text-white rounded-full text-xs md:text-sm px-3 md:px-6 py-1.5 md:py-2"
              >
                <span className="hidden sm:inline">Get Early Access</span>
                <span className="sm:hidden">Get Access</span>
              </button>
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
              <button
                onClick={() => {
                  handleNavClick("features");
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors text-left"
              >
                Features
              </button>
              <button
                onClick={() => {
                  handleNavClick("how-it-works");
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors text-left"
              >
                How it Works
              </button>
              <button
                onClick={() => {
                  handleNavClick("pricing");
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-[#00BBA7] transition-colors text-left"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  handleNavClick("contact");
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-[#00BBA7] !bg-transparent justify-start text-left"
              >
                Log In
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Terms of Service
        </h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="border-b border-gray-200 pb-6">
            <div className="space-y-2 text-sm md:text-base text-gray-600">
              <p>
                <span className="font-semibold text-gray-900">
                  Effective Date:
                </span>{" "}
                December 2025
              </p>
              <p>
                <span className="font-semibold text-gray-900">Domain:</span>{" "}
                <a
                  href="https://littlerootstudios.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00BBA7] hover:text-[#00A693] hover:underline transition-colors"
                >
                  littlerootstudios.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-gray-900">Contact:</span>{" "}
                <a
                  href="mailto:info@littlerootstudios.com"
                  className="text-[#00BBA7] hover:text-[#00A693] hover:underline transition-colors"
                >
                  info@littlerootstudios.com
                </a>
              </p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              These Terms govern your access to and use of the Little Root
              Studios platform (“Services”). By using our Services, you agree to
              these Terms.
            </p>
          </div>

          <div className="space-y-8 md:space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                1. Use of Services
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>
                  You must be at least 18 years old to use Little Root Studios.
                </p>
                <p>
                  You agree not to misuse our Services or upload harmful,
                  illegal, or unauthorized content.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                2. Account
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>
                  You are responsible for maintaining the confidentiality of
                  your login credentials and for activity under your account.
                </p>
                <p>Third-party logins (Google/Facebook/X) are supported.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                3. Subscriptions & Payments
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>Subscriptions renew automatically unless canceled.</p>
                <p>
                  Refunds are granted at our discretion and must be requested
                  via{" "}
                  <a
                    href="mailto:info@littlerootstudios.com"
                    className="text-[#00BBA7] hover:text-[#00A693] hover:underline transition-colors"
                  >
                    info@littlerootstudios.com
                  </a>
                  .
                </p>
                <p>
                  Payments are processed by third-party providers (Stripe,
                  PayPal).
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                4. User Content
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>
                  You retain ownership of the content you upload and generate.
                </p>
                <p>
                  By using our Services, you grant us permission to process your
                  data for the purpose of generating AI outputs.{" "}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                5. AI-Generated Content
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>Outputs generated through Little Root Studios may vary. </p>
                <p>
                  Users are responsible for reviewing AI outputs before
                  distribution or publishing.{" "}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                6. Prohibited Uses
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                You may not:
              </p>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg text-gray-700 ml-4">
                <li>Attempt to reverse engineer our models or systems</li>
                <li>Use the platform for harmful or illegal content </li>
                <li>Bypass subscription limits</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                7. Termination
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We may suspend or terminate accounts for violations of these
                Terms
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                8. Limitation of Liability
              </h2>
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>
                  Little Root Studios is provided “as is” without warranties
                </p>
                <p>
                  We are not liable for indirect, incidental, or consequential
                  damages.{" "}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                9. Governing Law
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                These Terms are governed by the laws of the United States and
                the State of Florida.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
