import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { objectStorageClient, parseObjectPath } from './objectStorage';

const execAsync = promisify(exec);

// PDF format size mapping (in points for PDF)
const PDF_FORMATS: Record<string, { width: number; height: number }> = {
  // Standard 5 formats
  '5.5x8.5': { width: 5.5 * 72, height: 8.5 * 72 },
  '7x7': { width: 7 * 72, height: 7 * 72 },
  '8x8': { width: 8 * 72, height: 8 * 72 },
  '6x9': { width: 6 * 72, height: 9 * 72 },
  '8x10': { width: 8 * 72, height: 10 * 72 },
  
  // Additional 5 formats for Pro/Reseller tiers
  '5x8': { width: 5 * 72, height: 8 * 72 },
  '8.5x11': { width: 8.5 * 72, height: 11 * 72 },
  '8.5x8.5': { width: 8.5 * 72, height: 8.5 * 72 },
  '6.14x9.21': { width: 6.14 * 72, height: 9.21 * 72 },
  '8.25x6': { width: 8.25 * 72, height: 6 * 72 },
};

// Image dimensions at 300 DPI for print quality
export const IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  // Standard 5 formats
  '5.5x8.5': { width: Math.round(5.5 * 300), height: Math.round(8.5 * 300) }, // 1650x2550
  '7x7': { width: Math.round(7 * 300), height: Math.round(7 * 300) }, // 2100x2100
  '8x8': { width: Math.round(8 * 300), height: Math.round(8 * 300) }, // 2400x2400
  '6x9': { width: Math.round(6 * 300), height: Math.round(9 * 300) }, // 1800x2700
  '8x10': { width: Math.round(8 * 300), height: Math.round(10 * 300) }, // 2400x3000
  
  // Additional 5 formats for Pro/Reseller tiers
  '5x8': { width: Math.round(5 * 300), height: Math.round(8 * 300) }, // 1500x2400
  '8.5x11': { width: Math.round(8.5 * 300), height: Math.round(11 * 300) }, // 2550x3300
  '8.5x8.5': { width: Math.round(8.5 * 300), height: Math.round(8.5 * 300) }, // 2550x2550
  '6.14x9.21': { width: Math.round(6.14 * 300), height: Math.round(9.21 * 300) }, // 1842x2763
  '8.25x6': { width: Math.round(8.25 * 300), height: Math.round(6 * 300) }, // 2475x1800
};

/**
 * Get image dimensions for a PDF format at 300 DPI
 */
export function getImageDimensionsForFormat(pdfFormat: string): { width: number; height: number } {
  return IMAGE_DIMENSIONS[pdfFormat] || IMAGE_DIMENSIONS['8x8'];
}

export interface GeneratePDFOptions {
  storyId: string;
  storyTitle: string;
  pdfFormat: string;
  coverImageUrl?: string;
  pages: Array<{
    pageNumber: number;
    imageUrl: string;
    text: string;
  }>;
}

/**
 * Generate PDF on the server and upload to cloud storage
 * This is much faster than client-side generation
 */
export async function generateAndUploadPDF(options: GeneratePDFOptions): Promise<string> {
  const { storyId, storyTitle, pdfFormat, coverImageUrl, pages } = options;
  
  console.log(`📄 Generating PDF for story: ${storyTitle} (${pages.length} pages)`);
  
  // Get format dimensions
  const format = PDF_FORMATS[pdfFormat] || PDF_FORMATS['8x8'];
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [format.width, format.height]
  });

  let isFirstPage = true;

  // Add cover if available
  if (coverImageUrl) {
    try {
      const { data, format: imgFormat } = await downloadImage(coverImageUrl);
      // Fit image to page - it will scale to fill the entire page
      pdf.addImage(
        `data:image/${imgFormat.toLowerCase()};base64,${data}`, 
        imgFormat, 
        0, 
        0, 
        format.width, 
        format.height,
        undefined,
        'FAST' // Compression for smaller file size
      );
      isFirstPage = false;
      console.log('✓ Added cover to PDF');
    } catch (error) {
      console.warn('Failed to add cover:', error);
    }
  }

  // Add story pages
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    if (!isFirstPage) {
      pdf.addPage([format.width, format.height], 'portrait');
    } else {
      isFirstPage = false;
    }

    // Download and add page image
    try {
      const { data, format: imgFormat } = await downloadImage(page.imageUrl);
      // Fit image to page - it will scale to fill the entire page regardless of original size
      pdf.addImage(
        `data:image/${imgFormat.toLowerCase()};base64,${data}`, 
        imgFormat, 
        0, 
        0, 
        format.width, 
        format.height,
        undefined,
        'FAST' // Compression for smaller file size
      );
      console.log(`✓ Added page ${page.pageNumber}/${pages.length}`);
    } catch (error) {
      console.error(`Failed to add page ${page.pageNumber}:`, error);
      // Add text-only fallback
      pdf.setFontSize(12);
      pdf.text(page.text, 36, 100, { maxWidth: format.width - 72 });
    }
  }

  // Save PDF to buffer
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  console.log(`✓ PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);

  // Upload to cloud storage
  const pdfUrl = await uploadPDFToStorage(storyId, storyTitle, pdfFormat, pdfBuffer);
  
  console.log(`✓ PDF uploaded: ${pdfUrl}`);
  return pdfUrl;
}

/**
 * Download image from URL and return as base64 string with format
 */
async function downloadImage(imageUrl: string): Promise<{ data: string; format: string }> {
  let buffer: Buffer;
  
  // Handle local file paths
  if (imageUrl.startsWith('/generated-images/')) {
    const filePath = path.join(process.cwd(), 'generated-images', path.basename(imageUrl.split('?')[0]));
    buffer = fs.readFileSync(filePath);
  } else {
    // Handle remote URLs
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  }

  // Detect image format from buffer
  const format = detectImageFormat(buffer, imageUrl);
  
  // Convert to base64
  const base64 = buffer.toString('base64');
  
  return { data: base64, format };
}

/**
 * Detect image format from buffer or filename
 */
function detectImageFormat(buffer: Buffer, filename: string): string {
  // Check file extension first
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'PNG';
  if (ext === '.jpg' || ext === '.jpeg') return 'JPEG';
  if (ext === '.webp') return 'WEBP';
  
  // Check magic bytes
  const magic = buffer.slice(0, 12);
  
  // PNG magic number
  if (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47) {
    return 'PNG';
  }
  
  // JPEG magic number
  if (magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF) {
    return 'JPEG';
  }
  
  // WEBP magic number
  if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46 &&
      magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50) {
    return 'WEBP';
  }
  
  // Default to JPEG as safest fallback
  return 'JPEG';
}

/**
 * Upload PDF to cloud storage and return public URL
 */
async function uploadPDFToStorage(
  storyId: string,
  storyTitle: string,
  pdfFormat: string,
  pdfBuffer: Buffer
): Promise<string> {
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
  if (!privateObjectDir) {
    throw new Error('PRIVATE_OBJECT_DIR not set');
  }

  // Create filename
  const sanitizedTitle = storyTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const formatLabel = pdfFormat.replace('x', 'x');
  const fileName = `${storyId}_${sanitizedTitle}_${formatLabel}.pdf`;
  
  // Upload to cloud storage
  const fullPath = `${privateObjectDir}/pdfs/${fileName}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  await file.save(pdfBuffer, {
    contentType: 'application/pdf',
    metadata: {
      metadata: {
        storyId,
        pdfFormat,
      }
    }
  });

  // Return the object URL path
  return `/objects/pdfs/${fileName}`;
}

/**
 * Generate PDF using ReportLab (Python) for professional, consistent formatting
 * This ensures all pages are formatted identically with proper image placement
 */
export async function generatePDFWithReportLab(options: GeneratePDFOptions): Promise<string> {
  const { storyId, storyTitle, pdfFormat, coverImageUrl, pages } = options;
  
  console.log(`📄 Generating PDF for "${storyTitle}" using ReportLab (${pages.length} pages)`);
  
  // Create temp directory for images
  const tempDir = path.join(process.cwd(), 'temp-pdf', storyId);
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    // Download cover image if exists
    let coverPath: string | undefined;
    if (coverImageUrl) {
      coverPath = path.join(tempDir, 'cover.png');
      await downloadImageToFile(coverImageUrl, coverPath);
      console.log('✓ Cover downloaded');
    }
    
    // Download all page images
    const pagePaths: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.imageUrl) {
        console.warn(`⚠️  Page ${page.pageNumber} has no image, skipping`);
        continue;
      }
      
      try {
        const pagePath = path.join(tempDir, `page_${page.pageNumber}.png`);
        await downloadImageToFile(page.imageUrl, pagePath);
        pagePaths.push(pagePath);
        console.log(`✓ Downloaded page ${page.pageNumber}/${pages.length}`);
      } catch (error) {
        console.error(`Failed to download page ${page.pageNumber}:`, error);
        // Continue with other pages instead of failing entirely
      }
    }
    
    // Prepare config for Python script
    const pdfOutputPath = path.join(tempDir, 'output.pdf');
    const config = {
      output_path: pdfOutputPath,
      format: pdfFormat,
      cover_image: coverPath,
      pages: pagePaths.map(p => ({ image_path: p }))
    };
    
    // Call Python script
    const pythonScript = path.join(process.cwd(), 'server', 'pdf_generator.py');
    const configJson = JSON.stringify(config);
    
    console.log('📄 Calling ReportLab PDF generator...');
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" '${configJson.replace(/'/g, "'\\''")}'`
    );
    
    if (stderr) {
      console.log('ReportLab output:', stderr);
    }
    
    // Parse result
    const result = JSON.parse(stdout);
    
    if (!result.success) {
      throw new Error(`ReportLab failed: ${result.error}`);
    }
    
    console.log(`✓ PDF generated: ${(result.file_size / 1024 / 1024).toFixed(1)} MB`);
    
    // Read the generated PDF
    const pdfBuffer = fs.readFileSync(pdfOutputPath);
    
    // Upload to cloud storage
    const pdfUrl = await uploadPDFToStorage(storyId, storyTitle, pdfFormat, pdfBuffer);
    
    console.log(`✓ PDF uploaded: ${pdfUrl}`);
    
    return pdfUrl;
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✓ Temp files cleaned up');
    } catch (error) {
      console.warn('Failed to clean up temp files:', error);
    }
  }
}

/**
 * Download image from URL/path and save to file
 */
async function downloadImageToFile(imageUrl: string, outputPath: string): Promise<void> {
  let buffer: Buffer;
  
  // Handle local file paths
  if (imageUrl.startsWith('/generated-images/')) {
    const filePath = path.join(process.cwd(), 'generated-images', path.basename(imageUrl.split('?')[0]));
    buffer = fs.readFileSync(filePath);
  } else if (imageUrl.startsWith('/objects/')) {
    // Handle object storage paths
    // Download from object storage
    const { bucketName, objectName } = parseObjectPath(imageUrl);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [fileBuffer] = await file.download();
    buffer = fileBuffer;
  } else {
    // Handle remote URLs
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  }
  
  // Save to file
  fs.writeFileSync(outputPath, buffer);
}
