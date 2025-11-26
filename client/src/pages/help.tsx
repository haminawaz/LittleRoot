import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  BookOpen, ArrowLeft, HelpCircle, CreditCard, FileText, Sparkles,
  Wand2, Palette, Image, Download, CheckCircle, ChevronDown, Crown,
  Zap, Shield, TrendingUp, Users
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

export default function Help() {
  const [, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const steps = [
    {
      number: "1",
      icon: FileText,
      title: "Enter Your Story",
      description: "Write or paste your story and our AI will organize it into beautifully illustrated pages for your children's book.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      number: "2",
      icon: Palette,
      title: "Choose Your Art Style",
      description: "Select from watercolor, digital art, hand-drawn, and more. Each style brings a unique feel to your story.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      number: "3",
      icon: Image,
      title: "Add Character Reference",
      description: "Upload an image of your character to maintain consistency across all illustrations.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      number: "4",
      icon: Wand2,
      title: "Generate Your Book",
      description: "Click 'Generate Book' and watch as AI creates beautiful illustrations for each page.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      number: "5",
      icon: Download,
      title: "Download & Print",
      description: "Export your completed book as a PDF ready for printing or digital sharing.",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "7 days",
      icon: Sparkles,
      gradient: "from-gray-500 to-gray-600",
      features: [
        "1 book (24 illustrations)",
        "2 bonus variations",
        "All art styles",
        "Standard format"
      ]
    },
    {
      name: "Hobbyist",
      price: "$19.99",
      period: "/month",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      features: [
        "144 Illustrations (6+ Books)",
        "3 template books",
        "10 bonus variations",
        "Commercial rights"
      ]
    },
    {
      name: "Pro",
      price: "$39.99",
      period: "/month",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
      popular: true,
      features: [
        "360 Illustrations (15+ Books)",
        "15 template books",
        "25 bonus variations",
        "Full commercial rights"
      ]
    },
    {
      name: "Business",
      price: "$74.99",
      period: "/month",
      icon: Crown,
      gradient: "from-orange-500 to-red-500",
      features: [
        "600 Illustrations (25+ Books)",
        "30 template books",
        "75 bonus variations",
        "Full commercial rights (publishing & selling)"
      ]
    }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Template Books",
      description: "Save your completed books as templates to reuse with different art styles or variations.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Sparkles,
      title: "Bonus Variations",
      description: "Generate alternative versions of individual illustrations to find the perfect image.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Sparkles,
      title: "Multiple Art Styles",
      description: "Choose from watercolor, digital art, cartoon, oil painting, and more to match your story's vision.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Character Consistency",
      description: "Upload a reference image to ensure your character looks the same throughout.",
      gradient: "from-orange-500 to-red-500"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-5 py-2.5 mb-6 shadow-lg shadow-purple-500/30">
            <HelpCircle className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">Help Center</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            We're Here to Help
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Everything you need to create beautiful children's books with AI-powered illustrations
          </p>
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="group"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Button>
        </motion.div>
      </section>

      <main className="max-w-6xl mx-auto px-6">
        {/* Getting Started */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20 mt-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Quick Start Guide</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-3">Getting Started</h2>
            <p className="text-lg text-muted-foreground">
              Create your first book in just 5 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="relative h-full overflow-hidden group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {step.number}
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${step.gradient} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Subscription Plans */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full px-4 py-2 mb-4">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Pricing Plans</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-3">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">
              Flexible options to match your creative needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
              >
                <Card className={`relative h-full overflow-hidden group cursor-pointer transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-xl shadow-primary/20 scale-105' 
                    : 'border-2 hover:border-primary/50 hover:shadow-xl'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <CardContent className="p-6 relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <plan.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className={`h-5 w-5 mt-0.5 text-primary flex-shrink-0`} />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="text-center mt-8">
            <Link href="/subscription">
              <Button size="lg" className="group" data-testid="button-manage-subscription">
                Manage Subscription
                <Zap className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Features */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full px-4 py-2 mb-4">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Powerful Features</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-3">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Professional tools for creating amazing children's books
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Card className="h-full overflow-hidden group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

      </main>
    </div>
  );
}
