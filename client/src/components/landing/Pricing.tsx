import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PricingProps {
  handleChoosePlan: (
    planId: string,
    planName: string,
    planPrice: number
  ) => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  badge: string;
  normalPrice?: number;
  features: string[];
  buttonText: string;
  colorTheme: {
    border: string;
    text: string;
    button: string;
    gradientFrom: string;
    gradientTo: string;
  };
}

const plans: Plan[] = [
  {
    id: "trial",
    name: "Start Here",
    price: 0,
    badge: "Start Here",
    features: [
      "1 Book (24 Illustrations)",
      "0 Template Books",
      "Up to 24 Pages Each",
      "All Art Styles",
      "Character Consistency",
      "2 Bonus Illustration Variations",
    ],
    buttonText: "Start Free Trial",
    colorTheme: {
      border: "border-[#00C950]",
      text: "text-[#00C950]",
      button: "bg-[#00C950]",
      gradientFrom: "from-[#00C950]",
      gradientTo: "to-[#00C950]",
    },
  },
  {
    id: "hobbyist",
    name: "Hobbyist",
    price: 11.99,
    normalPrice: 19.99,
    badge: "Early Access",
    features: [
      "144 Illustrations (6+ Books)",
      "3 Template Books",
      "Up to 24 Pages Each",
      "All Art Styles",
      "Character Consistency",
      "10 Bonus Illustration Variations",
      "Full Commercial Rights (publishing)",
      "PDF Export",
    ],
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#8E51FF]",
      text: "text-[#8E51FF]",
      button: "bg-[#8E51FF]",
      gradientFrom: "from-[#8E51FF]",
      gradientTo: "to-[#8E51FF]",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 23.99,
    normalPrice: 39.99,
    badge: "Early Access",
    features: [
      "360 Illustrations (15+ Books)",
      "15 Template Books",
      "Up to 24 Pages Each",
      "All Art Styles",
      "Character Consistency",
      "25 Bonus Illustration Variations",
      "Full Commercial Rights (publishing & selling)",
      "PDF Export",
    ],
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#E12AFB]",
      text: "text-[#E12AFB]",
      button: "bg-[#E12AFB]",
      gradientFrom: "from-[#E12AFB]",
      gradientTo: "to-[#E12AFB]",
    },
  },
  {
    id: "business",
    name: "Business",
    price: 44.99,
    normalPrice: 74.99,
    badge: "Early Access",
    features: [
      "600 Illustrations (25+ Books)",
      "30 Template Books",
      "Up to 24 Pages Each",
      "All Art Styles",
      "Character Consistency",
      "75 Bonus Illustration Variations",
      "Full Commercial Rights (publishing & selling)",
      "PDF Export",
    ],
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#FF6900]",
      text: "text-[#FF6900]",
      button: "bg-[#FF6900]",
      gradientFrom: "from-[#FF6900]",
      gradientTo: "to-[#FF6900]",
    },
  },
];

const Pricing = ({ handleChoosePlan }: PricingProps) => {
  return (
    <section id="pricing" className="py-8 md:py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 md:mb-4">
            Choose Your Plan
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Start creating your own children's books today with our flexible
            pricing options.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 ${plan.colorTheme.border} relative flex flex-col shadow-lg hover:shadow-xl transition-shadow !bg-white`}
            >
              {plan.badge && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span
                    className={`${plan.colorTheme.button} text-white px-3 md:px-4 py-2 md:py-3 rounded-full text-xs md:text-sm lg:text-md font-semibold`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}
              {!plan.badge && (
                <div
                  className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${plan.colorTheme.gradientFrom} ${plan.colorTheme.gradientTo}`}
                ></div>
              )}
              <CardHeader
                className={`text-center ${plan.badge ? "pt-6 md:pt-8" : "pt-4 md:pt-6"} pb-3 md:pb-4`}
              >
                <CardTitle className="text-lg md:text-xl font-bold mb-1 md:mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-[#99A1AF] font-bold text-sm md:text-base">
                  {plan.normalPrice && (
                    <span className="line-through">
                      ${plan.normalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div
                  className={`${
                    plan.badge ? "text-3xl md:text-4xl lg:text-5xl" : "text-2xl md:text-3xl lg:text-4xl"
                  } font-bold ${plan.colorTheme.text} mb-1 md:mb-2`}
                >
                  ${plan.price === 0 ? "0" : plan.price.toFixed(2)}
                </div>
                <CardDescription className="text-[#62748E] font-medium text-sm md:text-base">
                  {plan.id === "trial" ? "7 days" : "per month"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col px-4 md:px-6 pb-4 md:pb-6">
                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-grow text-xs md:text-sm">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex text-[#45556C] items-start gap-2"
                    >
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-[#90A1B9] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#FFD230] hover:bg-[#FFD230]/90 text-black font-bold text-sm md:text-base lg:text-lg py-2 md:py-3"
                  onClick={() =>
                    handleChoosePlan(plan.id, plan.name, plan.price)
                  }
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
