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
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full border border-[#00BBA7] text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI Storybook Creator</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Stories into{" "}
              <span className="bg-gradient-to-r from-[#00BBA7] to-blue-400 bg-clip-text text-transparent">
                Beautiful
              </span>{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Books
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              LittleRoot Studios uses AI to bring your children's stories to
              life with consistent characters and professional illustrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                size="lg"
                className="bg-[#00BBA7] hover:bg-[#00BBA7]/90 text-white text-lg px-8 py-6 rounded-full flex items-center gap-2"
                onClick={() => handleChoosePlan("trial", "Free Trial", 0)}
              >
                <Sparkles className="h-5 w-5" />
                Start Creating
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-black text-black !bg-transparent hover:!bg-gray-50 text-lg px-8 py-6 rounded-full flex items-center gap-2"
              >
                View Showcase
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img
                  src="/landing/user-1.png"
                  alt="User 1"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/landing/user-2.png"
                  alt="User 2"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/landing/user-3.png"
                  alt="User 3"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
              </div>
              <p className="text-sm text-blue-600 font-medium">
                Trusted by storytellers
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl border-2 border-black overflow-hidden aspect-[8/10] transform rotate-3">
              <img
                src="/landing/hero-img-1.png"
                alt="Little Root Studios - Turn Stories into Beautiful Books"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-4 -right-16 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden z-10">
              <img
                src="/landing/hero-img-3.png"
                alt="Story illustration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -bottom-12 -left-20 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden z-10">
              <img
                src="/landing/hero-img-2.png"
                alt="Story illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto px-4">
          <div className="container text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Professional Studio Interface
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A powerful, clean workspace designed for authors. Manage your
              story, generate consistency-aware illustrations, and format your
              book all in one place.
            </p>
          </div>
          <div className="px-4">
            <img
              src="/landing/studio-img-1.svg"
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
