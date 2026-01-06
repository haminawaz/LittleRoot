import { useState, useRef } from "react";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TextOverlay {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isVisible: boolean;
  textAlign: "left" | "center" | "right";
  editMode?: "move" | "format" | "color";
}

interface IllustrationTextEditorProps {
  overlay: TextOverlay | null;
  onSave: (overlay: TextOverlay) => void;
  onCancel: () => void;
  imageUrl: string;
  defaultText: string;
  isSaving?: boolean;
}

const DEFAULT_OVERLAY: TextOverlay = {
  text: "",
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  x: 50,
  y: 65,
  width: 80,
  height: 20,
  isVisible: true,
  textAlign: "center",
  editMode: "move",
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
  overlay,
  onSave,
  onCancel,
  imageUrl,
  defaultText,
  isSaving = false,
}: IllustrationTextEditorProps) {
  const [currentOverlay, setCurrentOverlay] = useState<TextOverlay>(
    overlay || { ...DEFAULT_OVERLAY, text: defaultText }
  );
  const [editMode, setEditMode] = useState<"move" | "format" | "color">(
    currentOverlay.editMode || "move"
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof TextOverlay, value: any) => {
    setCurrentOverlay((prev) => ({ ...prev, [field]: value }));
  };

  const handleDragEnd = (event: any, info: any) => {
    if (!containerRef.current || !boxRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRect = boxRef.current.getBoundingClientRect();

    const centerX =
      elementRect.left + elementRect.width / 2 - containerRect.left;
    const centerY =
      elementRect.top + elementRect.height / 2 - containerRect.top;

    const xPct = (centerX / containerRect.width) * 100;
    const yPct = (centerY / containerRect.height) * 100;

    setCurrentOverlay((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(100, xPct)),
      y: Math.max(0, Math.min(100, yPct)),
    }));
  };

  const handleDone = () => {
    onSave({ ...currentOverlay, editMode });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[70] overflow-visible pointer-events-none">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-border z-[100] pointer-events-auto">
        <Button
          variant={editMode === "move" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setEditMode("move")}
          disabled={isSaving}
          className="h-9 w-9 p-0">
          <MousePointer2 size={18} />
        </Button>
        <Button
          variant={editMode === "format" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setEditMode("format")}
          disabled={isSaving}
          className="h-9 w-9 p-0">
          <Type size={18} />
        </Button>
        <Button
          variant={editMode === "color" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setEditMode("color")}
          disabled={isSaving}
          className="h-9 w-9 p-0">
          <Paintbrush size={18} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="default"
          size="sm"
          onClick={handleDone}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg px-4">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            "Done"
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
          <X size={18} />
        </Button>
      </div>

      <AnimatePresence>
        {editMode === "format" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/4 flex items-center gap-1.5 bg-white p-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-border z-[90] pointer-events-auto min-w-max">
            <div className="flex bg-muted/50 rounded-md p-0.5">
              <Button
                variant={
                  currentOverlay.textAlign === "left" ? "secondary" : "ghost"
                }
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleChange("textAlign", "left")}>
                <AlignLeft size={14} />
              </Button>
              <Button
                variant={
                  currentOverlay.textAlign === "center" ? "secondary" : "ghost"
                }
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleChange("textAlign", "center")}>
                <AlignCenter size={14} />
              </Button>
              <Button
                variant={
                  currentOverlay.textAlign === "right" ? "secondary" : "ghost"
                }
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleChange("textAlign", "right")}>
                <AlignRight size={14} />
              </Button>
            </div>
            <div className="w-px h-5 bg-border mx-0.5" />
            <Select
              value={currentOverlay.fontFamily}
              onValueChange={(v) => handleChange("fontFamily", v)}>
              <SelectTrigger className="h-7 w-28 text-[11px] font-semibold border-none bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f} className="text-[11px]">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-5 bg-border mx-0.5" />
            <div className="flex flex-col items-center justify-center bg-muted/50 rounded-md px-1 h-7">
              <button
                onClick={() =>
                  handleChange(
                    "fontSize",
                    Math.min(200, currentOverlay.fontSize + 2)
                  )
                }
                className="hover:text-primary transition-transform hover:scale-110 leading-none">
                ▲
              </button>

              <input
                type="text"
                value={currentOverlay.fontSize}
                onChange={(e) =>
                  handleChange("fontSize", parseInt(e.target.value) || 24)
                }
                className="w-8 bg-transparent text-[11px] font-bold text-center focus:outline-none leading-none"
              />

              <button
                onClick={() =>
                  handleChange(
                    "fontSize",
                    Math.max(2, currentOverlay.fontSize - 2)
                  )
                }
                className="hover:text-primary transition-transform hover:scale-110 leading-none">
                ▼
              </button>
            </div>
          </motion.div>
        )}

        {editMode === "color" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white p-2.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-border z-[90] pointer-events-auto min-w-max">
            <div className="grid grid-cols-10 gap-1.5">
              {[
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
              ].map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 ${
                    currentOverlay.color === c
                      ? "ring-2 ring-primary ring-offset-1"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => handleChange("color", c)}
                />
              ))}
            </div>
            <div className="w-px h-5 bg-border mx-1" />
            <input
              type="color"
              value={currentOverlay.color}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-6 h-6 cursor-pointer rounded-full border-none p-0 bg-transparent overflow-hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          ref={boxRef}
          key={`${currentOverlay.x}-${currentOverlay.y}`}
          drag={editMode === "move"}
          dragMomentum={false}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{
            left: `${currentOverlay.x}%`,
            top: `${currentOverlay.y}%`,
            width: `${currentOverlay.width}%`,
            x: "-50%",
            y: "-50%",
            position: "absolute",
            zIndex: 50,
          }}
          className={`pointer-events-auto rounded-lg ${
            editMode === "move"
              ? "cursor-move ring-2 ring-transparent hover:ring-blue-400/50"
              : "cursor-default"
          }`}>
          <div
            className={`relative p-4 rounded-lg border-2 transition-all
              ${
                editMode === "move"
                  ? "border-dashed border-blue-400/30 bg-blue-400/5"
                  : "border-transparent"
              }
              ${
                editMode === "format"
                  ? "border-solid border-blue-500/50 bg-white/5 shadow-2xl"
                  : ""
              }
            `}>
            {editMode === "format" ? (
              <textarea
                autoFocus
                className="w-full bg-transparent border-none outline-none resize-none font-bold placeholder-white/30"
                placeholder="Type your text..."
                style={{
                  fontSize: `${currentOverlay.fontSize / 3}px`,
                  fontFamily: currentOverlay.fontFamily,
                  color: currentOverlay.color,
                  textAlign: currentOverlay.textAlign,
                  minHeight: "1.2em",
                  overflow: "hidden",
                }}
                value={currentOverlay.text}
                onChange={(e) => handleChange("text", e.target.value)}
              />
            ) : (
              <div
                className={`w-full font-bold select-none ${
                  editMode === "move" ? "pointer-events-none" : ""
                }`}
                style={{
                  fontSize: `${currentOverlay.fontSize / 3}px`,
                  fontFamily: currentOverlay.fontFamily,
                  color: currentOverlay.color,
                  textAlign: currentOverlay.textAlign,
                }}>
                {currentOverlay.text || "Type your text..."}
              </div>
            )}

            {editMode === "move" && (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full translate-x-1/2 -translate-y-1/2 shadow-sm" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 translate-y-1/2 shadow-sm" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full translate-x-1/2 translate-y-1/2 shadow-sm" />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
