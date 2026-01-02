import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

export interface TextOverlay {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  x: number;
  y: number;
  isVisible: boolean;
  textAlign: "left" | "center" | "right";
}

interface IllustrationTextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  overlay: TextOverlay | null;
  onSave: (overlay: TextOverlay) => void;
  imageUrl: string;
  defaultText: string;
}

const DEFAULT_OVERLAY: TextOverlay = {
  text: "",
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  x: 50,
  y: 65,
  isVisible: true,
  textAlign: "center",
};

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Comic Sans MS",
  "Trebuchet MS",
];

export default function IllustrationTextEditor({
  isOpen,
  onClose,
  overlay,
  onSave,
  imageUrl,
  defaultText,
}: IllustrationTextEditorProps) {
  const [currentOverlay, setCurrentOverlay] = useState<TextOverlay>(
    overlay || { ...DEFAULT_OVERLAY, text: defaultText }
  );

  useEffect(() => {
    if (overlay) {
      setCurrentOverlay(overlay);
    } else {
      setCurrentOverlay({ ...DEFAULT_OVERLAY, text: defaultText });
    }
  }, [overlay, defaultText]);

  const handleChange = (field: keyof TextOverlay, value: any) => {
    setCurrentOverlay((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Illustration Text</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Preview Area */}
          <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {currentOverlay.isVisible && (
              <div
                className="absolute w-[80%] pointer-events-none"
                style={{
                  left: `${currentOverlay.x}%`,
                  top: `${currentOverlay.y}%`,
                  transform: `translate(-50%, -50%)`,
                  fontSize: `${currentOverlay.fontSize / 5}px`, // Scaled for preview
                  fontFamily: currentOverlay.fontFamily,
                  color: currentOverlay.color,
                  textAlign: currentOverlay.textAlign,
                  fontWeight: "bold",
                }}
              >
                {currentOverlay.text}
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Overlay Text</Label>
              <Textarea
                value={currentOverlay.text}
                onChange={(e) => handleChange("text", e.target.value)}
                placeholder="Enter overlay text..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={currentOverlay.fontFamily}
                  onValueChange={(v) => handleChange("fontFamily", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Text Align</Label>
                <Select
                  value={currentOverlay.textAlign}
                  onValueChange={(v) => handleChange("textAlign", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Font Size</Label>
                <span className="text-xs text-muted-foreground">{currentOverlay.fontSize}px</span>
              </div>
              <Slider
                value={[currentOverlay.fontSize]}
                min={20}
                max={150}
                step={1}
                onValueChange={([v]) => handleChange("fontSize", v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={currentOverlay.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={currentOverlay.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Vertical Position</Label>
                <span className="text-xs text-muted-foreground">{currentOverlay.y}%</span>
              </div>
              <Slider
                value={[currentOverlay.y]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => handleChange("y", v)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Horizontal Position</Label>
                <span className="text-xs text-muted-foreground">{currentOverlay.x}%</span>
              </div>
              <Slider
                value={[currentOverlay.x]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => handleChange("x", v)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={currentOverlay.isVisible}
                onChange={(e) => handleChange("isVisible", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isVisible">Visible on Illustration</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(currentOverlay)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
