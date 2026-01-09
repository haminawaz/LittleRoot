import jsPDF from "jspdf";
import type { StoryWithPages } from "@shared/schema";

export interface PDFExportOptions {
  format: "kdp-6x9" | "kdp-8.5x11" | "custom";
  includeImages: boolean;
  pageMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface PDFExportProgress {
  stage:
    | "initializing"
    | "loading-cover"
    | "processing-pages"
    | "finalizing"
    | "complete";
  current?: number;
  total?: number;
  message: string;
  progress: number;
}

export interface TextBlock {
  id?: string;
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
  blocks?: TextBlock[];
  isVisible: boolean;
  // Legacy support
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  textAlign?: "left" | "center" | "right";
}

const KDP_FORMATS = {
  "kdp-6x9": { width: 6 * 72, height: 9 * 72 },
  "kdp-8.5x11": { width: 8.5 * 72, height: 11 * 72 },
};

const PDF_FORMATS: Record<string, { width: number; height: number }> = {
  "5.5x8.5": { width: 5.5 * 72, height: 8.5 * 72 },
  "7x7": { width: 7 * 72, height: 7 * 72 },
  "8x8": { width: 8 * 72, height: 8 * 72 },
  "6x9": { width: 6 * 72, height: 9 * 72 },
  "8x10": { width: 8 * 72, height: 10 * 72 },
  "5x8": { width: 5 * 72, height: 8 * 72 },
  "8.5x11": { width: 8.5 * 72, height: 11 * 72 },
  "8.5x8.5": { width: 8.5 * 72, height: 8.5 * 72 },
  "6.14x9.21": { width: 6.14 * 72, height: 9.21 * 72 },
  "8.25x6": { width: 8.25 * 72, height: 6 * 72 },
};

async function optimizeImageWithOverlay(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  overlay: TextOverlay | null = null,
  quality: number = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const targetAspectRatio = targetWidth / targetHeight;
        const imgAspectRatio = img.width / img.height;

        let srcX = 0,
          srcY = 0,
          srcW = img.width,
          srcH = img.height;

        if (imgAspectRatio > targetAspectRatio) {
          // Image is wider than target: crop sides
          srcW = img.height * targetAspectRatio;
          srcX = (img.width - srcW) / 2;
        } else {
          // Image is taller than target: crop top/bottom
          srcH = img.width / targetAspectRatio;
          srcY = (img.height - srcH) / 2;
        }

        const DPI_SCALE = 300 / 72;
        let canvasWidth = Math.round(targetWidth * DPI_SCALE);
        let canvasHeight = Math.round(targetHeight * DPI_SCALE);
        const maxAllowed = 4096;

        if (canvasWidth > maxAllowed || canvasHeight > maxAllowed) {
            const ratio = maxAllowed / Math.max(canvasWidth, canvasHeight);
            canvasWidth = Math.round(canvasWidth * ratio);
            canvasHeight = Math.round(canvasHeight * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          img,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          canvasWidth,
          canvasHeight
        );

        // Render Text Overlay onto Canvas if visible
        if (overlay && overlay.isVisible) {
          const blocks: TextBlock[] = overlay.blocks || [
            {
              text: overlay.text || "",
              fontSize: overlay.fontSize || 48,
              fontFamily: overlay.fontFamily || "Arial",
              color: overlay.color || "#ffffff",
              backgroundColor: "#000000",
              backgroundOpacity: 0.2,
              x: overlay.x || 50,
              y: overlay.y || 50,
              width: overlay.width || 80,
              height: overlay.height || 20,
              textAlign: overlay.textAlign || "center",
            }
          ];

          for (const block of blocks) {
            if (!block.text) continue;

            const fontSize = (block.fontSize * canvasWidth) / 1260;
            const padding = (1.9 * canvasWidth) / 100;

            // Render background
            if (block.backgroundColor && block.backgroundOpacity && block.backgroundOpacity > 0) {
              const rb = parseInt(block.backgroundColor.slice(1, 3), 16) || 0;
              const gb = parseInt(block.backgroundColor.slice(3, 5), 16) || 0;
              const bb = parseInt(block.backgroundColor.slice(5, 7), 16) || 0;

              const rectW = (block.width / 100) * canvasWidth;
              const rectH = (block.height / 100) * canvasHeight;
              const rectX = (block.x / 100) * canvasWidth - rectW / 2;
              const rectY = (block.y / 100) * canvasHeight - rectH / 2;

              ctx.save();
              ctx.globalAlpha = block.backgroundOpacity;
              ctx.fillStyle = `rgb(${rb},${gb},${bb})`;
              ctx.fillRect(rectX, rectY, rectW, rectH);
              ctx.restore();
            }

            const fontMap: Record<string, string> = {
              "Inter": "Inter, system-ui, sans-serif",
              "Geist": "Geist, system-ui, sans-serif",
              "Lora": "Lora, Georgia, serif",
              "Open Sans": "'Open Sans', sans-serif",
              "Space Grotesk": "'Space Grotesk', sans-serif",
              "Arial": "Arial, Helvetica, sans-serif",
              "Georgia": "Georgia, serif",
              "Verdana": "Verdana, Geneva, sans-serif",
              "Times New Roman": "'Times New Roman', Times, serif",
              "Courier New": "'Courier New', Courier, monospace",
              "Comic Sans MS": "'Comic Sans MS', cursive",
              "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
              "Impact": "Impact, Charcoal, sans-serif",
              "Tahoma": "Tahoma, Geneva, sans-serif",
              "Palatino": "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
              "Garamond": "Garamond, Baskerville, 'Baskerville Old Face', 'Hoefler Text', 'Times New Roman', serif",
            };

            const fontStack = fontMap[block.fontFamily] || `"${block.fontFamily}", Arial, sans-serif`;
            ctx.font = `bold ${fontSize}px ${fontStack}`;
            ctx.fillStyle = block.color;
            ctx.textAlign = block.textAlign;
            ctx.textBaseline = "middle";

            const centerX = (block.x / 100) * canvasWidth;
            const centerY = (block.y / 100) * canvasHeight;
            const boxWidth = (block.width / 100) * canvasWidth;

            let drawX = centerX;
            if (block.textAlign === "left") {
              drawX = centerX - boxWidth / 2 + padding;
            } else if (block.textAlign === "right") {
              drawX = centerX + boxWidth / 2 - padding;
            }

            const wrapWidth = boxWidth - (padding * 2);
            const words = block.text.split(" ");
            const lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const metrics = ctx.measureText(currentLine + " " + word);
              if (metrics.width < wrapWidth) {
                currentLine += " " + word;
              } else {
                lines.push(currentLine);
                currentLine = word;
              }
            }
            lines.push(currentLine);

            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = centerY - totalHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, drawX, startY + i * lineHeight);
            });
          }
        }

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

// Old rendering function removed in favor of canvas-based rendering for better font support
// This section previously contained renderTextOverlay function

export async function exportToPDF(
  story: StoryWithPages,
  options: PDFExportOptions = {
    format: "kdp-8.5x11",
    includeImages: true,
    pageMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  onProgress?: (progress: PDFExportProgress) => void
): Promise<void> {
  const storyFormat = (story as any).pdfFormat;
  const requestedFormatKey = options.format?.replace("kdp-", "");
  const formatKey = requestedFormatKey || storyFormat || "8x10";
  const format = PDF_FORMATS[formatKey] || KDP_FORMATS[options.format as keyof typeof KDP_FORMATS] || PDF_FORMATS["8x10"];

  console.log(
    `📄 Exporting PDF with format: ${formatKey} (${format.width / 72}" x ${
      format.height / 72
    }")`
  );

  const hasCover = !!(story as any).coverImageUrl;
  const totalPages = story.pages.length;
  const totalSteps = (hasCover ? 1 : 0) + totalPages + 1;

  onProgress?.({
    stage: "initializing",
    message: "Preparing your book for download...",
    progress: 0,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [format.width, format.height],
    compress: true,
  });

  let isFirstPage = true;
  let currentStep = 0;

  if ((story as any).coverImageUrl) {
    try {
      onProgress?.({
        stage: "loading-cover",
        message: "Loading cover image...",
        progress: Math.round((currentStep / totalSteps) * 100),
      });

        const optimizedCover = await optimizeImageWithOverlay(
          (story as any).coverImageUrl,
          format.width,
          format.height,
          (story as any).coverTextOverlay,
          1.0
        );

      pdf.addImage(
        optimizedCover,
        "JPEG",
        0,
        0,
        format.width,
        format.height,
        undefined,
        "SLOW"
      );

      isFirstPage = false;
      currentStep++;
      console.log("✓ Added illustrated cover with text to PDF");
    } catch (error) {
      console.warn("Failed to load cover image:", error);
    }
  }

  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];

    if (!isFirstPage) {
      pdf.addPage([format.width, format.height], "portrait");
    } else {
      isFirstPage = false;
    }

    if (options.includeImages && page.imageUrl) {
      try {
        onProgress?.({
          stage: "processing-pages",
          current: i + 1,
          total: totalPages,
          message: `Processing page ${i + 1} of ${totalPages}...`,
          progress: Math.round((currentStep / totalSteps) * 100),
        });

          const optimizedImage = await optimizeImageWithOverlay(
            page.imageUrl,
            format.width,
            format.height,
            (page as any).textOverlay,
            0.95
          );

        pdf.addImage(
          optimizedImage,
          "JPEG",
          0,
          0,
          format.width,
          format.height,
          undefined,
          "SLOW"
        );

        currentStep++;
      } catch (error) {
        console.warn(
          `Failed to load image for page ${page.pageNumber}:`,
          error
        );

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(page.text, format.width - 72);
        pdf.text(textLines, 36, 100);
        currentStep++;
      }
    } else {
      currentStep++;
    }
  }

  onProgress?.({
    stage: "finalizing",
    message: "Finalizing PDF...",
    progress: Math.round(((totalSteps - 1) / totalSteps) * 100),
  });

  const formatLabel = formatKey.replace(".", "_");
  const fileName = `${story.title.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  )}_${formatLabel}_KDP_${Date.now()}.pdf`;
  console.log(`✓ PDF exported as: ${fileName}`);

  onProgress?.({
    stage: "complete",
    message: "Download starting...",
    progress: 100,
  });

  pdf.save(fileName);
}

export function validateStoryForExport(story: StoryWithPages): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!story.title.trim()) {
    errors.push("Story must have a title");
  }

  if (story.pages.length === 0) {
    errors.push("Story must have at least one page");
  }

  if (story.pages.some((page) => !page.text.trim())) {
    errors.push("All pages must have text content");
  }

  if (story.pages.length < 24) {
    errors.push("Amazon KDP recommends at least 24 pages for children's books");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
