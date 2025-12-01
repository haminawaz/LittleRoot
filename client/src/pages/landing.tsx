// Based on javascript_log_in_with_replit integration
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Palette, Download, Pause, Play } from "lucide-react";
import { useLocation } from "wouter";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect, useRef } from "react";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "My daughter absolutely loves the books I create with LittleRoot! The AI illustrations are magical and the process is so easy. We've created 3 books already and each one is more beautiful than the last.",
    name: "Sarah Martinez",
    role: "Parent • California",
    initials: "SM",
    gradientFrom: "from-purple-400",
    gradientTo: "to-pink-400",
  },
  {
    id: 2,
    quote: "As an elementary school teacher, I use LittleRoot to create custom storybooks for my classroom. The children are amazed by the illustrations, and I can personalize stories to match our curriculum. It's been a game-changer!",
    name: "David Wilson",
    role: "Elementary Teacher • Texas",
    initials: "DW",
    gradientFrom: "from-blue-400",
    gradientTo: "to-cyan-400",
  },
  {
    id: 3,
    quote: "I've always wanted to write children's books but could never afford professional illustrators. LittleRoot made my dream come true! The character consistency feature is incredible - my characters look perfect across every page.",
    name: "Jessica Park",
    role: "Aspiring Author • New York",
    initials: "JP",
    gradientFrom: "from-green-400",
    gradientTo: "to-emerald-400",
  },
  {
    id: 4,
    quote: "The variety of art styles is amazing! I've created books in watercolor, digital, and cartoon styles. Each one has its own unique charm. My kids can't decide which style they love more.",
    name: "Michael Chen",
    role: "Father of 3 • Washington",
    initials: "MC",
    gradientFrom: "from-orange-400",
    gradientTo: "to-red-400",
  },
  {
    id: 5,
    quote: "I run a small publishing business, and LittleRoot has revolutionized how I create content. The PDF export feature is perfect, and the quality is print-ready. My clients are always impressed!",
    name: "Amanda Rodriguez",
    role: "Publisher • Florida",
    initials: "AR",
    gradientFrom: "from-indigo-400",
    gradientTo: "to-purple-400",
  },
  {
    id: 6,
    quote: "Creating bedtime stories for my grandchildren has never been easier. The AI understands exactly what I want, and the illustrations are always perfect. They ask me to read our LittleRoot books every night!",
    name: "Patricia Brown",
    role: "Grandmother • Arizona",
    initials: "PB",
    gradientFrom: "from-teal-400",
    gradientTo: "to-blue-400",
  },
];

interface SliderSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
}

const sliderSlides: SliderSlide[] = [
  {
    id: 1,
    title: "Bring Your Stories to Life",
    description: "Transform your imagination into beautiful, illustrated children's books with the power of AI",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop",
    gradientFrom: "from-purple-500",
    gradientTo: "to-pink-500",
    icon: <Sparkles className="h-16 w-16 text-white" />,
  },
  {
    id: 2,
    title: "Stunning AI Illustrations",
    description: "Create consistent, magical characters and scenes that captivate young readers",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=600&fit=crop",
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-500",
    icon: <Palette className="h-16 w-16 text-white" />,
  },
  {
    id: 3,
    title: "Multiple Art Styles",
    description: "Choose from watercolor, digital, cartoon, fantasy, and more to match your story's mood",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    icon: <BookOpen className="h-16 w-16 text-white" />,
  },
  {
    id: 4,
    title: "Print-Ready PDFs",
    description: "Export your finished books as high-quality PDFs, ready for printing or digital sharing",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&h=600&fit=crop",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-500",
    icon: <Download className="h-16 w-16 text-white" />,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [api, setApi] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const autoplayPluginRef = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const toggleAutoplay = () => {
    if (!autoplayPluginRef.current) return;
    if (isPlaying) {
      autoplayPluginRef.current.stop();
    } else {
      autoplayPluginRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleLogin = () => {
    window.location.href = "/signin";
  };

  const handleChoosePlan = (planId: string, planName: string, planPrice: number) => {
    // Save plan details to localStorage
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: planId,
      name: planName,
      price: planPrice
    }));
    
    // Redirect to signup page
    setLocation('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      {/* Navigation Bar */}
      <nav className="border-b border-purple-200/50 dark:border-purple-800/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center group cursor-pointer transition-transform duration-300 hover:scale-105">
              <BookOpen className="h-8 w-8 text-purple-600 mr-2 animate-pulse group-hover:animate-none transition-all duration-300 group-hover:rotate-12" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                LittleRoot
              </span>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/signin')}
                className="hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:scale-105 transition-all duration-300"
                data-testid="button-nav-signin"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('selectedPlan');
                  setLocation('/signup');
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                data-testid="button-nav-signup"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="flex items-center justify-center mb-8 group">
            <BookOpen className="h-16 w-16 text-purple-600 mr-4 drop-shadow-lg animate-float" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
              LittleRoot
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6 animate-slide-up">
            Create Beautiful Children's Books with AI
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
            Transform your stories into stunning illustrated children's books using cutting-edge AI. 
            Perfect for parents, teachers, and anyone who loves storytelling.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card 
            className="border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group animate-fade-in-up"
            data-testid="feature-ai-illustrations"
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-white mb-3">AI-Powered Illustrations</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Generate beautiful, consistent character illustrations using Google Gemini AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-gray-900 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group animate-fade-in-up-delay-1"
            data-testid="feature-art-styles"
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Palette className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-white mb-3">Multiple Art Styles</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Choose from watercolor, digital, cartoon, fantasy, and more artistic styles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-gray-900 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 group animate-fade-in-up-delay-2"
            data-testid="feature-export"
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Download className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-white mb-3">Export to PDF</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Download your finished books as high-quality PDFs ready for printing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-20 relative max-w-7xl mx-auto">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplayPluginRef.current]}
            className="w-full relative"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {sliderSlides.map((slide) => (
                <CarouselItem key={slide.id} className="pl-2 md:pl-4 basis-full">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl h-[400px] md:h-[500px] group">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${slide.image})`,
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradientFrom} ${slide.gradientTo} opacity-80`}></div>
                    </div>
                    <div className="relative h-full flex flex-col items-center justify-center text-center px-6 md:px-12 text-white">
                      <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110">
                        {slide.icon}
                      </div>
                      <h3 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg animate-slide-up">
                        {slide.title}
                      </h3>
                      <p className="text-lg md:text-xl max-w-2xl drop-shadow-md animate-slide-up-delay">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 bg-white/90 hover:bg-white shadow-lg border-0 z-20" />
            <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 bg-white/90 hover:bg-white shadow-lg border-0 z-20" />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-2">
                {sliderSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`h-2.5 md:h-3 rounded-full transition-all duration-300 ${
                      current === index
                        ? "w-6 md:w-8 bg-white"
                        : "w-2.5 md:w-3 bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAutoplay}
                className="ml-2 h-7 w-7 md:h-8 md:w-8 bg-white/90 hover:bg-white shadow-lg border-0"
                aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isPlaying ? (
                  <Pause className="h-3 w-3 md:h-4 md:w-4" />
                ) : (
                  <Play className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </Button>
            </div>
          </Carousel>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Parents, Teachers & Creators
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of satisfied users who are creating beautiful children's books with LittleRoot
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card 
                key={testimonial.id}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-amber-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradientFrom} ${testimonial.gradientTo} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Choose Your Plan</h3>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* Free Trial */}
            <Card className="border-2 border-green-500 bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 relative flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group" data-testid="plan-trial">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <span className="bg-green-500 text-white px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-lg">
                  Start Here
                </span>
              </div>
              <CardHeader className="text-center pt-8 pb-4">
                <div className="text-5xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform duration-300">$0</div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 font-medium">7 days</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col px-4 sm:px-6 pb-6">
                <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-2.5 mb-6 flex-grow text-left">
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">1 Book (24 Illustrations)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">0 Template Books</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Up to 24 Pages Each</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">All Art Styles</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Character Consistency</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">2 Bonus Illustration Variations</span></li>
                </ul>
                <Button 
                  className="w-full mt-auto text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-300"
                  size="lg"
                  onClick={() => handleChoosePlan('trial', 'Free Trial', 0)}
                  data-testid="button-start-free-trial"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Hobbyist */}
            <Card className="border-2 border-violet-500 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group" data-testid="plan-hobbyist">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600"></div>
              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hobbyist</CardTitle>
                <div className="text-4xl font-bold text-violet-600 mb-1 group-hover:scale-110 transition-transform duration-300">$19.99</div>
                <CardDescription className="font-medium">per month</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col px-5 pb-6">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5 mb-6 flex-grow text-left">
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">144 Illustrations (6+ Books)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">3 Template Books</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Up to 24 Pages Each</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">All Art Styles</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Character Consistency</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">10 Bonus Illustration Variations</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Full Commercial Rights (for personal publishing)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">PDF Export</span></li>
                </ul>
                <Button 
                  className="w-full mt-auto shadow-md hover:shadow-lg transition-all duration-300"
                  size="lg"
                  onClick={() => handleChoosePlan('hobbyist', 'Hobbyist', 19.99)}
                  data-testid="button-choose-plan-hobbyist"
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-2 border-purple-500 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group" data-testid="plan-pro">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"></div>
              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Pro</CardTitle>
                <div className="text-4xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform duration-300">$39.99</div>
                <CardDescription className="font-medium">per month</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col px-5 pb-6">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5 mb-6 flex-grow text-left">
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">360 Illustrations (15+ Books)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">15 Template Books</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Up to 24 Pages Each</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">All Art Styles</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Character Consistency</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">25 Bonus Illustration Variations</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Full Commercial Rights (publishing & selling)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">PDF Export</span></li>
                </ul>
                <Button 
                  className="w-full mt-auto shadow-md hover:shadow-lg transition-all duration-300"
                  size="lg"
                  onClick={() => handleChoosePlan('pro', 'Pro', 39.99)}
                  data-testid="button-choose-plan-pro"
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            {/* Business */}
            <Card className="border-2 border-orange-500 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900 flex flex-col shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group" data-testid="plan-reseller">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Business</CardTitle>
                <div className="text-4xl font-bold text-orange-600 mb-1 group-hover:scale-110 transition-transform duration-300">$74.99</div>
                <CardDescription className="font-medium">per month</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col px-5 pb-6">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5 mb-6 flex-grow text-left">
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">600 Illustrations (25+ Books)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">30 Template Books</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Up to 24 Pages Each</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">All Art Styles</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Character Consistency</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">75 Bonus Illustration Variations</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">Full Commercial Rights (publishing & selling)</span></li>
                  <li className="flex items-start gap-2"><span className="shrink-0">✓</span><span className="text-left">PDF Export</span></li>
                </ul>
                <Button 
                  className="w-full mt-auto shadow-md hover:shadow-lg transition-all duration-300"
                  size="lg"
                  onClick={() => handleChoosePlan('reseller', 'Business', 74.99)}
                  data-testid="button-choose-plan-reseller"
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-3 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300" 
            onClick={() => handleChoosePlan('trial', 'Free Trial', 0)}
            data-testid="button-start-free-trial"
          >
            Start Your Free Trial
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}