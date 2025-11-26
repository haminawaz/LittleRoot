import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

export default function FAQ() {
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const faqs = [
    {
      question: "How many pages can my book have?",
      answer:
        "Each book can have up to 24 pages with illustrations. This is perfect for children's books and provides enough space to tell engaging stories.",
    },
    {
      question: "Can I edit the text after generating illustrations?",
      answer:
        "Yes! You can edit the text at any time. When you regenerate a page, it will use the updated text. This gives you complete flexibility to refine your story.",
    },
    {
      question: "What happens when I cancel my subscription?",
      answer:
        "You'll retain access to all features until the end of your current billing period. After that, your subscription will not renew and you won't be charged again. You can resubscribe anytime.",
    },
    {
      question: "Can I use the books commercially?",
      answer:
        "Hobbyist and Pro plans include commercial rights for publishing. Business plans also include full commercial rights for publishing & selling. Perfect for authors and entrepreneurs!",
    },
    {
      question: "How does the 7-day trial work?",
      answer:
        "Your trial starts when you sign up and lasts 7 days. You can create 1 book during this period. After 7 days, you'll need to upgrade to a paid plan to continue creating books.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-full px-5 py-2.5 mb-6 shadow-lg shadow-orange-500/30">
            <HelpCircle className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">
              Frequently Asked Questions
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Got Questions?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find answers to common questions about creating children's books
            with LittleRoot
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                    expandedFaq === index
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                          expandedFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedFaq === index ? "auto" : 0,
                        opacity: expandedFaq === index ? 1 : 0,
                        marginTop: expandedFaq === index ? 16 : 0,
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
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
