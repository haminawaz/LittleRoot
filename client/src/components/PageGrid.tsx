import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RotateCcw, Loader2, Trash2, Scissors, ChevronUp, ChevronDown, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StoryWithPages, Page } from "@shared/schema";
import DeleteModal from "@/components/DeleteModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface PageGridProps {
  story: StoryWithPages;
}

export default function PageGrid({ story }: PageGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [splitMode, setSplitMode] = useState<string | null>(null);
  const [splitIndex, setSplitIndex] = useState<number>(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [addPageModalOpen, setAddPageModalOpen] = useState(false);
  const [newPageText, setNewPageText] = useState("");
  
  // Track current text for each page (for live regeneration)
  const [pageTexts, setPageTexts] = useState<Record<string, string>>(() => {
    const initialTexts: Record<string, string> = {};
    story.pages.forEach(page => {
      initialTexts[page.id] = page.text;
    });
    return initialTexts;
  });

  // Sync pageTexts when story.pages changes (e.g., after adding/deleting/reordering pages)
  useEffect(() => {
    const updatedTexts: Record<string, string> = {};
    story.pages.forEach(page => {
      // Keep existing local edits if they exist, otherwise use server text
      updatedTexts[page.id] = pageTexts[page.id] !== undefined ? pageTexts[page.id] : page.text;
    });
    setPageTexts(updatedTexts);
  }, [story.pages.length, story.pages.map(p => p.id).join(',')]);

  const generateImageMutation = useMutation({
    mutationFn: async ({ pageId, text }: { pageId: string; text: string }) => {
      const response = await apiRequest("POST", `/api/pages/${pageId}/generate-image`, { text });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json() as Promise<Page>;
    },
    onMutate: async ({ pageId }: { pageId: string; text: string }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/stories", story.id] });
      
      // Optimistically update to show generating state
      const previousStory = queryClient.getQueryData(["/api/stories", story.id]);
      
      queryClient.setQueryData(["/api/stories", story.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: Page) => 
            p.id === pageId ? { ...p, isGenerating: true } : p
          )
        };
      });
      
      return { previousStory };
    },
    onSuccess: async (updatedPage) => {
      // Force a refetch to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      await queryClient.refetchQueries({ queryKey: ["/api/stories", story.id] });
      
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    },
    onError: (error: any, pageId, context) => {
      // Rollback to previous state on error
      if (context?.previousStory) {
        queryClient.setQueryData(["/api/stories", story.id], context.previousStory);
      }
      
      // Check if it's a quota exceeded error
      if (error?.quotaExceeded) {
        toast({
          title: "✨ Bonus Variation Limit Reached",
          description: error.error || "You've used all your bonus variations for this month. Upgrade your plan to regenerate more images!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || error.error || "Failed to generate image. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, text }: { pageId: string; text: string }) => {
      const response = await apiRequest("PUT", `/api/pages/${pageId}`, { text });
      return response.json() as Promise<Page>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      toast({
        title: "Saved",
        description: "Text saved successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateImage = (pageId: string) => {
    // Use the current text from local state (live textarea value)
    const currentText = pageTexts[pageId] || "";
    generateImageMutation.mutate({ pageId, text: currentText });
  };

  const addPageMutation = useMutation({
    mutationFn: async ({ storyId, pageNumber, text }: { storyId: string; pageNumber: number; text: string }) => {
      const response = await apiRequest("POST", "/api/pages", { storyId, pageNumber, text });
      return response.json() as Promise<Page>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      setAddPageModalOpen(false);
      setNewPageText("");
      toast({
        title: "Success",
        description: "Page added successfully! Image is being generated...",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await apiRequest("DELETE", `/api/pages/${pageId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const splitPageMutation = useMutation({
    mutationFn: async ({ pageId, splitIndex }: { pageId: string; splitIndex: number }) => {
      const response = await apiRequest("POST", `/api/pages/${pageId}/split`, { splitIndex });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const currentText = pageTexts[variables.pageId] || story.pages.find(p => p.id === variables.pageId)?.text || "";
      const firstHalf = currentText.substring(0, variables.splitIndex).trim();

      setPageTexts(prev => ({
        ...prev,
        [variables.pageId]: firstHalf
      }));
      
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      setSplitMode(null);
      splitPageMutation.reset();
      toast({
        title: "Success",
        description: "Page split successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to split page. Please try again.",
        variant: "destructive",
      });
    },
  });


  const reorderPagesMutation = useMutation({
    mutationFn: async (pageOrder: string[]) => {
      const response = await apiRequest("POST", `/api/stories/${story.id}/reorder-pages`, { pageOrder });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      toast({
        title: "Success",
        description: "Pages reordered successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder pages. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTextChange = (pageId: string, text: string) => {
    // Update local state immediately for live editing
    setPageTexts(prev => ({ ...prev, [pageId]: text }));
  };

  const handleSaveText = (pageId: string) => {
    const currentText = pageTexts[pageId];
    if (currentText !== undefined) {
      updatePageMutation.mutate({ pageId, text: currentText });
    }
  };

  const hasMultipleWords = (pageId: string) => {
    const currentText = (pageTexts[pageId] || story.pages.find(p => p.id === pageId)?.text || "").trim();
    const words = currentText.split(/\s+/).filter(word => word.length > 0);
    return words.length > 1;
  };

  const handleAddPage = () => {
    setAddPageModalOpen(true);
  };

  const handleSubmitNewPage = () => {
    if (!newPageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some story content.",
        variant: "destructive",
      });
      return;
    }
    
    const newPageNumber = story.pages.length + 1;
    addPageMutation.mutate({
      storyId: story.id,
      pageNumber: newPageNumber,
      text: newPageText.trim(),
    });
  };

  const handleDeletePage = (pageId: string) => {
    setPageToDelete(pageId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pageToDelete) {
      deletePageMutation.mutate(pageToDelete);
      // Remove from local state
      setPageTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[pageToDelete];
        return newTexts;
      });
      setPageToDelete(null);
    }
  };

  const handleSplitPage = (pageId: string) => {
    if (splitMode === pageId) {
      // Ensure we have a valid split index
      const validSplitIndex = splitIndex > 0 ? splitIndex : Math.floor((story.pages.find(p => p.id === pageId)?.text.length || 0) / 2);
      if (validSplitIndex <= 0) {
        toast({
          title: "Error",
          description: "Please click in the text to choose where to split the page.",
          variant: "destructive",
        });
        return;
      }
      splitPageMutation.mutate({ pageId, splitIndex: validSplitIndex });
    } else {
      const page = story.pages.find(p => p.id === pageId);
      setSplitMode(pageId);
      // Set default split index to middle of text
      setSplitIndex(Math.floor((page?.text.length || 0) / 2));
    }
  };

  const handleReorderPage = (pageId: string, direction: "up" | "down") => {
    const currentIndex = story.pages.findIndex(p => p.id === pageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= story.pages.length) return;

    const newOrder = [...story.pages];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    reorderPagesMutation.mutate(newOrder.map(p => p.id));
  };

  const coverImageUrl = (story as any).coverImageUrl;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {coverImageUrl && (
          <div 
            className="bg-card book-shadow overflow-hidden group hover:shadow-lg transition-shadow"
            data-testid="card-cover"
          >
            <div className="bg-muted/50 px-2 sm:px-3 py-2 sm:py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xs sm:text-sm font-medium">Cover</span>
              </div>
            </div>

            <div className="aspect-[3/4] bg-gradient-to-br from-purple-50 to-pink-50 relative">
              <img
                src={coverImageUrl}
                alt="Book cover"
                className="w-full h-full object-cover"
                data-testid="img-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4">
                <span className="bg-white/90 text-xs px-2 py-1 rounded-full font-medium">
                  Cover
                </span>
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs text-muted-foreground text-center">
                {story.title}
              </p>
            </div>
          </div>
        )}

        {story.pages.map((page) => (
          <div 
            key={page.id} 
            className="bg-card book-shadow overflow-hidden group hover:shadow-lg transition-shadow"
            data-testid={`card-page-${page.pageNumber}`}
            data-page-id={page.id}
          >
            {/* Page Header with Controls */}
            <div className="bg-muted/50 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xs sm:text-sm font-medium">Page {page.pageNumber}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReorderPage(page.id, "up")}
                  disabled={page.pageNumber === 1 || reorderPagesMutation.isPending}
                  className="w-7 h-7 p-0 hover:bg-accent"
                  title="Move page up"
                  data-testid={`button-move-up-${page.pageNumber}`}
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReorderPage(page.id, "down")}
                  disabled={page.pageNumber === story.pages.length || reorderPagesMutation.isPending}
                  className="w-7 h-7 p-0 hover:bg-accent"
                  title="Move page down"
                  data-testid={`button-move-down-${page.pageNumber}`}
                >
                  <ChevronDown size={14} />
                </Button>
              </div>
            </div>

            <div className="aspect-[3/4] bg-gradient-to-br from-blue-50 to-green-50 relative">
              {page.imageUrl && !page.isGenerating ? (
                <img
                  key={page.imageUrl}
                  src={page.imageUrl}
                  alt={`Page ${page.pageNumber} illustration`}
                  className="w-full h-full object-cover"
                  data-testid={`img-page-${page.pageNumber}`}
                />
              ) : !page.isGenerating ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      📖
                    </div>
                    <p className="text-sm">No illustration</p>
                  </div>
                </div>
              ) : null}

              {!page.isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              )}
              
              {!page.isGenerating && (
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 text-xs px-2 py-1 rounded-full font-medium">
                    Page {page.pageNumber}
                  </span>
                </div>
              )}

              {page.isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 flex items-center justify-center">
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
                          <p className="text-sm font-semibold text-foreground mb-1">Creating Magic</p>
                          <p className="text-xs text-muted-foreground">AI is painting your illustration...</p>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!page.isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerateImage(page.id)}
                    disabled={generateImageMutation.isPending}
                    className="shadow-lg"
                    data-testid={`button-regenerate-${page.pageNumber}`}
                  >
                    <RotateCcw size={14} className="mr-1" />
                    {page.imageUrl ? 'Regenerate' : 'Generate'}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4">
              {splitMode === page.id ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Click in the text to choose where to split the page:
                  </div>
                  <Textarea
                    value={pageTexts[page.id] || page.text}
                    onKeyDown={(e) => {
                      const allowedKeys = [
                        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                        'Home', 'End', 'PageUp', 'PageDown',
                        'Tab', 'Escape'
                      ];
                      if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'a' || e.key === 'c') {
                          return;
                        }
                        if (e.key === 'v' || e.key === 'x') {
                          e.preventDefault();
                          return;
                        }
                        return;
                      }
                      if (!allowedKeys.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                    }}
                    onCut={(e) => {
                      e.preventDefault();
                    }}
                    onChange={(e) => {
                      const textarea = e.target as HTMLTextAreaElement;
                      setSplitIndex(textarea.selectionStart || 0);
                    }}
                    onSelect={(e) => setSplitIndex((e.target as HTMLTextAreaElement).selectionStart || 0)}
                    onClick={(e) => setSplitIndex((e.target as HTMLTextAreaElement).selectionStart || 0)}
                    className="w-full text-sm bg-muted/50 border border-primary resize-none focus:outline-none focus:ring-2 focus:ring-ring rounded p-2 cursor-text"
                    rows={3}
                    data-testid={`textarea-page-${page.pageNumber}`}
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSplitPage(page.id)}
                      disabled={splitPageMutation.isPending}
                      data-testid={`button-confirm-split-${page.pageNumber}`}
                    >
                      {splitPageMutation.isPending ? 'Splitting...' : 'Confirm Split'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSplitMode(null)}
                      data-testid={`button-cancel-split-${page.pageNumber}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Textarea
                    value={pageTexts[page.id] || page.text}
                    onChange={(e) => handleTextChange(page.id, e.target.value)}
                    className="w-full text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-ring rounded p-2"
                    rows={3}
                    data-testid={`textarea-page-${page.pageNumber}`}
                  />
                  <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSaveText(page.id)}
                      disabled={
                        updatePageMutation.isPending || 
                        pageTexts[page.id] === undefined || 
                        pageTexts[page.id] === page.text
                      }
                      data-testid={`button-save-${page.pageNumber}`}
                    >
                      <Save size={12} className="mr-1" />
                      {updatePageMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSplitPage(page.id)}
                      disabled={
                        updatePageMutation.isPending || 
                        pageTexts[page.id] === undefined || 
                        pageTexts[page.id] !== page.text ||
                        !hasMultipleWords(page.id)
                      }
                      data-testid={`button-split-${page.pageNumber}`}
                    >
                      <Scissors size={12} className="mr-1" />
                      Split
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                      disabled={deletePageMutation.isPending}
                      data-testid={`button-delete-${page.pageNumber}`}
                    >
                      <Trash2 size={12} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Page */}
        <div 
          className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors cursor-pointer group"
          onClick={handleAddPage}
          data-testid="button-add-page"
        >
        <div className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Plus size={20} />
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
            Add New Page
          </p>
        </div>
        </div>
      </div>

      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) {
            setPageToDelete(null);
          }
        }}
        message="Are you sure you want to delete this page? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        title="Delete Page"
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Dialog 
        open={addPageModalOpen} 
        onOpenChange={(open) => {
          setAddPageModalOpen(open);
          if (!open) {
            setNewPageText("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
            <DialogDescription>
              Enter your story content for this page. An illustration will be automatically generated based on your text.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={newPageText}
              onChange={(e) => setNewPageText(e.target.value)}
              placeholder="Enter your story text here..."
              className="min-h-[200px] resize-none"
              rows={8}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddPageModalOpen(false);
                setNewPageText("");
              }}
              disabled={addPageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitNewPage}
              disabled={addPageMutation.isPending || !newPageText.trim()}
            >
              {addPageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
