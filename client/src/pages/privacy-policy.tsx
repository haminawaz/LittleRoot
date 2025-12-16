import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";

export default function PrivacyPolicy() {
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
          Privacy Policy
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
              Little Root Studios ("Little Root Studios," "we," "our," "us")
              provides tools for creating children's book illustrations using
              artificial intelligence. This Privacy Policy explains how we
              collect, use, and protect your information when you use our
              website, app, or services ("Services").
            </p>
          </div>

          <div className="space-y-8 md:space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                1. Information We Collect
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We may collect:
              </p>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg text-gray-700 ml-4">
                <li>
                  <span className="font-semibold text-gray-900">
                    Account Information:
                  </span>{" "}
                  (name, email, password)
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    User Content:
                  </span>{" "}
                  (uploaded images, text you enter into the book generator)
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    Usage Data:
                  </span>{" "}
                  (pages visited, IP address, device info)
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    Payment Data:
                  </span>{" "}
                  (processed securely by third-party providers such as PayPal or
                  Stripe; we do not store full payment details)
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                2. How We Use Information
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg text-gray-700 ml-4">
                <li>Provide and improve our Services</li>
                <li>
                  Authenticate user accounts (including Google/Facebook login)
                </li>
                <li>Generate AI illustrations and books</li>
                <li>
                  Communicate updates, support messages, and transactional
                  emails
                </li>
                <li>Prevent abuse, fraud, and unauthorized access</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                3. How We Share Information
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg text-gray-700 ml-4">
                <li>
                  <span className="font-semibold text-gray-900">
                    AI model providers
                  </span>{" "}
                  for generating illustrations
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    Authentication providers
                  </span>{" "}
                  (Google, Facebook)
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    Payment processors
                  </span>{" "}
                  for handling transactions
                </li>
                <li>
                  <span className="font-semibold text-gray-900">
                    Service providers
                  </span>{" "}
                  assisting with hosting, analytics, or support
                </li>
              </ul>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We do <span className="text-gray-900 font-semibold">not</span>{" "}
                sell your personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                4. Data Storage &amp; Security
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We use industry-standard safeguards to protect your data. No
                method of transmission over the Internet is 100% secure, but we
                take reasonable steps to keep your information safe.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                5. Children&apos;s Privacy
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Little Root Studios is intended for parents and adult creators,
                not children under 13. We do not knowingly collect data from
                children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                6. Your Rights
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                You may request to:
              </p>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg text-gray-700 ml-4">
                <li>Access or update your information</li>
                <li>Delete your account</li>
                <li>Request removal of uploaded content</li>
                <li className="list-none pl-6">
                  Email:
                  <a
                    href="mailto:info@littlerootstudios.com"
                    className="text-[#00BBA7] hover:text-[#00A693] hover:underline transition-colors font-semibold"
                  >
                    info@littlerootstudios.com
                  </a>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                7. Changes to This Policy
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We may update this Privacy Policy and will revise the
                &quot;Effective Date&quot; accordingly.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
