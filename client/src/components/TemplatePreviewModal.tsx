import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Palette, FileText } from "lucide-react";

interface Template {
  title: string;
  content: string;
  artStyle: string;
  description: string;
}

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onUseTemplate: () => void;
}

export default function TemplatePreviewModal({ template, onClose, onUseTemplate }: TemplatePreviewModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl font-serif font-semibold">
            Template Preview
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6">
            {/* Template Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-serif font-bold text-primary">{template.title}</h1>
              <p className="text-lg text-muted-foreground">{template.description}</p>
            </div>

            {/* Template Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <Palette size={20} className="text-primary" />
                  <h3 className="font-semibold">Art Style</h3>
                </div>
                <p className="text-sm text-muted-foreground capitalize">{template.artStyle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The visual style that will be used for all illustrations
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={20} className="text-primary" />
                  <h3 className="font-semibold">Story Length</h3>
                </div>
                <p className="text-sm text-muted-foreground">{template.content.split(' ').length} words</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approximately 8-12 pages when generated
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen size={20} className="text-primary" />
                  <h3 className="font-semibold">Target Age</h3>
                </div>
                <p className="text-sm text-muted-foreground">3-8 years</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Age-appropriate content and vocabulary
                </p>
              </div>
            </div>

            {/* Story Preview */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-4 flex items-center">
                <BookOpen size={20} className="mr-2 text-primary" />
                Story Preview
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {template.content}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold mb-2 text-primary">What you'll get:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Professionally crafted story suitable for children</li>
                <li>• Automatic page splitting for optimal reading experience</li>
                <li>• AI-generated illustrations in {template.artStyle} style</li>
                <li>• Export-ready PDF</li>
                <li>• Full editing capabilities to customize your book</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-template"
          >
            Browse Other Templates
          </Button>
          
          <Button 
            onClick={onUseTemplate}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
            data-testid="button-use-template"
          >
            <BookOpen size={16} className="mr-2" />
            Use This Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}