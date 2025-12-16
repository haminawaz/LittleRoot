import { useLocation } from "wouter";
import { Facebook, Instagram } from "lucide-react";

const TikTok = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const Footer = () => {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-white text-gray-900 py-8 md:py-12 border-t-2 border-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[50%_25%_25%] gap-6 md:gap-8 mb-6 md:mb-8">
          <div
            className="sm:col-span-2 md:col-span-1 md:pr-[20%]"
            data-aos="fade-right"
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <img
                src="/landing/footer-logo.svg"
                alt="Little Root"
                className="h-6 md:h-8"
              />
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              Empowering storytellers with magical AI tools. Turn your
              imagination into reality and share your stories with the world.
            </p>
            <div className="flex gap-2 md:gap-3">
              <a
                href="https://www.tiktok.com/@littlerootstudios?_r=1&_t=ZP-92FgYviUKZa"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="TikTok"
              >
                <TikTok className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
              </a>
              <a
                href="https://www.instagram.com/littlerootstudios/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
              </a>
              <a
                href="https://www.facebook.com/littleroot"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
              </a>
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="100">
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-[#90A1B9]">
              <li>
                <a
                  href="#features"
                  className="hover:text-gray-900 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-gray-900 transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-gray-900 transition-colors"
                >
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-[#90A1B9]">
              <li>
                <button
                  onClick={() => {
                    setLocation("/termsofservice");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-gray-900 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    setLocation("/privacypolicy");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black my-6 md:my-8"></div>

        <div className="text-center text-gray-600 text-xs md:text-sm">
          <p>© 2025 LittleRoot Studios. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
