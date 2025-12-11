import { Facebook, Instagram, Music } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-900 py-12 border-t-2 border-black">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-[50%_25%_25%] gap-8 mb-8">
          <div className="pr-[20%]">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/landing/footer-logo.svg"
                alt="Little Root"
                className="h-8"
              />
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Empowering storytellers with magical AI tools. Turn your
              imagination into reality and share your stories with the world.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full !bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="TikTok"
              >
                <Music className="h-5 w-5 text-gray-700" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-gray-700" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-gray-700" />
              </a>
            </div>
          </div>

          <div>
            <ul className="space-y-3 text-[#90A1B9]">
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
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          <div>
            <ul className="space-y-3 text-[#90A1B9]">
              <li>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black my-8"></div>

        <div className="text-center text-gray-600 text-sm">
          <p>© 2025 LittleRoot Studios. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
