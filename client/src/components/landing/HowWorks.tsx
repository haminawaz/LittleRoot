import {
  Sparkles,
  WandSparkles,
  Download,
  PenLine,
  Printer,
  ArrowRight,
} from "lucide-react";

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
  image: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <PenLine className="h-6 w-6" />,
    title: "Tell Your Story",
    description:
      "Start with filling in your story details including your full manuscript",
    iconBgColor: "bg-gradient-to-r from-[#00D5BE] to-[#009689]",
    image: "/landing/magic-1.svg",
  },
  {
    number: 2,
    icon: <Printer className="h-6 w-6" />,
    title: "Smart Page Layout",
    description:
      "The system automatically breaks your story into perfectly paced pages, suggesting where illustrations should go for maximum impact.",
    iconBgColor: "bg-gradient-to-r from-[#C27AFF] to-[#9810FA]",
    image: "/landing/magic-2.svg",
  },
  {
    number: 3,
    icon: <WandSparkles className="h-6 w-6" />,
    title: "Magical Generation",
    description:
      "Watch as characters come to life. Our Consistency Engine ensures your main character looks the same on page 1 as they do on page 20.",
    iconBgColor: "bg-gradient-to-r from-[#FB64B6] to-[#E60076]",
    image: "/landing/magic-3.svg",
  },
  {
    number: 4,
    icon: <Download className="h-6 w-6" />,
    title: "Export & Publish",
    description:
      "Review your masterpiece, tweak any details, and export a print-ready PDF. You own 100% of the commercial rights.",
    iconBgColor: "bg-gradient-to-r from-[#FDC700] to-[#FF6900]",
    image: "/landing/magic-4.svg",
  },
];

const HowWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white text-[#009689] px-4 py-2 rounded-full border-2 border-[#E2E8F0] text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Simple 4-Step Process</span>
          </div>
        </div>
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How Magic Happens
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've combined advanced AI with a simple, intuitive workflow so you
            can focus on the story.
          </p>
        </div>
        <div className="max-w-7xl mx-auto">
          {steps.map((step, index) => {
            const isEven = index % 2 == 0;
            return (
              <div
                key={step.number}
                className={`grid md:grid-cols-2 items-center relative ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`${step.number !== 1 && "pt-16"} ${
                    isEven ? "md:order-2" : ""
                  } ${isEven ? "md:pl-12" : "md:pr-12"}`}
                >
                  <div className="flex flex-col items-start gap-4 mb-6">
                    <div
                      className={`w-12 h-12 ${step.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 drop-shadow-[0_4px_3px_rgba(173,70,255,0.4)]`}
                    >
                      <div className="text-white">{step.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <a
                        href="#"
                        className="text-[#00BBA7] hover:text-[#009689] font-medium inline-flex items-center gap-1"
                      >
                        Learn more{" "}
                        <span className="text-lg">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>

                <div
                  className={`${step.number !== 1 && "pt-16"} ${
                    isEven ? "md:order-1" : ""
                  } ${isEven ? "md:pr-12" : "md:pl-12"}`}
                >
                  <div
                    className={`hidden md:block absolute left-1/2 ${
                      step.number !== 1 ? "top-0" : "top-24"
                    } ${
                      step.number !== 4 ? "bottom-0" : "bottom-24"
                    } bottom-0 w-0.5 bg-black -translate-x-1/2`}
                  ></div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-auto object-cover"
                    />

                    <div className="absolute left-8 right-8 bottom-8">
                      <div className="bg-black/70 p-6 rounded-lg">
                        <div className="flex items-start justify-start gap-2 text-white">
                          <div
                            className={`w-12 h-12 ${step.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            {step.number}
                          </div>
                          <div className="text-start flex flex-col gap-2">
                            <h1 className="text-lg font-bold">{step.title}</h1>
                            <p className="text-xs text-white/50">
                              Step {step.number} of {steps.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowWorks;
