import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, Eye, BookmarkPlus, Lock } from "lucide-react";
import StoryInput from "@/components/StoryInput";
import PageGrid from "@/components/PageGrid";
import BookPreviewModal from "@/components/BookPreviewModal";
import { exportToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Story, StoryWithPages, UserWithSubscriptionInfo, Template } from "@shared/schema";
import Header from "@/components/Header";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "my-books">("create");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyIdFromUrl = params.get('story');
    const viewFromUrl = params.get('view');
    
    if (viewFromUrl === 'my-books') {
      setViewMode("my-books");
    } else if (viewFromUrl === 'create' || !viewFromUrl) {
      setViewMode("create");
    }
    
    if (storyIdFromUrl && storyIdFromUrl !== currentStoryId) {
      console.log('Story ID from URL:', storyIdFromUrl);
      setCurrentStoryId(storyIdFromUrl);
      setViewMode("create");
    }
  }, [location, currentStoryId]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout');
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: async (data) => {
      // Clear ALL cached data to prevent data leakage between users
      queryClient.clear();
      
      // If Replit OAuth user, redirect to OIDC logout URL
      if (data.logoutUrl) {
        window.location.href = data.logoutUrl;
      } else {
        // Local auth user - just navigate to home
        setLocation('/home');
      }
    },
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/save-as-template`);
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate templates cache so new template appears instantly
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Story saved as template! You can now find it in the Templates section.",
      });
    },
    onError: (error: any) => {
      // Check if it's a duplicate template error
      if (error?.alreadyExists) {
        toast({
          title: "Already Saved",
          description: "This story is already saved as a template in your collection.",
          variant: "default",
        });
      } else if (error?.quotaExceeded) {
        toast({
          title: "📚 Template Limit Reached",
          description: error.error || "You've used all your template books for this month. Upgrade your plan to save more templates!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || error.error || "Failed to save as template. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const { data: story, isLoading, isFetching } = useQuery<StoryWithPages>({
    queryKey: ["/api/stories", currentStoryId],
    enabled: !!currentStoryId,
    refetchInterval: (query) => {
      const storyData = query.state.data;
      // Poll every 2 seconds if any page is still generating
      const hasGeneratingPages = storyData?.pages?.some(page => page.isGenerating);
      return hasGeneratingPages ? 2000 : false;
    },
    gcTime: Infinity, // Never garbage collect this query
    staleTime: 0, // Always allow refetching when needed
    refetchOnWindowFocus: false, // Don't refetch when user switches back to tab
    refetchOnMount: false, // Don't refetch when component remounts (preserve story state)
  });

  // Query to get user with subscription info
  const { data: userWithSubscription, isLoading: userLoading, error: userError } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
    staleTime: 0, // Always refetch to show updated subscription data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const { data: allStories, isLoading: isLoadingStories, error: storiesError } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    enabled: viewMode === "my-books",
  });

  // Query to get user's templates to check for duplicates
  const { data: userTemplates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Check if current story already exists as a template (to disable Save as Template button)
  const isAlreadySavedAsTemplate = story ? userTemplates.some(
    template => template.title === story.title && template.content === story.content
  ) : false;

  // Check if template quota is full
  const templateQuotaFull = userWithSubscription ? userWithSubscription.templateBooksRemaining === 0 : false;

  const getStepStatus = (step: number) => {
    if (!story) return "step-pending";
    
    switch (step) {
      case 1:
        return story.content ? "step-completed" : "step-pending";
      case 2:
        return story.pages && story.pages.length > 0 ? "step-completed" : "step-pending";
      case 3:
        return story.status === 'completed' ? "step-completed" : 
               story.status === 'generating' ? "step-active" : 
               story.status === 'error' ? "step-error" : "step-pending";
      case 4:
        return story.status === 'completed' ? "step-active" : "step-pending";
      default:
        return "step-pending";
    }
  };

  const handleExportPDF = async () => {
    if (!story) return;
    
    setIsExporting(true);
    try {
      await exportToPDF(story);
      toast({
        title: "Success",
        description: "Your book has been exported as a PDF!",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onHomeClick={() => setViewMode("create")}
        onMyBooksClick={() => setViewMode("my-books")}
        viewMode={viewMode}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - only show in create mode */}
        {viewMode === "create" && (
          <aside className="w-80 bg-card border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-serif font-semibold mb-4">Create Your Story</h2>
            
              {/* Progress Steps */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${getStepStatus(1)} flex items-center justify-center text-white text-sm font-medium`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Story Input</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${getStepStatus(2)} flex items-center justify-center text-sm font-medium ${getStepStatus(2) === 'step-pending' ? 'text-muted-foreground' : 'text-white'}`}>
                    2
                  </div>
                  <span className={`text-sm ${getStepStatus(2) === 'step-pending' ? 'text-muted-foreground' : 'font-medium'}`}>
                    Page Splitting
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${getStepStatus(3)} flex items-center justify-center text-sm font-medium ${getStepStatus(3) === 'step-pending' ? 'text-muted-foreground' : 'text-white'}`}>
                    3
                  </div>
                  <span className={`text-sm ${getStepStatus(3) === 'step-pending' ? 'text-muted-foreground' : 'font-medium'}`}>
                    AI Illustration
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${getStepStatus(4)} flex items-center justify-center text-sm font-medium ${getStepStatus(4) === 'step-pending' ? 'text-muted-foreground' : 'text-white'}`}>
                    4
                  </div>
                  <span className={`text-sm ${getStepStatus(4) === 'step-pending' ? 'text-muted-foreground' : 'font-medium'}`}>
                    Review & Export
                  </span>
                </div>
              </div>
            </div>
            
            <StoryInput onStoryCreated={(storyId) => {
              // Update URL with story ID
              window.history.pushState({}, '', `/dashboard?story=${storyId}`);
              setCurrentStoryId(storyId);
            }} />
          </aside>
        )}

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col">
          {viewMode === "create" && (
            <>
              {/* Workspace Header */}
              <div className="bg-card border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-semibold" data-testid="text-story-title">
                      {story?.title || "Your Story Title"}
                    </h2>
                    <p className="flex items-center text-sm text-muted-foreground gap-2">
                      <span data-testid="text-page-count">{story?.pages?.length || 0}</span>pages 
                      <span>•</span>
                      <span data-testid="text-word-count">{story?.content?.split(' ').length || 0}</span>words
                      <span>•</span>
                      <span className={`${
                        story?.status === 'error' ? 'text-destructive' : 'text-chart-2'
                      }`} data-testid="text-story-status">
                        {story?.status === 'completed' ? 'Ready for illustration' : 
                         story?.status === 'generating' ? 'Generating...' :
                         story?.status === 'error' ? 'Generation Failed' : 'Draft'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      disabled={!story || story.pages.length === 0}
                      data-testid="button-preview"
                    >
                      <Eye size={14} className="mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (templateQuotaFull) {
                          setLocation('/subscription');
                        } else if (story) {
                          saveAsTemplateMutation.mutate(story.id);
                        }
                      }}
                      disabled={!story || story.pages.length === 0 || saveAsTemplateMutation.isPending || (isAlreadySavedAsTemplate && !templateQuotaFull)}
                      data-testid="button-save-template"
                      title={
                        templateQuotaFull ? "Upgrade to save more templates" :
                        isAlreadySavedAsTemplate ? "This story is already saved as a template" : 
                        "Save this story as a template"
                      }
                    >
                      {saveAsTemplateMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                      ) : templateQuotaFull ? (
                        <Lock size={14} className="mr-1" />
                      ) : (
                        <BookmarkPlus size={14} className="mr-1" />
                      )}
                      {saveAsTemplateMutation.isPending ? 'Saving...' : 
                       templateQuotaFull ? 'Upgrade to Save More' :
                       isAlreadySavedAsTemplate ? 'Already Saved' : 
                       'Save as Template'}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleExportPDF}
                      disabled={!story || story.pages.length === 0 || isExporting}
                      data-testid="button-export"
                    >
                      {isExporting ? (
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                      ) : (
                        <Download size={14} className="mr-1" />
                      )}
                      {isExporting ? 'Exporting...' : 'Export PDF'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Error Banner */}
              {story?.status === 'error' && (
                <div className="bg-destructive/10 border-l-4 border-destructive px-4 py-3 mx-6 mt-4 rounded-r-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-destructive">
                        Image Generation Failed
                      </h3>
                      <div className="mt-2 text-sm text-destructive/80">
                        <p>
                          The AI illustration process encountered an error. This could be due to:
                        </p>
                        <ul className="mt-1 list-disc list-inside">
                          <li>API quota exceeded - Please wait and try again later</li>
                          <li>Request timeout - Try with a shorter story or simpler requirements</li>
                          <li>Temporary service issues - Please retry in a few moments</li>
                        </ul>
                        <p className="mt-2">
                          You can retry generation by clicking "Generate Book Pages" in the sidebar or regenerate individual page images below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Book Pages */}
              <div className="flex-1 p-6 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading story...</p>
                    </div>
                  </div>
                ) : story ? (
                  <PageGrid story={story} />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">Ready to Create?</p>
                      <p className="text-sm text-muted-foreground">
                        Enter your story details in the sidebar to get started.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "my-books" && (
            <>
              {/* My Books Header */}
              <div className="bg-card border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-semibold">My Books</h2>
                    <p className="text-sm text-muted-foreground">
                      {allStories?.length || 0} saved stories
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewMode("create")}
                    data-testid="button-create-new"
                  >
                    Create New Story
                  </Button>
                </div>
              </div>
              
              {/* Saved Stories List */}
              <div className="flex-1 p-6 overflow-y-auto">
                {isLoadingStories ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading stories...</p>
                    </div>
                  </div>
                ) : allStories?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allStories.map((savedStory) => {
                      return (
                        <div 
                          key={savedStory.id} 
                          className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            // Update URL with story ID
                            window.history.pushState({}, '', `/dashboard?story=${savedStory.id}`);
                            setCurrentStoryId(savedStory.id);
                            setViewMode("create");
                          }}
                          data-testid={`card-story-${savedStory.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{savedStory.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {savedStory.content.substring(0, 100)}...
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{savedStory.artStyle}</span>
                            <span>{new Date(savedStory.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">No Stories Yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        You haven't created any stories yet. Start by creating your first story!
                      </p>
                      <Button onClick={() => setViewMode("create")} data-testid="button-get-started">
                        Get Started
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Book Preview Modal */}
      {showPreview && story && (
        <BookPreviewModal 
          story={story} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}