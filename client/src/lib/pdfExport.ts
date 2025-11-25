import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { StoryWithPages } from '@shared/schema';

export interface PDFExportOptions {
  format: 'kdp-6x9' | 'kdp-8.5x11' | 'custom';
  includeImages: boolean;
  pageMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const KDP_FORMATS = {
  'kdp-6x9': { width: 6 * 72, height: 9 * 72 }, // 6" x 9" in points
  'kdp-8.5x11': { width: 8.5 * 72, height: 11 * 72 }, // 8.5" x 11" in points
};

// PDF format size mapping (user-selectable formats)
// Standard formats (available to all tiers with allFormattingOptions)
const PDF_FORMATS: Record<string, { width: number; height: number }> = {
  // Standard 5 formats
  '5.5x8.5': { width: 5.5 * 72, height: 8.5 * 72 }, // 5.5" x 8.5" in points
  '7x7': { width: 7 * 72, height: 7 * 72 }, // 7" x 7" in points
  '8x8': { width: 8 * 72, height: 8 * 72 }, // 8" x 8" in points (default)
  '6x9': { width: 6 * 72, height: 9 * 72 }, // 6" x 9" in points
  '8x10': { width: 8 * 72, height: 10 * 72 }, // 8" x 10" in points
  
  // Additional 5 formats for Pro/Reseller tiers
  '5x8': { width: 5 * 72, height: 8 * 72 }, // 5" x 8" in points (popular KDP size)
  '8.5x11': { width: 8.5 * 72, height: 11 * 72 }, // 8.5" x 11" in points (letter size, workbooks)
  '8.5x8.5': { width: 8.5 * 72, height: 8.5 * 72 }, // 8.5" x 8.5" in points (large square)
  '6.14x9.21': { width: 6.14 * 72, height: 9.21 * 72 }, // 6.14" x 9.21" in points (A5-like trade paperback)
  '8.25x6': { width: 8.25 * 72, height: 6 * 72 }, // 8.25" x 6" in points (landscape)
};

export async function exportToPDF(
  story: StoryWithPages,
  options: PDFExportOptions = {
    format: 'kdp-8.5x11',
    includeImages: true,
    pageMargins: { top: 0, bottom: 0, left: 0, right: 0 }
  }
): Promise<void> {
  // Use the story's selected PDF format or default to 8x8
  const pdfFormat = (story as any).pdfFormat || '8x8';
  const format = PDF_FORMATS[pdfFormat] || PDF_FORMATS['8x8'];
  
  console.log(`📄 Exporting PDF with format: ${pdfFormat} (${format.width/72}" x ${format.height/72}")`);
  console.log(`   Story object pdfFormat:`, (story as any).pdfFormat);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [format.width, format.height]
  });

  // Track if this is the first page (to avoid adding an extra blank page)
  let isFirstPage = true;

  // Add illustrated front cover if available
  if ((story as any).coverImageUrl) {
    try {
      const coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        coverImg.onload = resolve;
        coverImg.onerror = reject;
        coverImg.src = (story as any).coverImageUrl;
      });

      // Add cover as full-page image (no margins)
      pdf.addImage(coverImg, 'WEBP', 0, 0, format.width, format.height);
      isFirstPage = false;
      console.log('✓ Added illustrated cover to PDF');
    } catch (error) {
      console.warn('Failed to load cover image:', error);
    }
  }

  // Add story pages as full-page illustrations
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    
    // Only add a new page if this isn't the first page
    if (!isFirstPage) {
      // IMPORTANT: Explicitly pass format to each addPage() call
      pdf.addPage([format.width, format.height], 'portrait');
    } else {
      isFirstPage = false;
    }

    // Add full-page illustration (text is embedded in the image)
    if (options.includeImages && page.imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = page.imageUrl!;
        });

        // Fill entire page with illustration - no margins, no separate text
        pdf.addImage(img, 'WEBP', 0, 0, format.width, format.height);
      } catch (error) {
        console.warn(`Failed to load image for page ${page.pageNumber}:`, error);
        
        // If image fails to load, show text only as fallback
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const textLines = pdf.splitTextToSize(page.text, format.width - 72);
        pdf.text(textLines, 36, 100);
      }
    }
  }

  // Download the PDF with format in filename
  const formatLabel = pdfFormat.replace('x', 'x').replace('.', '_');
  const fileName = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}_${formatLabel}_KDP_${Date.now()}.pdf`;
  console.log(`✓ PDF exported as: ${fileName}`);
  pdf.save(fileName);
}

export function validateStoryForExport(story: StoryWithPages): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!story.title.trim()) {
    errors.push('Story must have a title');
  }
  
  if (story.pages.length === 0) {
    errors.push('Story must have at least one page');
  }
  
  if (story.pages.some(page => !page.text.trim())) {
    errors.push('All pages must have text content');
  }
  
  if (story.pages.length < 24) {
    errors.push('Amazon KDP recommends at least 24 pages for children\'s books');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}