import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface TextOverlayOptions {
  text: string;
  imagePath: string;
  outputPath: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: string;
}

/**
 * Add consistent text overlay to an image in the exact center
 * This ensures all pages have identical text formatting
 * Text is automatically wrapped to fit within the safe text area
 */
export async function addTextOverlay(options: TextOverlayOptions): Promise<void> {
  const {
    text,
    imagePath,
    outputPath,
    fontSize = 48,
    fontFamily = 'Arial',
    fontWeight = 'bold',
    textColor = 'white'
  } = options;

  try {
    // Load the image
    const imageBuffer = fs.readFileSync(imagePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    const width = metadata.width;
    const height = metadata.height;

    // Define safe text area (middle 60% of page)
    const textAreaWidth = width * 0.6;
    const textAreaHeight = height * 0.6;
    
    // Word wrap the text to fit within the safe area
    const lines = wrapText(text, fontSize, textAreaWidth);
    
    // Calculate vertical spacing
    const lineHeight = fontSize * 1.2; // 20% line spacing
    const totalTextHeight = lines.length * lineHeight;
    // Position text in lower third of image (65% down from top)
    const startY = (height * 0.65) - (totalTextHeight / 2);

    // Create SVG with multiple lines of text, all centered
    const tspans = lines.map((line, index) => {
      const y = startY + (index * lineHeight);
      return `<tspan x="50%" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`;
    }).join('');

    // Calculate background dimensions with generous padding
    // Background covers the full safe text area to guarantee it always encloses text
    // regardless of actual line widths or character glyphs
    const bgPadding = fontSize * 1.2; // Extra generous padding (1.2× font size)
    const bgWidth = textAreaWidth + (bgPadding * 2.5); // Extra wide to cover all cases
    const bgHeight = totalTextHeight + (bgPadding * 2);
    const bgX = (width - bgWidth) / 2;
    const bgY = startY - bgPadding;

    const svgText = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
        </defs>
        <style>
          .story-text {
            font-family: ${fontFamily}, sans-serif;
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            fill: ${textColor};
            text-anchor: middle;
            paint-order: stroke fill;
            stroke: black;
            stroke-width: 4px;
          }
        </style>
        <!-- Blurry black background for text visibility -->
        <rect 
          x="${bgX}" 
          y="${bgY}" 
          width="${bgWidth}" 
          height="${bgHeight}" 
          fill="rgba(0, 0, 0, 0.20)" 
          filter="url(#blur)"
          rx="15"
        />
        <!-- Text overlay -->
        <text 
          x="50%" 
          y="${startY}px" 
          class="story-text"
        >${tspans}</text>
      </svg>
    `;

    // Composite the text overlay on top of the image
    await image
      .composite([{
        input: Buffer.from(svgText),
        gravity: 'center'
      }])
      .toFile(outputPath);

    console.log(`✓ Added text overlay (${lines.length} lines) to ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Failed to add text overlay:`, error);
    throw error;
  }
}

/**
 * Wrap text to fit within a specified width
 * Returns array of text lines
 */
function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  // Conservative character width estimate for Arial Bold
  // Use 0.65 instead of 0.5 to account for wider characters (W, M, etc.)
  // This ensures text stays within the safe area
  const avgCharWidth = fontSize * 0.65;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [text];
}

/**
 * Helper function to escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
