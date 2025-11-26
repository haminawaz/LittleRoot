import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, User, Lock, Sparkles, Crown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Story, GenerateBookRequest, UserWithSubscriptionInfo } from "@shared/schema";

interface StoryInputProps {
  onStoryCreated: (storyId: string) => void;
}

export default function StoryInput({ onStoryCreated }: StoryInputProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [artStyle, setArtStyle] = useState("watercolor");
  const [pagesCount, setPagesCount] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get user subscription info to check for formatting options
  const { data: user } = useQuery<UserWithSubscriptionInfo>({
    queryKey: ["/api/auth/user"],
  });

  // Check if user has reached book creation limit
  const bookLimitReached = user ? !user.canCreateNewBook : false;

  const createStoryMutation = useMutation({
    mutationFn: async (data: GenerateBookRequest) => {
      const response = await apiRequest("POST", "/api/stories", data);
      return response.json() as Promise<Story>;
    },
    onSuccess: (story) => {
      onStoryCreated(story.id);
      generateBookMutation.mutate(story.id);
    },
    onError: (error: any) => {
      let title = "Error";
      let description = "Failed to create story. Please try again.";
      
      console.error('Story creation error:', error);
      
      // Extract JSON from error message (format: "403: {json}")
      const errorMessage = error.message || '';
      const jsonMatch = errorMessage.match(/\{.*\}/);
      
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[0]);
          
          // Handle book limit reached
          if (errorData.error === "Book limit reached" || errorData.requiresUpgrade) {
            title = "📚 Book Limit Reached";
            description = errorData.message || "You've reached your book creation limit for this month. Please upgrade your subscription to create more books.";
          }
        } catch (parseError) {
          console.error('Failed to parse error JSON:', parseError);
        }
      }
      
      // Fallback: check for "Book limit reached" anywhere in message
      if (errorMessage.includes("Book limit reached")) {
        title = "📚 Book Limit Reached";
        description = "You've reached your monthly book creation limit. Please upgrade your subscription to create more books.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const generateBookMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/generate`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Generation failed');
        (error as any).status = response.status;
        (error as any).userFriendly = errorData.userFriendly;
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({
        title: "Success",
        description: "Book pages generated successfully!",
      });
    },
    onError: (error: any) => {
      // Ensure queries are invalidated to refresh story status
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      
      let title = "Generation Error";
      let description = "Failed to generate book pages. Please try again.";
      
      console.error('Book generation error:', error);
      
      if (error.status === 429 || error.message?.includes('quota')) {
        title = "API Quota Exceeded";
        description = "You have exceeded your current API quota. Please wait a moment and try again, or check your API usage limits.";
      } else if (error.status === 408 || error.message?.includes('timeout')) {
        title = "Generation Timeout";
        description = "The image generation request timed out. Please try again with a shorter story or simpler requirements.";
      } else if (error.status === 500) {
        title = "Server Error";
        description = "The AI illustration service encountered an error. Please try again in a moment. If this continues, the service may be temporarily unavailable.";
      } else if (error.status === 502) {
        title = "Generation Incomplete";
        description = "Not all images were generated successfully. Please try again.";
      } else if (error.userFriendly && error.message) {
        description = error.message;
      } else if (error.message) {
        description = `Generation failed: ${error.message}`;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });



  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !characterDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title, story content, and character description.",
        variant: "destructive",
      });
      return;
    }

    if (!pagesCount) {
      toast({
        title: "Pages Required",
        description: "Please select the number of pages for your story.",
        variant: "destructive",
      });
      return;
    }

    const targetPages = parseInt(pagesCount, 10);

    createStoryMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      characterDescription: characterDescription.trim(),
      artStyle,
      pagesCount: targetPages,
      pdfFormat: "8x10", // Default format for all books
    });
  };

  const isLoading = createStoryMutation.isPending || generateBookMutation.isPending;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Story Title */}
        <div>
          <Label htmlFor="title" className="block text-sm font-medium mb-2">
            Story Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter your story title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={bookLimitReached}
            className={bookLimitReached ? "cursor-not-allowed" : ""}
            data-testid="input-story-title"
          />
        </div>

        {/* Character Description */}
        <div>
          <Label htmlFor="characterDescription" className="block text-sm font-medium mb-2">
            <span className="flex items-center">
              <User size={16} className="mr-1" />
              Character Description *
            </span>
          </Label>
          <Textarea
            id="characterDescription"
            placeholder="Describe your main character... (e.g., 'A brave little bunny with fluffy white fur, big brown eyes, and a red scarf')"
            rows={3}
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            className={`resize-none ${bookLimitReached ? "cursor-not-allowed" : ""}`}
            disabled={bookLimitReached}
            data-testid="textarea-character-description"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This description helps maintain character consistency across all illustrations
          </p>
        </div>

        {/* Story Text */}
        <div>
          <Label htmlFor="content" className="block text-sm font-medium mb-2">
            Your Story
          </Label>
          <Textarea
            id="content"
            placeholder="Once upon a time..."
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`resize-none ${bookLimitReached ? "cursor-not-allowed" : ""}`}
            disabled={bookLimitReached}
            data-testid="textarea-story-content"
          />
        </div>

        {/* Generation Settings */}
        <div className="bg-accent/30 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Generation Settings</h3>
          <div className="space-y-3">
            <div>
              <Label className="block text-xs text-muted-foreground mb-1">
                Pages per story *
              </Label>
              <Select value={pagesCount} onValueChange={setPagesCount} disabled={bookLimitReached}>
                <SelectTrigger className={`w-full ${bookLimitReached ? "cursor-not-allowed" : ""}`} data-testid="select-pages-count">
                  <SelectValue placeholder="Select number of pages" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Array.from({ length: 17 }, (_, i) => i + 8).map(num => (
                    <SelectItem key={num} value={String(num)}>
                      {num} {num === 1 ? 'page' : 'pages'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-xs text-muted-foreground mb-1">
                Art style
              </Label>
              <Select value={artStyle} onValueChange={setArtStyle} disabled={bookLimitReached}>
                <SelectTrigger className={`w-full ${bookLimitReached ? "cursor-not-allowed" : ""}`} data-testid="select-art-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watercolor">Watercolor illustration</SelectItem>
                  <SelectItem value="digital">Digital cartoon</SelectItem>
                  <SelectItem value="sketch">Hand-drawn sketch</SelectItem>
                  <SelectItem value="3d">3D rendered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          className={`w-full ${bookLimitReached ? "cursor-pointer" : ""}`}
          onClick={bookLimitReached ? () => setLocation('/subscription') : handleSubmit}
          disabled={isLoading}
          data-testid="button-generate-book"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Generating...
            </div>
          ) : bookLimitReached ? (
            <>
              <Lock className="mr-2" size={16} />
              Upgrade to Create More Books
            </>
          ) : (
            <>
              <Wand2 className="mr-2" size={16} />
              Generate Book Pages
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
