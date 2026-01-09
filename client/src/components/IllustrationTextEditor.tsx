import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  MousePointer2,
  Type,
  Paintbrush,
  X,
  Plus,
  Minus,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export interface TextBlock {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign: "left" | "center" | "right";
}

export interface TextOverlay {
  blocks: TextBlock[];
  isVisible: boolean;
}

interface IllustrationTextEditorProps {
  overlay: any | null;
  onSave: (overlay: TextOverlay) => void;
  onCancel: () => void;
  imageUrl: string;
  defaultText: string;
  isSaving?: boolean;
}

const DEFAULT_BLOCK = (text: string, id: string): TextBlock => ({
  id,
  text,
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  backgroundColor: "#000000",
  backgroundOpacity: 0,
  x: 50,
  y: 65,
  width: 80,
  height: 20,
  textAlign: "center",
});

const FONT_FAMILIES = [
  "Inter",
  "Geist",
  "Lora",
  "Open Sans",
  "Space Grotesk",
  "Arial",
  "Georgia",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Comic Sans MS",
  "Trebuchet MS",
  "Impact",
  "Tahoma",
  "Palatino",
  "Garamond",
];

const COLORS = [
  "#ffffff",
  "#000000",
  "#ff4444",
  "#44ff44",
  "#4444ff",
  "#ffff44",
  "#ff44ff",
  "#44ffff",
  "#ffa500",
  "#800080",
];

export default function IllustrationTextEditor({
  overlay,
  onSave,
  onCancel,
  imageUrl,
  defaultText,
  isSaving = false,
}: IllustrationTextEditorProps) {
  // Migration logic for old overlay format
  const getInitialBlocks = (): TextBlock[] => {
    if (!overlay) return [DEFAULT_BLOCK(defaultText, "block-1")];
    
    // If it's already in the new format
    if (overlay.blocks && Array.isArray(overlay.blocks)) {
      return overlay.blocks;
    }
    
    // If it's in the old format
    if (overlay.text !== undefined) {
      return [{
        id: "block-1",
        text: overlay.text || defaultText,
        fontSize: overlay.fontSize || 48,
        fontFamily: overlay.fontFamily || "Arial",
        color: overlay.color || "#ffffff",
        x: overlay.x || 50,
        y: overlay.y || 65,
        width: overlay.width || 80,
        height: overlay.height || 20,
        textAlign: overlay.textAlign || "center",
        backgroundColor: "#000000",
        backgroundOpacity: 0.2,
      }];
    }
    
    return [DEFAULT_BLOCK(defaultText, "block-1")];
  };

  const [blocks, setBlocks] = useState<TextBlock[]>(getInitialBlocks());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id || null);
  const [editMode, setEditMode] = useState<"move" | "format" | "color" | "background">("move");

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const updateSelectedBlock = (updates: Partial<TextBlock>) => {
    if (!selectedBlockId) return;
    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, ...updates } : b));
  };

  const handleAddBlock = () => {
    const newId = `block-${Date.now()}`;
    const newBlock = DEFAULT_BLOCK("New Text", newId);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newId);
    setEditMode("format");
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => {
      const newBlocks = prev.filter(b => b.id !== id);
      if (selectedBlockId === id) {
        setSelectedBlockId(newBlocks.length > 0 ? newBlocks[0].id : null);
      }
      return newBlocks;
    });
  };

  const handleUpdatePosition = (id: string, xPct: number, yPct: number) => {
    setBlocks(prev => prev.map(b => b.id === id ? { 
      ...b, 
      x: Math.max(0, Math.min(100, xPct)), 
      y: Math.max(0, Math.min(100, yPct)) 
    } : b));
  };

  const handleDone = () => {
    onSave({ blocks, isVisible: true });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-serif">Edit Text Overlays</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAddBlock}>
                <Plus size={16} className="mr-1" /> Add Text
              </Button>
              <Button onClick={handleDone} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tools Sidebar */}
          <div className="w-full md:w-64 border-r bg-muted/10 p-4 space-y-6 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Mode</h3>
              <div className="grid grid-cols-4 gap-1">
                <Button 
                  variant={editMode === "move" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setEditMode("move")}
                  className="p-0 h-10 w-full"
                  title="Move & Resize"
                >
                  <MousePointer2 size={18} />
                </Button>
                <Button 
                  variant={editMode === "format" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setEditMode("format")}
                  className="p-0 h-10 w-full"
                  title="Text Formatting"
                >
                  <Type size={18} />
                </Button>
                <Button 
                  variant={editMode === "color" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setEditMode("color")}
                  className="p-0 h-10 w-full"
                  title="Text Color"
                >
                  <Paintbrush size={18} />
                </Button>
                <Button 
                  variant={editMode === "background" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setEditMode("background")}
                  className="p-0 h-10 w-full"
                  title="Background"
                >
                  <div className="w-5 h-5 border-2 border-current rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-current rounded-full opacity-50" />
                  </div>
                </Button>
              </div>
            </div>

            {selectedBlock && (
              <>
                <AnimatePresence mode="wait">
                  {editMode === "format" && (
                    <motion.div
                      key="format"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Typography</h3>
                      <div className="space-y-3">
                        <div className="flex bg-muted/50 rounded-md p-1">
                          <Button
                            variant={selectedBlock.textAlign === "left" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateSelectedBlock({ textAlign: "left" })}
                          >
                            <AlignLeft size={16} />
                          </Button>
                          <Button
                            variant={selectedBlock.textAlign === "center" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateSelectedBlock({ textAlign: "center" })}
                          >
                            <AlignCenter size={16} />
                          </Button>
                          <Button
                            variant={selectedBlock.textAlign === "right" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateSelectedBlock({ textAlign: "right" })}
                          >
                            <AlignRight size={16} />
                          </Button>
                        </div>

                        <Select
                          value={selectedBlock.fontFamily}
                          onValueChange={(v) => updateSelectedBlock({ fontFamily: v })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Font Size</span>
                            <span className="font-bold">{selectedBlock.fontSize}px</span>
                          </div>
                          <Slider
                            value={[selectedBlock.fontSize]}
                            min={12}
                            max={200}
                            step={2}
                            onValueChange={([v]) => updateSelectedBlock({ fontSize: v })}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {editMode === "color" && (
                    <motion.div
                      key="color"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Text Color</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            className={`w-8 h-8 rounded-full border border-black/10 transition-transform hover:scale-110 ${
                              selectedBlock.color === c ? "ring-2 ring-primary ring-offset-2" : ""
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={() => updateSelectedBlock({ color: c })}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                         <input
                            type="color"
                            value={selectedBlock.color}
                            onChange={(e) => updateSelectedBlock({ color: e.target.value })}
                            className="w-8 h-8 cursor-pointer rounded-lg border border-border p-0 bg-transparent overflow-hidden"
                          />
                          <span className="text-xs font-mono">{selectedBlock.color}</span>
                      </div>
                    </motion.div>
                  )}

                  {editMode === "background" && (
                    <motion.div
                      key="background"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bg Color</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {COLORS.map((c) => (
                            <button
                              key={c}
                              className={`w-8 h-8 rounded-full border border-black/10 transition-transform hover:scale-110 ${
                                selectedBlock.backgroundColor === c ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}
                              style={{ backgroundColor: c }}
                              onClick={() => updateSelectedBlock({ backgroundColor: c })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Bg Opacity</span>
                          <span className="font-bold">{Math.round((selectedBlock.backgroundOpacity || 0) * 100)}%</span>
                        </div>
                        <Slider
                          value={[(selectedBlock.backgroundOpacity || 0) * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([v]) => updateSelectedBlock({ backgroundOpacity: v / 100 })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 border-t mt-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => selectedBlockId && handleDeleteBlock(selectedBlockId)}
                  >
                    <Trash2 size={16} className="mr-2" /> Delete Block
                  </Button>
                </div>
              </>
            )}
            
            {!selectedBlock && (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground italic">Select a text block to edit</p>
              </div>
            )}
          </div>

          <div className="flex-1 bg-muted/30 p-4 md:p-8 flex items-center justify-center overflow-auto relative">
            <div 
              ref={containerRef}
              className="relative aspect-[3/4] bg-white shadow-2xl overflow-hidden max-h-full"
              style={{ width: 'auto', height: '100%', containerType: 'inline-size' }}
              onClick={() => setSelectedBlockId(null)}
            >
              <img
                src={imageUrl}
                alt="Illustration"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              
              {blocks.map((block) => (
                <div
                  key={block.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBlockId(block.id);
                  }}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.width}%`,
                    height: `${block.height}%`,
                    transform: "translate(-50%, -50%)",
                    position: "absolute",
                    zIndex: selectedBlockId === block.id ? 50 : 10,
                    backgroundColor: `${block.backgroundColor}${Math.round((block.backgroundOpacity || 0) * 255).toString(16).padStart(2, '0')}`,
                    borderRadius: '4px',
                  }}
                  className={`group transition-shadow overflow-hidden
                    ${selectedBlockId === block.id ? 'ring-2 ring-primary shadow-xl pointer-events-auto' : 'ring-1 ring-transparent hover:ring-white/50 pointer-events-auto cursor-pointer'}
                  `}
                >
                  <textarea
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-bold placeholder-white/30 p-2 overflow-hidden"
                    placeholder="Type your text..."
                    autoFocus={selectedBlockId === block.id && editMode === "format"}
                    style={{
                      fontSize: `${block.fontSize / 12.6}cqw`,
                      fontFamily: block.fontFamily,
                      color: block.color,
                      textAlign: block.textAlign,
                      padding: '1.9cqw',
                      lineHeight: 1.2,
                    }}
                    value={block.text}
                    onChange={(e) => {
                      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, text: e.target.value } : b));
                    }}
                    onFocus={() => setSelectedBlockId(block.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {selectedBlockId === block.id && editMode === "move" && (
                    <>
                      {[
                        { dir: 'tl', class: 'top-0 left-0 cursor-nwse-resize' },
                        { dir: 'tr', class: 'top-0 right-0 cursor-nesw-resize' },
                        { dir: 'bl', class: 'bottom-0 left-0 cursor-nesw-resize' },
                        { dir: 'br', class: 'bottom-0 right-0 cursor-nwse-resize' },
                      ].map((handle) => (
                        <div 
                          key={handle.dir}
                          className={`absolute w-3 h-3 bg-primary z-50 border border-white shadow-sm ${handle.class}`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const initialWidth = block.width;
                            const initialHeight = block.height;
                            const initialX = block.x;
                            const initialY = block.y;
                            
                            const handleMouseMove = (mv: MouseEvent) => {
                              if (!containerRef.current) return;
                              const rect = containerRef.current.getBoundingClientRect();
                              const dx = ((mv.clientX - startX) / rect.width) * 100;
                              const dy = ((mv.clientY - startY) / rect.height) * 100;
                              
                              let newWidth = initialWidth;
                              let newHeight = initialHeight;
                              let newX = initialX;
                              let newY = initialY;

                              if (handle.dir === 'br') {
                                const tlX = initialX - initialWidth / 2;
                                const tlY = initialY - initialHeight / 2;
                                newWidth = Math.max(5, initialWidth + dx);
                                newHeight = Math.max(2, initialHeight + dy);
                                newX = tlX + newWidth / 2;
                                newY = tlY + newHeight / 2;
                              } else if (handle.dir === 'tl') {
                                const brX = initialX + initialWidth / 2;
                                const brY = initialY + initialHeight / 2;
                                newWidth = Math.max(5, initialWidth - dx);
                                newHeight = Math.max(2, initialHeight - dy);
                                newX = brX - newWidth / 2;
                                newY = brY - newHeight / 2;
                              } else if (handle.dir === 'tr') {
                                const blX = initialX - initialWidth / 2;
                                const blY = initialY + initialHeight / 2;
                                newWidth = Math.max(5, initialWidth + dx);
                                newHeight = Math.max(2, initialHeight - dy);
                                newX = blX + newWidth / 2;
                                newY = blY - newHeight / 2;
                              } else if (handle.dir === 'bl') {
                                const trX = initialX + initialWidth / 2;
                                const trY = initialY - initialHeight / 2;
                                newWidth = Math.max(5, initialWidth - dx);
                                newHeight = Math.max(2, initialHeight + dy);
                                newX = trX - newWidth / 2;
                                newY = trY + newHeight / 2;
                              }

                              setBlocks(prev => prev.map(b => b.id === block.id ? {
                                ...b,
                                width: newWidth,
                                height: newHeight,
                                x: newX,
                                y: newY
                              } : b));
                            };
                            
                            const handleMouseUp = () => {
                              window.removeEventListener('mousemove', handleMouseMove);
                              window.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            window.addEventListener('mousemove', handleMouseMove);
                            window.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                      ))}
                      
                      {/* Move Handle Overlay - Placed above textarea in move mode */}
                      <div 
                        className="absolute inset-0 bg-primary/5 cursor-move z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const initialX = block.x;
                          const initialY = block.y;
                          
                          const handleMouseMove = (mv: MouseEvent) => {
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            const dx = ((mv.clientX - startX) / rect.width) * 100;
                            const dy = ((mv.clientY - startY) / rect.height) * 100;
                            
                            handleUpdatePosition(block.id, initialX + dx, initialY + dy);
                          };
                          
                          const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          window.addEventListener('mousemove', handleMouseMove);
                          window.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
