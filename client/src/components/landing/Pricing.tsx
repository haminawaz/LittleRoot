import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const PLAN_STYLES: Record<
  string,
  {
    badge?: string;
    buttonText: string;
    colorTheme: Plan["colorTheme"];
  }
> = {
  trial: {
    badge: "Start Here",
    buttonText: "Start Free Trial",
    colorTheme: {
      border: "border-[#00C950]",
      text: "text-[#00C950]",
      button: "bg-[#00C950]",
      gradientFrom: "from-[#00C950]",
      gradientTo: "to-[#00C950]",
    },
  },
  hobbyist: {
    badge: "Early Access",
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#8E51FF]",
      text: "text-[#8E51FF]",
      button: "bg-[#8E51FF]",
      gradientFrom: "from-[#8E51FF]",
      gradientTo: "to-[#8E51FF]",
    },
  },
  pro: {
    badge: "Most Popular",
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#E12AFB]",
      text: "text-[#E12AFB]",
      button: "bg-[#E12AFB]",
      gradientFrom: "from-[#E12AFB]",
      gradientTo: "to-[#E12AFB]",
    },
  },
  reseller: {
    badge: "Best Value",
    buttonText: "Choose Plan",
    colorTheme: {
      border: "border-[#FF6900]",
      text: "text-[#FF6900]",
      button: "bg-[#FF6900]",
      gradientFrom: "from-[#FF6900]",
      gradientTo: "to-[#FF6900]",
    },
  },
};

interface PricingProps {
  plans?: {
    id: string;
    name: string;
    price: number;
    booksPerMonth: number;
    templateBooks: number;
    bonusVariations: number;
    pagesPerBook: number;
    commercialRights?: boolean;
    resellRights?: boolean;
  }[];
  promotion?: {
    id: string;
    discountPercent: number;
    planIds: string[];
  } | null;
}

const Pricing = ({ plans: dbPlans = [], promotion }: PricingProps) => {

  const generateFeatures = (plan: any): string[] => {
    const illustrations =
      plan.booksPerMonth && plan.pagesPerBook
        ? plan.booksPerMonth * plan.pagesPerBook
        : null;

    let commercialRightsText = "No commercial rights";
    if (plan.resellRights) {
      commercialRightsText = "Full Commercial Rights (publishing & selling)";
    } else if (plan.commercialRights) {
      commercialRightsText = "Full Commercial Rights (publishing)";
    }

    const features: string[] = [
      illustrations
        ? `${illustrations} Illustrations (${plan.booksPerMonth}+ Books)`
        : `${plan.booksPerMonth} Books per Month`,
      `${plan.templateBooks ?? 0} Template Books`,
      `Up to ${plan.pagesPerBook ?? 24} Pages Each`,
      "All Art Styles",
      "Character Consistency",
      `${plan.bonusVariations ?? 0} Bonus Illustration Variations`,
    ];

    if (plan.id?.toLowerCase() !== "trial") {
      features.push(commercialRightsText);
      features.push("PDF Export");
    }

    return features;
  };



  const plans: Plan[] = dbPlans.map((plan) => {
    const style = PLAN_STYLES[plan.id] || PLAN_STYLES["hobbyist"];

    let displayPrice = plan.price;
    if (promotion && promotion.planIds.includes(plan.id)) {
      displayPrice = plan.price * (1 - promotion.discountPercent / 100);
    }

    return {
      id: plan.id,
      name: plan.name,
      price: displayPrice,
      normalPrice:
        promotion && promotion.planIds.includes(plan.id)
          ? plan.price
          : plan.price,
      badge: style.badge || "",
      features: generateFeatures(plan),
      buttonText: style.buttonText,
      colorTheme: style.colorTheme,
    };
  });

  plans.sort((a, b) => a.price - b.price);

  return (
    <section id="pricing" className="py-8 md:py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12" data-aos="fade-up">
          <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 md:mb-4">
            Choose Your Plan
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Start creating your own children's books today with our flexible
            pricing options.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`border-2 ${plan.colorTheme.border} relative flex flex-col shadow-lg hover:shadow-xl transition-shadow !bg-white`}
              data-aos="fade-up"
              data-aos-delay={index * 100}>
              {plan.badge && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span
                    className={`${plan.colorTheme.button} text-white px-3 md:px-4 py-2 md:py-3 rounded-full text-xs md:text-sm lg:text-md font-semibold`}>
                    {plan.badge}
                  </span>
                </div>
              )}
              {!plan.badge && (
                <div
                  className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${plan.colorTheme.gradientFrom} ${plan.colorTheme.gradientTo}`}></div>
              )}
              <CardHeader
                className={`text-center ${
                  plan.badge ? "pt-6 md:pt-8" : "pt-4 md:pt-6"
                } pb-3 md:pb-4`}>
                <CardTitle className="text-lg md:text-xl font-bold mb-1 md:mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-[#99A1AF] font-bold text-sm md:text-base">
                  {plan.id !== "trial" && plan.normalPrice && promotion && (
                    <span className="line-through">
                      ${plan.normalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div
                  className={`${
                    plan.badge
                      ? "text-3xl md:text-4xl lg:text-5xl"
                      : "text-2xl md:text-3xl lg:text-4xl"
                  } font-bold ${plan.colorTheme.text} mb-1 md:mb-2`}>
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
                      className="flex text-[#45556C] items-start gap-2">
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-[#90A1B9] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="w-full bg-[#FFD230] hover:bg-[#FFD230]/90 text-black font-bold text-sm md:text-base lg:text-lg py-2 md:py-3 rounded-full text-center">
                  {plan.buttonText}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
