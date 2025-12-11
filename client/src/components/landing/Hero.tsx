import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface HeroProps {
  handleChoosePlan: (
    planId: string,
    planName: string,
    planPrice: number
  ) => void;
}

const Hero = ({ handleChoosePlan }: HeroProps) => {
  return (
    <>
      <section className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div data-aos="fade-right">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[#00BBA7] text-xs md:text-sm font-medium mb-4 md:mb-6">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              <span>AI Storybook Creator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Turn Stories into{" "}
              <span className="bg-gradient-to-r from-[#00BBA7] to-blue-400 bg-clip-text text-transparent">
                Beautiful
              </span>{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Books
              </span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              LittleRoot Studios uses AI to bring your children's stories to
              life with consistent characters and professional illustrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
              <Button
                size="lg"
                className="bg-[#00BBA7] hover:bg-[#00BBA7]/90 text-black text-base md:text-lg px-6 md:px-8 py-4 md:py-6 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto"
                onClick={() => handleChoosePlan("trial", "Free Trial", 0)}
              >
                <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                Start Creating
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-black text-black !bg-transparent hover:!bg-gray-50 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                View Showcase
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex -space-x-2">
                <img
                  src="/landing/user-1.png"
                  alt="User 1"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/landing/user-2.png"
                  alt="User 2"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/landing/user-3.png"
                  alt="User 3"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
                />
              </div>
              <p className="text-xs md:text-sm text-blue-600 font-medium">
                Trusted by storytellers
              </p>
            </div>
          </div>
          <div className="relative order-1 md:order-2 mb-8 md:mb-0 px-8 md:px-12 lg:px-0" data-aos="fade-left" data-aos-delay="200">
            <div className="relative rounded-2xl border-2 border-black overflow-hidden aspect-[8/10] transform rotate-3">
              <img
                src="/landing/hero-img-1.png"
                alt="Little Root Studios - Turn Stories into Beautiful Books"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="block absolute -top-4 -right-2 md:-right-0 lg:-right-16 w-20 h-20 md:w-20 md:h-20 lg:w-32 lg:h-32 rounded-full overflow-hidden z-10" data-aos="zoom-in" data-aos-delay="400">
              <img
                src="/landing/hero-img-3.png"
                alt="Story illustration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="block absolute -bottom-12 -left-2 md:-left-8 lg:-left-20 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden z-10" data-aos="zoom-in" data-aos-delay="600">
              <img
                src="/landing/hero-img-2.png"
                alt="Story illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-16 lg:py-24">
        <div className="mx-auto px-4">
          <div className="container text-center mb-8 md:mb-12" data-aos="fade-up">
            <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 md:mb-4">
              Professional Studio Interface
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              A powerful, clean workspace designed for authors. Manage your
              story, generate consistency-aware illustrations, and format your
              book all in one place.
            </p>
          </div>
          <div className="hidden md:block px-4" data-aos="zoom-in" data-aos-delay="200">
            <img
              src="/landing/studio-img-1.svg"
              alt="Professional Studio Interface"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="block md:hidden px-4" data-aos="zoom-in" data-aos-delay="200">
            <img
              src="/landing/studio-img-2.svg"
              alt="Professional Studio Interface"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
