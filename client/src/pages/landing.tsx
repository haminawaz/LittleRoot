// Based on javascript_log_in_with_replit integration
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Palette, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

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
            className="text-lg px-8 py-3" 
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