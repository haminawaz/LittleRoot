import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, validateStoryForExport } from "@/lib/pdfExport";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { StoryWithPages } from "@shared/schema";

interface BookPreviewModalProps {
  story: StoryWithPages;
  onClose: () => void;
}

export default function BookPreviewModal({ story, onClose }: BookPreviewModalProps) {
  // Start at -1 to show cover first, then 0-N for story pages
  const [currentPage, setCurrentPage] = useState((story as any).coverImageUrl ? -1 : 0);
  const [isExporting, setIsExporting] = useState(false);
  const [coverRegenerating, setCoverRegenerating] = useState(false);
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
  };
  
  // Regenerate cover mutation
  const regenerateCoverMutation = useMutation({
    mutationFn: async () => {
      setCoverRegenerating(true);
      const response = await apiRequest("POST", `/api/stories/${story.id}/regenerate-cover`);
      return response.json();
    },
    onSuccess: () => {
      // Start polling for updated cover
      const pollInterval = setInterval(async () => {
        await queryClient.refetchQueries({ queryKey: ["/api/stories", story.id] });
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
        description: error.message || "Failed to regenerate cover. Please try again.",
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
        console.log('📄 Downloading pre-generated PDF:', pdfUrl);
        
        // Create download link
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}_KDP.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success! ⚡",
          description: "PDF downloaded instantly! Ready for Amazon KDP upload.",
        });
      } else {
        // Fallback to client-side generation if no pre-generated PDF exists
        console.log('⚠️ No pre-generated PDF found, generating client-side (this may take a while)...');
        
        const validation = validateStoryForExport(story);
        
        if (!validation.isValid) {
          toast({
            title: "Export Warning",
            description: validation.errors.join('. ') + ". Export will continue but may not meet KDP standards.",
            variant: "destructive",
          });
        }

        await exportToPDF(story, {
          format: 'kdp-6x9',
          includeImages: true,
          pageMargins: { top: 36, bottom: 36, left: 36, right: 36 }
        });

        toast({
          title: "Success",
          description: "PDF exported successfully! Ready for Amazon KDP upload.",
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-serif font-semibold">
                Book Preview
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Book Viewer */}
          <div className="flex-1 bg-muted/30 p-8 flex items-center justify-center">
            <div className="bg-white shadow-2xl max-w-2xl w-full h-full flex flex-col overflow-hidden">
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
                          disabled={regenerateCoverMutation.isPending || coverRegenerating}
                          className="shadow-lg"
                          data-testid="button-regenerate-cover"
                        >
                          {(regenerateCoverMutation.isPending || coverRegenerating) ? (
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
                  {currentPageData.imageUrl ? (
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

          {/* Page Navigation */}
          <div className="w-80 border-l border-border bg-card/50">
            <div className="p-4 border-b border-border">
              <h4 className="font-medium text-sm">Page Navigation</h4>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto h-full">
              {/* Cover Page Navigation Button */}
              {hasCover && (
                <button
                  onClick={() => goToPage(-1)}
                  className={`w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors ${
                    currentPage === -1 ? 'bg-primary/10 border-primary' : 'border-border'
                  }`}
                  data-testid="button-nav-cover"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-muted rounded overflow-hidden">
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
                      <p className="text-sm font-medium">Cover Page</p>
                      <p className="text-xs text-muted-foreground truncate">
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
                  className={`w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors ${
                    index === currentPage ? 'bg-primary/10 border-primary' : 'border-border'
                  }`}
                  data-testid={`button-nav-page-${page.pageNumber}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                      {page.imageUrl ? (
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
                      <p className="text-sm font-medium">Page {page.pageNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {page.text.substring(0, 40)}...
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={currentPage === minPage}
              data-testid="button-previous-page"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground" data-testid="text-page-indicator">
              {isCoverPage ? 'Cover' : `Page ${currentPage + 1} of ${story.pages.length}`}
            </span>
            <Button
              variant="outline"
              onClick={nextPage}
              disabled={currentPage === story.pages.length - 1}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting}
            data-testid="button-export-pdf"
          >
            {isExporting ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
            ) : (
              <Download size={16} className="mr-1" />
            )}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
