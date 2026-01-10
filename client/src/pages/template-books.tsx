import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2, Star, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
import TemplateCustomizationModal from "@/components/TemplateCustomizationModal";
import type { UserWithSubscriptionInfo, Template } from "@shared/schema";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UpgradeUser from "@/components/UpgradeUser";

export default function TemplateBooks() {
  const [location, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<{ title: string; content: string; artStyle: string; description: string | null } | null>(null);
  const [templateToCustomize, setTemplateToCustomize] = useState<{ title: string; content: string; artStyle: string; description: string | null } | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const images = ["/template-lock-icon.svg", "/template-lock-bg.svg"];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const { data: userWithSubscription, isLoading: userLoading } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
  });

  // Query to get user-created templates
  const { data: userTemplates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
    enabled: userWithSubscription?.subscriptionPlan !== 'guest',
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("DELETE", `/api/templates/${templateId}`);
      return response.json();
    },
    onSuccess: (_, templateId) => {
      // Optimistically update the cache to remove the template immediately
      queryClient.setQueryData<Template[]>(["/api/templates"], (old) => {
        if (!old) return [];
        return old.filter((t) => t.id !== templateId);
      });
      
      // Still invalidate to ensure we are in sync with the server
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      
      setTemplateToDelete(null);
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
    <div className="min-h-screen bg-white">
      <Header />
      <UpgradeUser 
        show={userWithSubscription?.subscriptionPlan === 'guest'}
        message="Templates are available for registered users. Sign up to save and reuse your favorite stories!"
      />

      <div className="bg-white text-black border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold">Story Templates</h1>
                <p className="text-sm">
                  {canUseTemplates 
                    ? `Choose a template to get started quickly (${userWithSubscription?.templateBooksRemaining || 0}/${userWithSubscription?.templateBooksLimit || 0} remaining)`
                    : "Upgrade your plan to access templates"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
              data-testid="button-create-from-scratch"
            >
              Create New Story
            </Button>
          </div>
        </div>
      </div>

      {isFreeTrial && !canUseTemplates && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-auto mx-auto px-4 py-20 bg-cover bg-center bg-no-repeat bg-[#F9F7FF]"
          style={{ backgroundImage: "url('/template-lock-bg.svg')" }}
        >
          <div className="max-w-md mx-auto bg-white/50 rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center">
              <motion.div 
                className="flex items-center justify-center mb-6 h-64 w-full"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <img
                  src="/template-lock-icon.svg"
                  alt="Template Lock Icon"
                  className="h-full w-auto object-contain"
                />
              </motion.div>

              <motion.h3 
                className="text-2xl text-primary font-bold mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Template Books Are Locked
              </motion.h3>

              <motion.p 
                className="text-sm text-gray-600 mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Free trial includes 0 template books. Upgrade to unlock our curated story templates and jumpstart your creativity!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/subscription">
                  <Button className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    <Star className="h-4 w-4" />
                    Upgrade to Access Templates
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {userTemplates && userTemplates.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-black">
              <h2 className="text-xl font-serif font-semibold">My Saved Templates</h2>
              <Badge variant="default" className="ml-2">
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
                  className="relative bg-white hover:bg-gradient-to-r from-[#FBD4FF] to-[#FFFFFF] rounded-lg border border-border hover:shadow-2xl hover:border-primary transition-all duration-300 p-6 group overflow-hidden"
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
                      className="h-10 w-10 p-0 rounded-full bg-transparent text-destructive border-2 border-destructive shadow-md transition-all duration-300 hover:bg-destructive hover:text-white hover:scale-110 hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(template.id);
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
                        <BookOpen className="h-8 w-8 text-black group-hover:text-primary transition-colors" />
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
                      className="text-lg font-semibold mb-2 text-black group-hover:text-primary transition-colors"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {template.title}
                    </motion.h3>
                    <p className="text-sm text-black line-clamp-3 mb-4">
                      {template.description || template.content.substring(0, 100) + "..."}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <motion.span 
                        className="text-xs text-black"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {new Date(template.createdAt).toLocaleDateString()}
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge className="bg-primary/10 text-black transition-colors">
                          Your Template
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => {
        if (!deleteTemplateMutation.isPending) {
          if (!open) setTemplateToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your saved template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[80px]"
              disabled={deleteTemplateMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (templateToDelete) {
                  deleteTemplateMutation.mutate(templateToDelete);
                }
              }}
            >
              {deleteTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
