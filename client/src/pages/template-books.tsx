import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Lock, Crown, ArrowLeft, User, Trash2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
import TemplateCustomizationModal from "@/components/TemplateCustomizationModal";
import type { UserWithSubscriptionInfo, Template } from "@shared/schema";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TemplateBooks() {
  const [location, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<{ title: string; content: string; artStyle: string; description: string | null } | null>(null);
  const [templateToCustomize, setTemplateToCustomize] = useState<{ title: string; content: string; artStyle: string; description: string | null } | null>(null);
  const { toast } = useToast();

  // Query to get user with subscription info
  const { data: userWithSubscription, isLoading: userLoading } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
  });

  // Query to get user-created templates
  const { data: userTemplates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("DELETE", `/api/templates/${templateId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if user can use templates (has template books remaining)
  const canUseTemplates = (userWithSubscription?.templateBooksLimit || 0) > 0;
  const isFreeTrial = userWithSubscription?.subscriptionPlan === 'trial';

  // Define templates array
  const templates = [
    {
      title: "The Brave Little Explorer",
      content: "Once upon a time, there was a brave little explorer named Sam who loved to discover new places. One sunny morning, Sam decided to explore the mysterious forest behind their house. With a trusty backpack and a curious spirit, Sam ventured into the woods where magical creatures and wonderful surprises awaited.",
      artStyle: "watercolor",
      description: "A story about courage and discovery"
    },
    {
      title: "The Friendship Garden",
      content: "In a small town, there lived a kind girl named Maya who planted a special garden. But this wasn't just any garden - it was a friendship garden where every flower represented a new friend. As Maya tended to her garden, she learned that friendship, like flowers, needs care, patience, and love to grow.",
      artStyle: "digital",
      description: "A heartwarming tale about making friends"
    },
    {
      title: "The Magic Paintbrush",
      content: "Leo found an old paintbrush in his grandmother's attic. When he started painting with it, something amazing happened - everything he painted came to life! But Leo soon learned that with great power comes great responsibility, and he had to be very careful about what he chose to create.",
      artStyle: "cartoon",
      description: "An adventure about creativity and responsibility"
    },
    {
      title: "The Sleepy Dragon",
      content: "Deep in the mountains lived a sleepy dragon named Dozey who loved to sleep more than anything else. But when the village below needed help, Dozey had to overcome his sleepy nature to become the hero the village needed. Sometimes being brave means staying awake when you'd rather be asleep!",
      artStyle: "fantasy",
      description: "A tale about overcoming personal challenges"
    },
    {
      title: "The Starlight Express",
      content: "Every night, a magical train called the Starlight Express travels across the sky, carrying dreams to sleeping children. Join conductor Luna as she learns the importance of delivering the right dreams to the right children, and what happens when one very special dream goes missing.",
      artStyle: "dreamy",
      description: "A dreamy story about hopes and wishes"
    },
    {
      title: "The Kindness Club",
      content: "When Emma started the Kindness Club at her school, she never expected how much it would change everything. From helping classmates to caring for animals, the club's simple acts of kindness created ripples of joy throughout their community. Sometimes the smallest gestures make the biggest difference.",
      artStyle: "realistic",
      description: "A story about the power of kindness"
    }
  ];

  // Template handlers
  const handleTemplateClick = (template: typeof templates[0] | Template) => {
    if (!canUseTemplates) {
      // Show upgrade prompt for free trial users
      return;
    }
    setSelectedTemplate({
      title: template.title,
      content: template.content,
      artStyle: template.artStyle,
      description: 'description' in template && template.description !== null ? template.description : ""
    });
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      setTemplateToCustomize(selectedTemplate);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-serif font-bold">Story Templates</h1>
                <p className="text-sm text-muted-foreground">
                  {canUseTemplates 
                    ? `Choose a template to get started quickly (${userWithSubscription?.templateBooksRemaining || 0}/${userWithSubscription?.templateBooksLimit || 0} remaining)`
                    : "Upgrade your plan to access premium templates"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
              data-testid="button-create-from-scratch"
            >
              Create From Scratch
            </Button>
          </div>
        </div>
      </header>

      {/* Free Trial Lock Notice */}
      {isFreeTrial && !canUseTemplates && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  Template Books Are Locked
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    Premium Feature
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Free trial includes 0 template books. Upgrade to unlock our curated story templates and jumpstart your creativity!
                </p>
                <Link href="/subscription">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Access Templates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Templates Section */}
        {userTemplates && userTemplates.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-serif font-semibold">My Saved Templates</h2>
              <Badge variant="secondary" className="ml-2">
                {userTemplates.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTemplates.map((template, index) => (
                <motion.div
                  key={`user-${template.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  className="relative bg-card rounded-lg border border-border hover:shadow-2xl hover:border-primary transition-all duration-300 p-6 group overflow-hidden"
                  data-testid={`user-template-${index}`}
                >
                  {/* Animated Delete Button */}
                  <motion.div 
                    className="absolute top-3 right-3 z-10"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur-sm border border-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive hover:scale-110 hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplateMutation.mutate(template.id);
                      }}
                      data-testid={`button-delete-template-${index}`}
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="flex items-start justify-between mb-3 pr-8">
                      <motion.div
                        whileHover={{ 
                          rotate: [0, -10, 10, -10, 10, 0],
                          scale: [1, 1.1, 1.1, 1.1, 1.1, 1]
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <BookOpen className="h-8 w-8 text-primary" />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.artStyle}
                        </Badge>
                      </motion.div>
                    </div>
                    
                    <motion.h3 
                      className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {template.title}
                    </motion.h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {template.description || template.content.substring(0, 100) + "..."}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <motion.span 
                        className="text-xs text-muted-foreground"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {new Date(template.createdAt).toLocaleDateString()}
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <User className="h-3 w-3 mr-1" />
                          Your Template
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal 
          template={{
            title: selectedTemplate.title,
            content: selectedTemplate.content,
            artStyle: selectedTemplate.artStyle,
            description: selectedTemplate.description || ""
          }} 
          onClose={() => setSelectedTemplate(null)} 
          onUseTemplate={handleUseTemplate}
        />
      )}

      {/* Template Customization Modal */}
      {templateToCustomize && (
        <TemplateCustomizationModal 
          template={{
            title: templateToCustomize.title,
            content: templateToCustomize.content,
            artStyle: templateToCustomize.artStyle,
            description: templateToCustomize.description || ""
          }} 
          onClose={() => setTemplateToCustomize(null)} 
          onStoryCreated={(storyId) => {
            // Close modal
            setTemplateToCustomize(null);
            // Navigate to dashboard with story ID in URL
            setLocation(`/dashboard?story=${storyId}`);
          }}
        />
      )}
    </div>
  );
}
