import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, Eye, BookmarkPlus, Lock, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import StoryInput from "@/components/StoryInput";
import PageGrid from "@/components/PageGrid";
import BookPreviewModal from "@/components/BookPreviewModal";
import { exportToPDF, type PDFExportProgress } from "@/lib/pdfExport";
import { exportToEPUB, type EPUBExportProgress } from "@/lib/epubExport";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type {
  Story,
  StoryWithPages,
  UserWithSubscriptionInfo,
  Template,
  GuestStoryStatus,
} from "@shared/schema";
import Header from "@/components/Header";
import UpgradeUser from "@/components/UpgradeUser";
import GuestActionLimitModal from "@/components/GuestActionLimitModal";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useLocalStorage } from "@/hooks/use-local-storage";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "epub" | null>(null);
  const [viewMode, setViewMode] = useState<"create" | "my-books">("create");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guestStories, setGuestStories] = useLocalStorage<Record<string, StoryWithPages>>("guest_stories", {});
  const [showGuestLimit, setShowGuestLimit] = useState(false);
  const [guestLimitAction, setGuestLimitAction] = useState("");
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  const handleShowGuestLimit = (action: string) => {
    setGuestLimitAction(action);
    setShowGuestLimit(true);
  };

  useEffect(() => {
    const images = ["/no-books-icon.svg", "/ready-to-create.svg"];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyIdFromUrl = params.get("story");
    const viewFromUrl = params.get("view");

    if (viewFromUrl === "my-books") {
      setViewMode("my-books");
    } else if (viewFromUrl === "create" || !viewFromUrl) {
      setViewMode("create");
    }

    if (storyIdFromUrl && storyIdFromUrl !== currentStoryId) {
      console.log("Story ID from URL:", storyIdFromUrl);
      setCurrentStoryId(storyIdFromUrl);
      setViewMode("create");
    }
  }, [location, currentStoryId]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout");
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.clear();

      if (data.logoutUrl) {
        window.location.href = data.logoutUrl;
      } else {
        setLocation("/home");
      }
    },
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/stories/${storyId}/save-as-template`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description:
          "Story saved as template! You can now find it in the Templates section.",
      });
    },
    onError: (error: any) => {
      if (error?.alreadyExists) {
        toast({
          title: "Already Saved",
          description:
            "This story is already saved as a template in your collection.",
          variant: "default",
        });
      } else if (error?.quotaExceeded) {
        toast({
          title: "📚 Template Limit Reached",
          description:
            error.error ||
            "You've used all your template books for this month. Upgrade your plan to save more templates!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error.message ||
            error.error ||
            "Failed to save as template. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("DELETE", `/api/stories/${storyId}`);
      if (!response.ok) {
        throw new Error("Failed to delete story");
      }
      return response.json();
    },
    onSuccess: (_, storyId) => {
      queryClient.setQueryData<Story[]>(["/api/stories"], (old) => {
        if (!old) return [];
        return old.filter((s) => s.id !== storyId);
      });

      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setStoryToDelete(null);
      toast({
        title: "Success",
        description: "Story deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    data: story,
    isLoading,
    isFetching,
  } = useQuery<StoryWithPages>({
    queryKey: ["/api/stories", currentStoryId],
    enabled: !!currentStoryId && !currentStoryId?.startsWith('guest_'),
    refetchInterval: (query) => {
      const storyData = query.state.data;
      const hasGeneratingPages = storyData?.pages?.some(
        (page) => page.isGenerating
      );
      return hasGeneratingPages ? 2000 : false;
    },
    gcTime: Infinity,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const currentGuestStory = currentStoryId && currentStoryId.startsWith('guest_') ? guestStories[currentStoryId] : null;

  const {
    data: guestStoryStatus,
    isLoading: isLoadingGuestStory,
  } = useQuery<GuestStoryStatus>({
    queryKey: ["/api/guest/stories", currentStoryId, "status"],
    enabled: !!currentStoryId && currentStoryId?.startsWith('guest_'),
    refetchInterval: (query) => {
      const storyData = query.state.data;
      if (!storyData) return 2000;
      
      const totalPages = currentGuestStory?.pages?.length || 0;
      const readyPages = storyData.pagesReady || 0;
      
      if (readyPages < totalPages || !storyData.coverReady) {
        return 2000;
      }
      return false;
    },
    gcTime: Infinity,
    staleTime: 0,
    refetchOnMount: 'always', 
    refetchOnWindowFocus: true,
  });

  const displayedGuestStory = currentGuestStory ? {
    ...currentGuestStory,
    coverImageUrl: guestStoryStatus?.coverReady ? guestStoryStatus.coverUrl : currentGuestStory.coverImageUrl,
    pages: currentGuestStory.pages.map((page, index) => {
      if (guestStoryStatus?.pageUrls && guestStoryStatus.pageUrls[index]) {
        return {
          ...page,
          imageUrl: guestStoryStatus.pageUrls[index],
          isGenerating: false
        };
      }
      return {
        ...page,
        isGenerating: true
      };
    })
  } : null;

  const activeStory = story || displayedGuestStory;

  const {
    data: userWithSubscription,
    isLoading: userLoading,
    error: userError,
  } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: allStories,
    isLoading: isLoadingStories,
    error: storiesError,
  } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    enabled: viewMode === "my-books",
  });

  const { data: userTemplates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const isAlreadySavedAsTemplate = activeStory
    ? userTemplates.some(
        (template) =>
          template.title === activeStory.title && template.content === activeStory.content
      )
    : false;

  const templateQuotaFull = userWithSubscription
    ? userWithSubscription.templateBooksRemaining === 0
    : false;

  const getStepStatus = (step: number) => {
    if (!activeStory) return "step-pending";

    switch (step) {
      case 1:
        return activeStory.content ? "step-completed" : "step-pending";
      case 2:
        return activeStory.pages && activeStory.pages.length > 0
          ? "step-completed"
          : "step-pending";
      case 3:
        return activeStory.status === "completed"
          ? "step-completed"
          : activeStory.status === "generating"
          ? "step-active"
          : activeStory.status === "error"
          ? "step-error"
          : "step-pending";
      case 4:
        return activeStory.status === "completed" ? "step-active" : "step-pending";
      default:
        return "step-pending";
    }
  };

  const handleExportPDF = async () => {
    if (!activeStory) return;

    if (activeStory.id.startsWith("guest_")) {
      handleShowGuestLimit("Exporting PDF");
      return;
    }

    const hasGeneratingPages = activeStory.pages?.some(
      (page) => page.isGenerating
    ) ?? false;

    if (hasGeneratingPages) {
      toast({
        title: "Please Wait",
        description:
          "Please wait until all illustrations are generated before downloading your book.",
        variant: "default",
      });
      return;
    }

    setIsExporting(true);
    setExportType("pdf");

    const progressToast = toast({
      title: "Preparing your book for download...",
      description: "This may take a moment. Please wait...",
      duration: Infinity,
    });

    try {
      await exportToPDF(activeStory, undefined, (progress: PDFExportProgress) => {
        const progressPercent = progress.progress;
        let description = progress.message;

        if (progress.current && progress.total) {
          description = `${progress.message} (${progress.current}/${progress.total})`;
        }

        progressToast.update({
          id: progressToast.id,
          title:
            progress.stage === "complete"
              ? "Download starting..."
              : "Exporting PDF...",
          description: (
            <div 
              className="space-y-2 w-full" 
              style={{ 
                width: '100%',
                display: 'block'
              }}
            >
              <p className="break-words w-full">{description}</p>
              {progress.stage !== "complete" && (
                <div 
                  className="bg-secondary rounded-full h-2 overflow-hidden w-full" 
                  style={{ 
                    width: '100%',
                    display: 'block'
                  }}
                >
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          ),
        });
      });

      progressToast.dismiss();
      toast({
        title: "Success",
        description: "Your book has been exported as a PDF!",
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      progressToast.dismiss();
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting your book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportEPUB = async () => {
    if (!activeStory) return;

    if (activeStory.id.startsWith("guest_")) {
      handleShowGuestLimit("Exporting EPUB");
      return;
    }

    const hasGeneratingPages = activeStory.pages?.some(
      (page) => page.isGenerating
    ) ?? false;

    if (hasGeneratingPages) {
      toast({
        title: "Please Wait",
        description:
          "Please wait until all illustrations are generated before downloading your book.",
        variant: "default",
      });
      return;
    }

    setIsExporting(true);
    setExportType("epub");

    const progressToast = toast({
      title: "Preparing your book for download...",
      description: "This may take a moment. Please wait...",
      duration: Infinity,
    });

    try {
      await exportToEPUB(activeStory, (progress: EPUBExportProgress) => {
        const progressPercent = progress.progress;
        let description = progress.message;

        if (progress.current && progress.total) {
          description = `${progress.message} (${progress.current}/${progress.total})`;
        }

        progressToast.update({
          id: progressToast.id,
          title:
            progress.stage === "complete"
              ? "Download starting..."
              : "Exporting EPUB...",
          description: (
            <div className="space-y-2 w-full" style={{ width: '100%', display: 'block' }}>
              <p className="break-words w-full">{description}</p>
              {progress.stage !== "complete" && (
                <div className="bg-secondary rounded-full h-2 overflow-hidden w-full" style={{ width: '100%', display: 'block' }}>
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          ),
        });
      });

      progressToast.dismiss();
      toast({
        title: "Success",
        description: "Your book has been exported as an EPUB!",
      });
    } catch (error) {
      console.error("EPUB export failed:", error);
      progressToast.dismiss();
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting your book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onHomeClick={() => setViewMode("create")}
        onMyBooksClick={() => setViewMode("my-books")}
        viewMode={viewMode}
      />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {viewMode === "create" && (
          <aside className="w-full lg:w-80 border-r border-border flex flex-col order-2 lg:order-1">
            <div className="p-4 sm:p-6 border-b border-border">
              <h2 className="text-base sm:text-lg font-serif font-semibold mb-3 sm:mb-4">
                Create Your Story
              </h2>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className={`step w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium`}
                  >
                    1
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    Story Input
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className={`step w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getStepStatus(
                      2
                    )} flex items-center justify-center text-xs sm:text-sm font-medium ${
                      getStepStatus(2) === "step-pending"
                        ? "text-muted-foreground"
                        : "text-white"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-xs sm:text-sm ${
                      getStepStatus(2) === "step-pending"
                        ? "text-muted-foreground"
                        : "font-medium"
                    }`}
                  >
                    Page Splitting
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className={`step w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getStepStatus(
                      3
                    )} flex items-center justify-center text-xs sm:text-sm font-medium ${
                      getStepStatus(3) === "step-pending"
                        ? "text-muted-foreground"
                        : "text-white"
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`text-xs sm:text-sm ${
                      getStepStatus(3) === "step-pending"
                        ? "text-muted-foreground"
                        : "font-medium"
                    }`}
                  >
                    AI Illustration
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className={`step w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getStepStatus(
                      4
                    )} flex items-center justify-center text-xs sm:text-sm font-medium ${
                      getStepStatus(4) === "step-pending"
                        ? "text-muted-foreground"
                        : "text-white"
                    }`}
                  >
                    4
                  </div>
                  <span
                    className={`text-xs sm:text-sm ${
                      getStepStatus(4) === "step-pending"
                        ? "text-muted-foreground"
                        : "font-medium"
                    }`}
                  >
                    Review & Export
                  </span>
                </div>
              </div>
            </div>

            <StoryInput
              onStoryCreated={(storyId, story) => {
                if (story && storyId.startsWith('guest_')) {
                  setGuestStories(prev => ({ ...prev, [storyId]: story as StoryWithPages }));
                }
                window.history.pushState({}, "", `/dashboard?story=${storyId}`);
                setCurrentStoryId(storyId);
              }}
            />
          </aside>
        )}

        <main className="flex-1 flex flex-col order-1 lg:order-2 min-w-0">
          {viewMode === "create" && (
            <>
              <div className="border-b border-border p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="min-w-0 flex-1">
                    <h2
                      className="text-base sm:text-lg font-serif font-semibold truncate"
                      data-testid="text-story-title"
                    >
                      {activeStory?.title || "Your Story Title"}
                    </h2>
                    <p className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground gap-1.5 sm:gap-2">
                      <span data-testid="text-page-count">
                        {activeStory?.pages?.length || 0} pages
                      </span>
                      <span>•</span>
                      <span data-testid="text-word-count">
                        {activeStory?.content?.split(" ").length || 0} words
                      </span>
                      <span>•</span>
                      <span
                        className={`${
                          activeStory?.status === "error"
                            ? "text-destructive"
                            : "text-chart-2"
                        }`}
                        data-testid="text-story-status"
                      >
                        {activeStory?.status === "completed"
                          ? "Ready for illustration"
                          : activeStory?.status === "generating"
                          ? "Generating..."
                          : activeStory?.status === "error"
                          ? "Generation Failed"
                          : "Draft"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      disabled={!activeStory || activeStory.pages.length === 0}
                      data-testid="button-preview"
                      className="text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      <Eye size={14} className="mr-1" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (templateQuotaFull) {
                          setLocation("/subscription");
                        } else if (activeStory) {
                          saveAsTemplateMutation.mutate(activeStory.id);
                        }
                      }}
                      disabled={
                        !activeStory ||
                        activeStory.pages.length === 0 ||
                        saveAsTemplateMutation.isPending ||
                        (isAlreadySavedAsTemplate && !templateQuotaFull)
                      }
                      data-testid="button-save-template"
                      title={
                        templateQuotaFull
                          ? "Upgrade to save more templates"
                          : isAlreadySavedAsTemplate
                          ? "This story is already saved as a template"
                          : "Save this story as a template"
                      }
                      className="text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      {saveAsTemplateMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                      ) : templateQuotaFull ? (
                        <Lock size={14} className="mr-1" />
                      ) : (
                        <BookmarkPlus size={14} className="mr-1" />
                      )}
                      <span className="hidden sm:inline">
                        {saveAsTemplateMutation.isPending
                          ? "Saving..."
                          : templateQuotaFull
                          ? "Upgrade to Save More"
                          : isAlreadySavedAsTemplate
                          ? "Already Saved"
                          : "Save as Template"}
                      </span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          disabled={
                            !activeStory || activeStory.pages.length === 0 || isExporting
                          }
                          data-testid="button-export-dropdown"
                          className="text-xs sm:text-sm flex-1 sm:flex-initial"
                        >
                          {isExporting ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                          ) : (
                            <Download size={14} className="mr-1" />
                          )}
                          <span className="hidden sm:inline">
                            {isExporting ? "Exporting..." : "Export"}
                          </span>
                          <ChevronDown size={14} className="ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                          <Download size={14} className="mr-2" />
                          <span>Export as PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportEPUB} className="cursor-pointer">
                          <BookOpen size={14} className="mr-2" />
                          <span>Export as EPUB</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {activeStory?.status === "error" && (
                <div className="bg-destructive/10 border-l-4 border-destructive px-3 sm:px-4 py-2 sm:py-3 mx-3 sm:mx-6 mt-3 sm:mt-4 rounded-r-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-medium text-destructive">
                        Image Generation Failed
                      </h3>
                      <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-destructive/80">
                        <p>
                          The AI illustration process encountered an error. This
                          could be due to:
                        </p>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>
                            API quota exceeded - Please wait and try again later
                          </li>
                          <li>
                            Request timeout - Try with a shorter story or
                            simpler requirements
                          </li>
                          <li>
                            Temporary service issues - Please retry in a few
                            moments
                          </li>
                        </ul>
                        <p className="mt-2">
                          You can retry generation by clicking "Generate Book
                          Pages" in the sidebar or regenerate individual page
                          images below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Loading story...
                      </p>
                    </div>
                  </div>
                ) : activeStory ? (
                  <PageGrid story={activeStory} onShowGuestLimit={handleShowGuestLimit} />
                ) : guestStoryStatus && currentStoryId?.startsWith('guest_') ? (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Your Story is Generating!</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {guestStoryStatus.coverReady ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                              ✓
                            </div>
                            <div>
                              <p className="font-medium">Cover Image Ready</p>
                              {guestStoryStatus.coverUrl && (
                                <img src={guestStoryStatus.coverUrl} alt="Cover" className="mt-2 w-32 h-32 object-cover rounded" />
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white animate-spin">
                              ⟳
                            </div>
                            <p className="font-medium">Generating cover...</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {guestStoryStatus.pagesReady > 0 ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                              {guestStoryStatus.pagesReady}
                            </div>
                            <div>
                              <p className="font-medium">{guestStoryStatus.pagesReady} Pages Generated</p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {guestStoryStatus.pageUrls?.slice(0, 4).map((url: string, idx: number) => (
                                  <img key={idx} src={url} alt={`Page ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white animate-spin">
                              ⟳
                            </div>
                            <p className="font-medium">Generating pages...</p>
                          </>
                        )}
                      </div>
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Guest stories are not saved. Sign up to save your work and access all features!
                        </p>
                      </div>
                    </div>
                  </div>

                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center px-4">
                    <motion.div
                      className="flex items-center justify-center mb-6 h-64 w-full"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <img
                        src="/ready-to-create.svg"
                        alt="Ready to Create"
                        className="h-full w-auto object-contain"
                      />
                    </motion.div>
                    <p className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                      Ready to Create?
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Enter your story details in the sidebar to get started.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "my-books" && (
            <>
              <UpgradeUser 
                show={userWithSubscription?.subscriptionPlan === 'guest'}
                message="Save your stories! Sign up to access your book library."
              />
              <div className="border-b border-border p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="text-black">
                    <h2 className="text-base sm:text-lg font-serif font-semibold">
                      My Books
                    </h2>
                    <p className="text-xs sm:text-sm">
                      {allStories?.length || 0} saved stories
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("create")}
                    data-testid="button-create-new"
                    className="text-black w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Create New Story
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
                {isLoadingStories ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-sm sm:text-base text-black">
                        Loading stories...
                      </p>
                    </div>
                  </div>
                ) : allStories?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {allStories.map((savedStory) => {
                      return (
                        <div
                          key={savedStory.id}
                          className="rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                          onClick={() => {
                            window.history.pushState(
                              {},
                              "",
                              `/dashboard?story=${savedStory.id}`
                            );
                            setCurrentStoryId(savedStory.id);
                            setViewMode("create");
                          }}
                          data-testid={`card-story-${savedStory.id}`}
                        >
                          <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 relative overflow-hidden flex-shrink-0">
                            {savedStory.coverImageUrl ? (
                              <img
                                src={savedStory.coverImageUrl}
                                alt={`${savedStory.title} cover`}
                                className="w-full h-full object-cover text-black"
                                data-testid={`img-cover-${savedStory.id}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen
                                  size={48}
                                  className="text-black"
                                />
                              </div>
                            )}
                          </div>

                          <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 text-black relative">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate flex-1 min-w-0 pr-8">
                                {savedStory.title}
                               </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10 absolute top-3 sm:top-4 right-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoryToDelete(savedStory.id);
                                }}
                                data-testid={`button-delete-story-${savedStory.id}`}
                                title="Delete story"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 flex-shrink-0">
                              {savedStory.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center justify-between text-[10px] sm:text-xs mt-auto">
                              <span className="truncate flex-1 min-w-0 pr-2">
                                {savedStory.artStyle}
                              </span>
                              <span className="flex-shrink-0">
                                {new Date(
                                  savedStory.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="text-center px-4">
                      <motion.div
                        className="flex items-center justify-center mb-6 h-64 w-full"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <img
                          src="/no-books-icon.svg"
                          alt="No Books"
                          className="h-full w-auto object-contain"
                        />
                      </motion.div>
                      <p className="text-base sm:text-lg font-medium text-black mb-2">
                        No Stories Yet
                      </p>
                      <p className="text-xs sm:text-sm text-black mb-4">
                        You haven't created any stories yet. Start by creating
                        your first story!
                      </p>
                      <Button
                        onClick={() => setViewMode("create")}
                        data-testid="button-get-started"
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
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

      {showPreview && activeStory && (
        <BookPreviewModal
          story={activeStory}
          onClose={() => setShowPreview(false)}
          onShowGuestLimit={handleShowGuestLimit}
        />
      )}
      <GuestActionLimitModal
        open={showGuestLimit}
        onClose={() => setShowGuestLimit(false)}
        action={guestLimitAction}
      />
      <AlertDialog open={!!storyToDelete} onOpenChange={(open) => {
        if (!deleteStoryMutation.isPending) {
          if (!open) setStoryToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your story and all its illustrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStoryMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[80px]"
              disabled={deleteStoryMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (storyToDelete) {
                  deleteStoryMutation.mutate(storyToDelete);
                }
              }}
            >
              {deleteStoryMutation.isPending ? (
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