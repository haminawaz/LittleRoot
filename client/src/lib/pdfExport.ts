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

async function optimizeImageForPDF(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const maxDimension = Math.max(targetWidth, targetHeight);
        const scaleFactor = maxDimension > 2500 ? 2500 / maxDimension : 1;
        const canvasWidth = Math.round(targetWidth * scaleFactor);
        const canvasHeight = Math.round(targetHeight * scaleFactor);

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

        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

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

export async function exportToPDF(
  story: StoryWithPages,
  options: PDFExportOptions = {
    format: "kdp-8.5x11",
    includeImages: true,
    pageMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  onProgress?: (progress: PDFExportProgress) => void
): Promise<void> {
  const pdfFormat = (story as any).pdfFormat || "8x8";
  const format = PDF_FORMATS[pdfFormat] || PDF_FORMATS["8x8"];

  console.log(
    `📄 Exporting PDF with format: ${pdfFormat} (${format.width / 72}" x ${
      format.height / 72
    }")`
  );
  console.log(`   Story object pdfFormat:`, (story as any).pdfFormat);

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

        const optimizedCover = await optimizeImageForPDF(
          (story as any).coverImageUrl,
          format.width,
          format.height,
          0.88
        );

      pdf.addImage(
        optimizedCover,
        "JPEG",
        0,
        0,
        format.width,
        format.height,
        undefined,
        "FAST"
      );
      isFirstPage = false;
      currentStep++;
      console.log("✓ Added illustrated cover to PDF");
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

          const optimizedImage = await optimizeImageForPDF(
            page.imageUrl,
            format.width,
            format.height,
            0.82 
          );

        pdf.addImage(
          optimizedImage,
          "JPEG",
          0,
          0,
          format.width,
          format.height,
          undefined,
          "FAST"
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

  const formatLabel = pdfFormat.replace("x", "x").replace(".", "_");
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
