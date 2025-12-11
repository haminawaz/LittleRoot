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
    <section id="how-it-works" className="py-8 md:py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex justify-center" data-aos="fade-down">
          <div className="inline-flex items-center gap-2 bg-white text-[#009689] px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 border-[#E2E8F0] text-xs md:text-sm font-medium mb-4 md:mb-6">
            <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
            <span>Simple 4-Step Process</span>
          </div>
        </div>
        <div className="text-center mb-8 md:mb-12" data-aos="fade-up">
          <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 md:mb-4">
            How Magic Happens
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
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
                className={`grid md:grid-cols-2 items-center relative gap-6 md:gap-4 lg:gap-0 ${
                  isEven ? "md:flex-row-reverse" : ""
                } ${step.number !== 1 ? "mt-8 md:mt-0" : ""}`}
                data-aos={isEven ? "fade-left" : "fade-right"}
                data-aos-delay={index * 150}
              >
                <div
                  className={`${step.number !== 1 && "md:pt-16"} ${
                    isEven ? "md:order-2" : ""
                  } ${isEven ? "md:pl-6 lg:pl-12" : "md:pr-6 lg:pr-12"} order-1`}
                >
                  <div className="flex flex-col items-start gap-3 md:gap-4 mb-4 md:mb-6">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 ${step.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 drop-shadow-[0_4px_3px_rgba(173,70,255,0.4)]`}
                    >
                      <div className="text-white text-sm md:text-base">{step.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <a
                        href="#"
                        className="text-[#00BBA7] hover:text-[#009689] font-medium inline-flex items-center gap-1 text-sm md:text-base"
                      >
                        Learn more{" "}
                        <span className="text-lg">
                          <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>

                <div
                  className={`${step.number !== 1 && "md:pt-16"} ${
                    isEven ? "md:order-1" : ""
                  } ${isEven ? "md:pr-6 lg:pr-12" : "md:pl-6 lg:pl-12"} order-2`}
                >
                  <div
                    className={`hidden md:block absolute left-1/2 ${
                      step.number !== 1 ? "top-0" : "top-24"
                    } ${
                      step.number !== 4 ? "bottom-0" : "bottom-24"
                    } bottom-0 w-0.5 bg-black -translate-x-1/2`}
                  ></div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg" data-aos="zoom-in" data-aos-delay={index * 150 + 100}>
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-auto object-cover"
                    />

                    <div className="absolute left-4 right-4 md:left-8 md:right-8 bottom-4 md:bottom-8">
                      <div className="bg-black/70 p-4 md:p-6 rounded-lg">
                        <div className="flex items-start justify-start gap-2 text-white">
                          <div
                            className={`w-10 h-10 md:w-12 md:h-12 ${step.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-sm md:text-base font-bold">{step.number}</span>
                          </div>
                          <div className="text-start flex flex-col gap-1 md:gap-2">
                            <h1 className="text-base md:text-lg font-bold">{step.title}</h1>
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
