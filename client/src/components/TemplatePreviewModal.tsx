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
          <DialogTitle className="text-xl font-serif font-semibold text-black">
            Template Preview
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6">
            {/* Template Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-serif font-semibold text-black">{template.title}</h1>
              <p className="text-lg text-black">{template.description}</p>
            </div>

            {/* Template Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-mutewhite rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <Palette size={20} className="text-black" />
                  <h3 className="font-semibold text-black">Art Style</h3>
                </div>
                <p className="text-sm text-black capitalize">{template.artStyle}</p>
                <p className="text-xs text-black mt-1">
                  The visual style that will be used for all illustrations
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={20} className="text-black" />
                  <h3 className="font-semibold text-black">Story Length</h3>
                </div>
                <p className="text-sm text-black">{template.content.split(' ').length} words</p>
                <p className="text-xs text-black mt-1">
                  Approximately 8-12 pages when generated
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen size={20} className="text-black" />
                  <h3 className="font-semibold text-black">Target Age</h3>
                </div>
                <p className="text-sm text-black">3-8 years</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Age-appropriate content and vocabulary
                </p>
              </div>
            </div>

            {/* Story Preview */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-4 flex items-center">
                <BookOpen size={20} className="mr-2 text-black" />
                Story Preview
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-black">
                  {template.content}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold mb-2 text-black">What you'll get:</h3>
              <ul className="text-sm space-y-1 text-black">
                <li>• Professionally crafted story suitable for children</li>
                <li>• Automatic page splitting for optimal reading experience</li>
                <li>• AI-generated illustrations in {template.artStyle} style</li>
                <li>• Export-ready PDF</li>
                <li>• Full editing capabilities to customize your book</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-6 border-t border-border bg-muted/30 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-template"
            className="w-1/2"
          >
            Browse Other Templates
          </Button>
          
          <Button 
            onClick={onUseTemplate}
            size="lg"
            variant="default"
            data-testid="button-use-template"
            className="w-1/2"
          >
            <BookOpen size={16} className="mr-2" />
            Use This Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}