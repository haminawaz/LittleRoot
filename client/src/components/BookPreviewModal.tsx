import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, validateStoryForExport } from "@/lib/pdfExport";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { StoryWithPages } from "@shared/schema";

interface BookPreviewModalProps {
  story: StoryWithPages;
  onClose: () => void;
}

export default function BookPreviewModal({
  story,
  onClose,
}: BookPreviewModalProps) {
  // Start at -1 to show cover first, then 0-N for story pages
  const [currentPage, setCurrentPage] = useState(
    (story as any).coverImageUrl ? -1 : 0
  );
  const [isExporting, setIsExporting] = useState(false);
  const [coverRegenerating, setCoverRegenerating] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Total pages including cover (if exists)
  const hasCover = !!(story as any).coverImageUrl;
  const totalPages = story.pages.length + (hasCover ? 1 : 0);
  const minPage = hasCover ? -1 : 0;

  const maxPage = story.pages.length - 1;

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, maxPage));
  };

  const previousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, minPage));
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    // Close navigation on mobile after selection
    setNavOpen(false);
  };

  // Regenerate cover mutation
  const regenerateCoverMutation = useMutation({
    mutationFn: async () => {
      setCoverRegenerating(true);
      const response = await apiRequest(
        "POST",
        `/api/stories/${story.id}/regenerate-cover`
      );
      return response.json();
    },
    onSuccess: () => {
      // Start polling for updated cover
      const pollInterval = setInterval(async () => {
        await queryClient.refetchQueries({
          queryKey: ["/api/stories", story.id],
        });
      }, 2000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        setCoverRegenerating(false);
      }, 30000);

      toast({
        title: "Success",
        description: "Cover page is being regenerated! It will update shortly.",
      });
    },
    onError: (error: any) => {
      setCoverRegenerating(false);
      toast({
        title: "Error",
        description:
          error.message || "Failed to regenerate cover. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfUrl = (story as any).pdfUrl;

      // If pre-generated PDF exists, download it instantly!
      if (pdfUrl) {
        console.log("📄 Downloading pre-generated PDF:", pdfUrl);

        // Create download link
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${story.title.replace(/[^a-zA-Z0-9]/g, "_")}_KDP.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Success! ⚡",
          description: "PDF downloaded instantly! Ready for Amazon KDP upload.",
        });
      } else {
        // Fallback to client-side generation if no pre-generated PDF exists
        console.log(
          "⚠️ No pre-generated PDF found, generating client-side (this may take a while)..."
        );

        const validation = validateStoryForExport(story);

        if (!validation.isValid) {
          toast({
            title: "Export Warning",
            description:
              validation.errors.join(". ") +
              ". Export will continue but may not meet KDP standards.",
            variant: "destructive",
          });
        }

        await exportToPDF(story, {
          format: "kdp-6x9",
          includeImages: true,
          pageMargins: { top: 36, bottom: 36, left: 36, right: 36 },
        });

        toast({
          title: "Success",
          description:
            "PDF exported successfully! Ready for Amazon KDP upload.",
        });
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageData = currentPage === -1 ? null : story.pages[currentPage];
  const isCoverPage = currentPage === -1;

  // Check if any pages are still generating
  const hasGeneratingPages = story.pages.some((page) => page.isGenerating);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] sm:max-h-[95vh] overflow-hidden p-0 h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="p-4 sm:p-5 lg:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-serif font-semibold">
                Book Preview
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Banner for generating illustrations */}
        {hasGeneratingPages && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-primary">
              <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full flex-shrink-0"></div>
              <p className="font-medium">
                Illustrations are still being created, please wait...
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Book Viewer */}
          <div className="flex-1 bg-muted/30 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 flex items-center justify-center min-w-0 min-h-0 overflow-auto">
            <div className="bg-white shadow-2xl max-w-2xl w-full h-full flex flex-col overflow-hidden rounded-lg">
              {isCoverPage ? (
                <div className="flex-1 overflow-y-auto relative">
                  {(story as any).coverImageUrl ? (
                    <>
                      <img
                        src={(story as any).coverImageUrl}
                        alt="Book cover"
                        className="w-full h-auto"
                        data-testid="img-preview-cover"
                      />
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => regenerateCoverMutation.mutate()}
                          disabled={
                            regenerateCoverMutation.isPending ||
                            coverRegenerating
                          }
                          className="shadow-lg"
                          data-testid="button-regenerate-cover"
                        >
                          {regenerateCoverMutation.isPending ||
                          coverRegenerating ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={14} className="mr-2" />
                              Regenerate Cover
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-center text-muted-foreground">
                      <div>
                        <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          📘
                        </div>
                        <p className="text-sm">Cover being generated...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : currentPageData ? (
                <div className="flex-1 overflow-y-auto relative">
                  {currentPageData.isGenerating ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-foreground mb-1">
                                Creating Magic
                              </p>
                              <p className="text-xs text-muted-foreground">
                                AI is painting your illustration...
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : currentPageData.imageUrl ? (
                    <img
                      src={currentPageData.imageUrl}
                      alt={`Page ${currentPageData.pageNumber} illustration`}
                      className="w-full h-auto"
                      data-testid={`img-preview-page-${currentPageData.pageNumber}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          📖
                        </div>
                        <p className="text-sm">No illustration</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>No pages available</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Toggle Button */}
          <div className="lg:hidden border-t border-border bg-card p-3 flex items-center justify-between flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNavOpen(!navOpen)}
              className="w-full"
            >
              {navOpen ? (
                <>
                  <X size={16} className="mr-2" />
                  Close Navigation
                </>
              ) : (
                <>
                  <Menu size={16} className="mr-2" />
                  Page Navigation ({story.pages.length + (hasCover ? 1 : 0)})
                </>
              )}
            </Button>
          </div>

          {/* Page Navigation */}
          <div
            className={`
            ${navOpen ? "flex" : "hidden"} lg:flex
            flex-col
            w-full lg:w-80
            border-t lg:border-t-0 lg:border-l border-border
            bg-card lg:bg-card/50
            backdrop-blur-md lg:backdrop-blur-none
            z-10 lg:z-auto
            lg:relative
            ${navOpen ? "absolute lg:static inset-0 lg:inset-auto" : ""}
            lg:min-w-[280px] lg:max-w-[320px]
            shadow-xl lg:shadow-none
          `}
          >
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between bg-card/50">
              <h4 className="font-semibold text-sm sm:text-base">
                Page Navigation
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNavOpen(false)}
                className="lg:hidden h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 sm:space-y-2.5">
              {/* Cover Page Navigation Button */}
              {hasCover && (
                <button
                  onClick={() => goToPage(-1)}
                  className={`w-full p-2.5 sm:p-3 text-left border-2 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-200 ${
                    currentPage === -1
                      ? "bg-primary/15 border-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                  data-testid="button-nav-cover"
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="w-10 h-14 sm:w-12 sm:h-16 bg-muted rounded overflow-hidden flex-shrink-0 shadow-sm">
                      {(story as any).coverImageUrl ? (
                        <img
                          src={(story as any).coverImageUrl}
                          alt="Cover thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                          📘
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Cover Page
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {story.title}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Story Pages Navigation */}
              {story.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(index)}
                  className={`w-full p-2.5 sm:p-3 text-left border-2 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-200 ${
                    index === currentPage
                      ? "bg-primary/15 border-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                  data-testid={`button-nav-page-${page.pageNumber}`}
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="w-10 h-14 sm:w-12 sm:h-16 bg-muted rounded overflow-hidden relative flex-shrink-0 shadow-sm">
                      {page.isGenerating ? (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 flex items-center justify-center">
                          <div className="relative">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          </div>
                        </div>
                      ) : page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={`Page ${page.pageNumber} thumbnail`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                          📖
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Page {page.pageNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                        {page.isGenerating ? (
                          <span className="text-primary font-medium">
                            Generating illustration...
                          </span>
                        ) : (
                          `${page.text.substring(0, 35)}${
                            page.text.length > 35 ? "..." : ""
                          }`
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-t border-border bg-card/50 flex-shrink-0">
          <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-4 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={currentPage === minPage}
              data-testid="button-previous-page"
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft size={16} className="mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span
              className="text-xs sm:text-sm text-muted-foreground font-medium px-2 sm:px-0"
              data-testid="text-page-indicator"
            >
              {isCoverPage
                ? "Cover"
                : `Page ${currentPage + 1} of ${story.pages.length}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === story.pages.length - 1}
              data-testid="button-next-page"
              className="flex-1 sm:flex-initial"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} className="ml-1 sm:ml-1.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            data-testid="button-export-pdf"
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1.5"></div>
            ) : (
              <Download size={16} className="mr-1.5" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? "Exporting..." : "Export PDF"}
            </span>
            <span className="sm:hidden">
              {isExporting ? "Exporting..." : "Export"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
