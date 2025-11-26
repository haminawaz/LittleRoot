import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wand2, User, Upload, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Story, GenerateBookRequest } from "@shared/schema";

interface Template {
  title: string;
  content: string;
  artStyle: string;
  description: string;
}

interface TemplateCustomizationModalProps {
  template: Template;
  onClose: () => void;
  onStoryCreated: (storyId: string) => void;
}

export default function TemplateCustomizationModal({ 
  template, 
  onClose, 
  onStoryCreated 
}: TemplateCustomizationModalProps) {
  const [title, setTitle] = useState(template.title);
  const [content, setContent] = useState(template.content);
  const [artStyle, setArtStyle] = useState(template.artStyle);
  const [pagesCount, setPagesCount] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterImagePreview, setCharacterImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStoryMutation = useMutation({
    mutationFn: async (data: GenerateBookRequest) => {
      const response = await apiRequest("POST", "/api/stories", data);
      return response.json() as Promise<Story>;
    },
    onSuccess: (story) => {
      // Start generation immediately
      generateBookMutation.mutate(story.id);
      // Don't close yet - wait for generation to start
    },
    onError: (error: any) => {
      let title = "Error";
      let description = "Failed to create story from template. Please try again.";
      
      // Handle specific error types
      if (error.status === 403) {
        try {
          const errorData = JSON.parse(error.message || '{}');
          if (errorData.error === "Book limit reached" || errorData.requiresUpgrade) {
            title = "Book Limit Reached";
            description = errorData.message || "You've reached your book creation limit for this month. Please upgrade your subscription to create more books.";
          }
        } catch {
          // If parsing fails, check for "Book limit reached" in the error message
          if (error.message?.includes("Book limit reached")) {
            title = "Book Limit Reached";
            description = "You've reached your book creation limit for this month. Please upgrade your subscription to create more books.";
          }
        }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      
      // Notify parent with story ID to trigger redirect BEFORE closing modal
      onStoryCreated(data.story.id);
      
      toast({
        title: "Success",
        description: "Your customized book is being generated!",
      });
      
      // Close modal after redirect is initiated
      onClose();
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      
      let title = "Generation Error";
      let description = "Failed to generate book pages. Please try again.";
      
      if (error.status === 429 || error.message?.includes('quota')) {
        title = "API Quota Exceeded";
        description = "You have exceeded your current API quota. Please wait a moment and try again.";
      } else if (error.status === 408 || error.message?.includes('timeout')) {
        title = "Generation Timeout";
        description = "The generation request timed out. Please try again.";
      } else if (error.userFriendly && error.message) {
        description = error.message;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
      
      // Close modal even on error
      onClose();
    },
  });

  const handleCharacterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCharacterImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCharacterImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCharacterImage(null);
    setCharacterImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!characterDescription.trim() && !characterImage) {
      toast({
        title: "Character Required",
        description: "Please provide either a character description or upload a character image.",
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

    try {
      let characterImageUrl: string | undefined;
      
      // Upload character image if provided
      if (characterImage) {
        console.log('Starting character image upload...', characterImage.name, characterImage.size);
        
        // Direct upload to server with proper content type
        const uploadResult = await fetch("/api/objects/upload-character-image", {
          method: 'POST',
          headers: {
            'Content-Type': characterImage.type || 'image/png',
            'X-File-Name': characterImage.name || 'character-image',
          },
          body: characterImage,
        });
        
        console.log('Upload result status:', uploadResult.status, uploadResult.statusText);
        
        if (!uploadResult.ok) {
          const errorText = await uploadResult.text();
          console.error('Upload failed with error:', errorText);
          throw new Error(`Failed to upload character image: ${uploadResult.status} ${uploadResult.statusText}`);
        }
        
        const uploadData = await uploadResult.json();
        console.log('Upload success data:', uploadData);
        characterImageUrl = uploadData.url;
        console.log('Character image URL:', characterImageUrl);
      }

      createStoryMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        characterDescription: characterDescription.trim() || undefined,
        characterImageUrl,
        artStyle,
        pagesCount: targetPages,
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload character image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = createStoryMutation.isPending || generateBookMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl font-serif font-semibold">
            Customize "{template.title}"
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize this template with your own character. All story details are pre-filled - just add your character!
          </p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6">
            {/* Story Title */}
            <div>
              <Label htmlFor="title" className="block text-sm font-medium mb-2">
                Story Title
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-template-title"
              />
            </div>

            {/* Character Section */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <Label className="block text-sm font-medium mb-3">
                <span className="flex items-center text-primary">
                  <User size={16} className="mr-1" />
                  Add Your Character *
                </span>
              </Label>
              
              {/* Character Description */}
              <div className="mb-4">
                <Label htmlFor="characterDescription" className="block text-sm font-medium mb-2">
                  Character Description
                </Label>
                <Textarea
                  id="characterDescription"
                  placeholder="Describe your main character... (e.g., 'A brave little bunny with fluffy white fur, big brown eyes, and a red scarf')"
                  rows={3}
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  className="resize-none"
                  data-testid="textarea-template-character-description"
                />
              </div>

              {/* OR divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-border"></div>
                <span className="px-3 text-xs text-muted-foreground">OR</span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              {/* Character Image Upload */}
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Upload Character Image
                </Label>
                {characterImagePreview ? (
                  <div className="relative">
                    <img 
                      src={characterImagePreview} 
                      alt="Character preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                      data-testid="button-remove-character-image"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a photo of your character
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCharacterImageChange}
                      className="block mx-auto"
                      id="character-image-upload"
                      data-testid="input-character-image"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('character-image-upload')?.click()}
                      data-testid="button-upload-character-image"
                      className="mt-2"
                    >
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Provide either a description or image to help maintain character consistency throughout the story
              </p>
            </div>

            {/* Story Content */}
            <div>
              <Label htmlFor="content" className="block text-sm font-medium mb-2">
                Story Content
              </Label>
              <Textarea
                id="content"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                data-testid="textarea-template-content"
              />
            </div>

            {/* Art Style */}
            <div>
              <Label className="block text-sm font-medium mb-2">Art Style</Label>
              <Select value={artStyle} onValueChange={setArtStyle}>
                <SelectTrigger data-testid="select-template-art-style">
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

            {/* Page Count */}
            <div>
              <Label className="block text-sm font-medium mb-2">Pages per story *</Label>
              <Select value={pagesCount} onValueChange={setPagesCount}>
                <SelectTrigger data-testid="select-template-page-count">
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
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            data-testid="button-cancel-template-customization"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
            data-testid="button-create-template-story"
          >
            <Wand2 size={16} className="mr-2" />
            {isLoading ? "Creating Your Book..." : "Create Your Book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}