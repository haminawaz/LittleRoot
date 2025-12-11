import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Layers,
  Palette,
  Download,
  Crown,
  Share2,
  BookOpen,
  Zap,
  SquarePen,
  WandSparkles,
} from "lucide-react";

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
}

interface StorytellerCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
}

const featureCards: FeatureCard[] = [
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Reusable Book Templates",
    description:
      "Turn your stories into templates you can customize anytime - swap characters, adjust art style, or rewrite scenes effortlessly.",
    iconColor: "text-[#9810FA]",
  },
  {
    icon: <Layers className="h-8 w-8" />,
    title: "Character Consistency",
    description:
      "Define your character once (hair, clothes, features) and they'll look identical in every single panel.",
    iconColor: "text-[#009689]",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Rapid Story Illustration",
    description:
      "From cover to final page, your illustrations are created in minutes - giving you more time to focus on creativity.",
    iconColor: "text-[#D08700]",
  },
  {
    icon: <Share2 className="h-8 w-8" />,
    title: "Download & Print",
    description:
      "Export your completed book as a PDF ready for printing or digital sharing.",
    iconColor: "text-[#E60076]",
  },
  {
    icon: <Crown className="h-8 w-8" />,
    title: "Pro Typography",
    description:
      "Access a variety of children's book fonts that pair perfectly with illustration styles.",
    iconColor: "text-[#F54900]",
  },
  {
    icon: <SquarePen className="h-8 w-8" />,
    title: "Room to Create",
    description:
      "Enjoy hundreds of illustration credits designed to help you experiment with drafts, try new looks, and polish your story at your own pace.",
    iconColor: "text-[#155DFC]",
  },
];

const storytellerCards: StorytellerCard[] = [
  {
    icon: <WandSparkles className="h-6 w-6" />,
    title: "AI Scene Generation",
    description:
      "Describe any scene and watch as our AI paints it in vivid detail, maintaining character consistency.",
    iconColor: "text-purple-600",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: "Multiple Art Styles",
    description:
      "Choose from 3D Pixar-style, Watercolor, Sketch, and more to match your story's mood.",
    iconColor: "text-pink-600",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Lightning Fast",
    description:
      "Generate full-resolution illustrations in seconds, not hours. Perfect for iterating quickly.",
    iconColor: "text-yellow-600",
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Commercial Rights",
    description:
      "You own the images you generate. Use them in your published books, marketing, and merchandise.",
    iconColor: "text-green-600",
  },
];

const Features = () => {
  return (
    <>
      <section className="py-8 md:py-16 lg:py-24" id="features">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white text-[#009689] px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 border-[#E2E8F0] text-xs md:text-sm font-medium mb-4 md:mb-6">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              <span>Powerful Features</span>
            </div>
          </div>
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 md:mb-4">
              Everything You Need to Publish
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              We've thought of everything so you can focus on being creative.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-8 w-full mx-auto">
            {featureCards.map((card, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow !bg-white border-2 !border-[#E2E8F0] pr-14 md:pr-8"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center mb-4`}
                  >
                    <div className={card.iconColor}>{card.icon}</div>
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="overflow-hidden aspect-[1]">
              <img
                src="/landing/features-img.png"
                alt="Designed for Storytellers"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="">
              <h2 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
                Designed for Storytellers
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8">
                LittleRoot Studio provides a unique suite of tools to help you
                visualize your narrative without needing artistic skills.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {storytellerCards.map((card, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow !bg-white border-2 !border-[#E2E8F0]"
                  >
                    <CardHeader>
                      <div className="w-12 h-12 border border-[#E2E8F0] rounded-lg flex items-center justify-center mb-3">
                        <div className={card.iconColor}>{card.icon}</div>
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
