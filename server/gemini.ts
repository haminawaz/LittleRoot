import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";
import { addTextOverlay } from "./imageUtils";
import { getFormatPromptInfo, getCompositionGuidance } from "./formatUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Compress and optimize image for print quality at 300 DPI
async function compressImage(
  buffer: Buffer, 
  outputPath: string, 
  width: number, 
  height: number
): Promise<void> {
  await sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: false
    })
    .webp({ quality: 78, effort: 6 })
    .toFile(outputPath);
}

export interface GenerateImageOptions {
  prompt: string;
  characterDescription?: string;
  artStyle: string;
  pdfFormat?: string; // PDF format for orientation guidance (e.g., "8x8", "8.25x6")
  width?: number;  // Image width in pixels (300 DPI)
  height?: number; // Image height in pixels (300 DPI)
}

export interface GenerateBookImagesOptions {
  title: string;
  content: string;
  artStyle: string;
  pageTexts: string[];
  characterDescription?: string;
  pdfFormat?: string; // PDF format for orientation guidance (e.g., "8x8", "8.25x6")
  width?: number;  // Image width in pixels (300 DPI)
  height?: number; // Image height in pixels (300 DPI)
}

export async function generateIllustration(
  options: GenerateImageOptions,
  outputPath: string,
  pageText?: string,
): Promise<void> {
  // Use the new streaming implementation for better performance
  return generateIllustrationStream(options, outputPath, pageText);
}

// Nano Banana streaming implementation for effortless image generation
export async function generateIllustrationStream(
  options: GenerateImageOptions,
  outputPath: string,
  pageText?: string,
): Promise<void> {
  try {
    let fullPrompt = `Create a full-page ${options.artStyle} illustration for a children's book. ${options.prompt}.`;
    
    // Note: Text will be added programmatically later for consistency
    // Generate clean artwork without embedded text
    if (pageText) {
      fullPrompt += ` 

SCENE CONTEXT (for composition only - DO NOT add text):
The illustration should visually depict: "${pageText}"

IMPORTANT: Create ONLY the artwork/illustration. Do NOT add any text, words, or letters to the image. Text will be added separately for consistency.`;
    }
    
    // If character description is provided, include it in the prompt
    if (options.characterDescription && options.characterDescription.trim()) {
      fullPrompt += ` Featuring this character: ${options.characterDescription}. Maintain character consistency.`;
    }
    
    // Get format info for proper composition
    const formatInfo = getFormatPromptInfo(options.pdfFormat || '8x8');
    const compositionGuidance = getCompositionGuidance(formatInfo.orientation);
    
    fullPrompt += ` Style: ${options.artStyle}. Make it vibrant, detailed, engaging, and appropriate for young children. The illustration should fill the entire page (${formatInfo.dimensions} ${formatInfo.orientationGuide}). Use rich colors and captivating details. DO NOT include any text in the image.
    
${compositionGuidance}`;
    
    // Prepare parts array for the request
    const parts: any[] = [];
    parts.push({ text: fullPrompt });

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    };
    
    const model = 'gemini-2.5-flash-image-preview';
    const contents = [
      {
        role: 'user',
        parts: parts,
      },
    ];

    // Stream the response from Nano Banana
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    
    let imageSaved = false;
    const fileName = path.basename(outputPath, path.extname(outputPath));
    
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const buffer = Buffer.from(inlineData.data || '', 'base64');
        
        const originalSize = buffer.length;
        
        // Compress and save the image for faster loading (always use WebP format)
        const webpPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp') + (!outputPath.match(/\.(png|jpg|jpeg|webp)$/i) ? '.webp' : '');
        // Use provided dimensions or default to 8x10 format (2400x3000)
        const imgWidth = options.width || 2400;
        const imgHeight = options.height || 3000;
        await compressImage(buffer, webpPath, imgWidth, imgHeight);
        
        const compressedSize = fs.statSync(webpPath).size;
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        console.log(`Image ${fileName} compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
        imageSaved = true;
      } else if (chunk.text) {
        console.log(`Nano Banana response: ${chunk.text}`);
      }
    }
    
    if (!imageSaved) {
      throw new Error("No image data found in stream response");
    }
  } catch (error) {
    throw new Error(`Failed to generate illustration with streaming: ${error}`);
  }
}

async function saveImageFromResponse(response: any, outputPath: string): Promise<void> {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No image generated");
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    throw new Error("No content parts in response");
  }

  for (const part of content.parts) {
    if (part.inlineData && part.inlineData.data) {
      const imageData = Buffer.from(part.inlineData.data, "base64");
      
      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, imageData);
      console.log(`Image saved as ${outputPath}`);
      return;
    }
  }
  
  throw new Error("No image data found in response");
}

export function splitStoryIntoPages(content: string, targetPages: number): string[] {
  // Check for manual page break markers (---)
  const pageBreakPattern = /---+/g;
  const hasManualBreaks = pageBreakPattern.test(content);
  
  if (hasManualBreaks) {
    // Split by manual page breaks - accept ALL user-defined segments
    const manualPages = content
      .split(/---+/)
      .map(page => page.trim());
    
    console.log(`✓ Found ${manualPages.length} manual page breaks (using '---' delimiters)`);
    console.log(`✓ Using ${manualPages.length} manual pages (ignoring target: ${targetPages})`);
    
    // Always use manual pages exactly as user specified
    return manualPages;
  }
  
  // Automatic splitting (original logic)
  // Remove extra whitespace and split into sentences
  const sentences = content
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim() + '.');

  if (sentences.length === 0) {
    return Array(targetPages).fill("Your story will appear here.");
  }

  const pages: string[] = [];

  // ALWAYS create EXACTLY targetPages pages
  if (sentences.length <= targetPages) {
    // Fewer sentences than pages: distribute sentences evenly, some pages may have empty or repeated content
    const sentencesPerPage = Math.floor(targetPages / sentences.length);
    const extraPages = targetPages % sentences.length;
    
    for (let i = 0; i < sentences.length; i++) {
      pages.push(sentences[i]);
    }
    
    // Fill remaining pages by distributing the last few sentences
    while (pages.length < targetPages) {
      const fillIndex = pages.length % sentences.length;
      pages.push(sentences[fillIndex]);
    }
  } else {
    // More sentences than pages: group sentences together
    const sentencesPerPage = Math.floor(sentences.length / targetPages);
    const extraSentences = sentences.length % targetPages;
    
    let sentenceIndex = 0;
    for (let pageNum = 0; pageNum < targetPages; pageNum++) {
      // Some pages get an extra sentence to distribute all content evenly
      const numSentences = sentencesPerPage + (pageNum < extraSentences ? 1 : 0);
      const pageSentences = sentences.slice(sentenceIndex, sentenceIndex + numSentences);
      pages.push(pageSentences.join(' '));
      sentenceIndex += numSentences;
    }
  }

  console.log(`✓ Split ${sentences.length} sentences into EXACTLY ${pages.length} pages (target: ${targetPages})`);
  
  return pages;
}

export function generateImagePrompt(pageText: string, storyTitle: string, artStyle: string): string {
  return `Children's book illustration for "${storyTitle}". Scene: ${pageText}. Style: ${artStyle}. The image should be vibrant, child-friendly, and capture the essence of this part of the story.`;
}

// Generate all book illustrations sequentially for maximum reliability
export async function generateBookIllustrations(
  options: GenerateBookImagesOptions,
  outputDirectory: string,
  storyId: string,
  onPageComplete?: (pageIndex: number, imageUrl: string) => Promise<void>
): Promise<string[]> {
  const { pageTexts, title, content, artStyle, characterDescription, pdfFormat = '8x8' } = options;
  
  console.log(`Generating ${pageTexts.length} illustrations for "${title}" using sequential generation with Gemini 2.5 Flash Image (Nano Banana)...`);
  
  // Ensure the directory exists
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
  
  const imageUrls: string[] = [];
  const MAX_RETRIES = 2;
  
  // Generate each image sequentially for better consistency and reliability
  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex++) {
    const pageText = pageTexts[pageIndex];
    const pageNumber = pageIndex + 1;
    let lastError: Error | null = null;
    
    // Retry logic for each image
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Generating illustration ${pageNumber}/${pageTexts.length} (attempt ${attempt}/${MAX_RETRIES})...`);
        
        // Create a detailed prompt with full story context for consistency
        const fullPrompt = createIndividualPagePrompt({
          pageText,
          pageNumber,
          totalPages: pageTexts.length,
          title,
          storyOverview: content,
          artStyle,
          characterDescription,
          pdfFormat
        });
        
        const parts = [{ text: fullPrompt }];
        const config = {
          responseModalities: ['IMAGE', 'TEXT'],
        };
        
        const model = 'gemini-2.5-flash-image-preview';
        const contents = [{
          role: 'user',
          parts: parts,
        }];

        // Stream the response from Nano Banana
        const response = await ai.models.generateContentStream({
          model,
          config,
          contents,
        });
        
        let imageSaved = false;
        
        for await (const chunk of response) {
          if (!chunk.candidates?.[0]?.content?.parts) {
            continue;
          }
          
          for (const part of chunk.candidates[0].content.parts) {
            if (part.inlineData) {
              const buffer = Buffer.from(part.inlineData.data || '', 'base64');
              const originalSize = buffer.length;
              const fileName = `${storyId}_page_${pageNumber}.webp`;
              const tempImagePath = path.join(outputDirectory, `temp_${fileName}`);
              const finalImagePath = path.join(outputDirectory, fileName);
              
              // Step 1: Compress and save the base image
              // Use provided dimensions or default to 8x8 format (2400x2400)
              const imgWidth = options.width || 2400;
              const imgHeight = options.height || 2400;
              await compressImage(buffer, tempImagePath, imgWidth, imgHeight);
              
              // Step 2: Add consistent text overlay on top
              await addTextOverlay({
                text: pageText,
                imagePath: tempImagePath,
                outputPath: finalImagePath,
                fontSize: 72,  // Extra large font for thumbnail visibility
                fontFamily: 'Arial',
                fontWeight: 'bold',
                textColor: 'white'
              });
              
              // Clean up temp file
              fs.unlinkSync(tempImagePath);
              
              const compressedSize = fs.statSync(finalImagePath).size;
              const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
              
              const timestamp = Date.now();
              const imageUrl = `/generated-images/${fileName}?t=${timestamp}`;
              imageUrls.push(imageUrl);
              
              console.log(`✓ Page ${pageNumber}/${pageTexts.length}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) + text overlay`);
              imageSaved = true;
              
              // Call the callback immediately after this page is complete
              if (onPageComplete) {
                await onPageComplete(pageIndex, imageUrl);
              }
            }
          }
          
          if (chunk.text) {
            console.log(`Gemini response: ${chunk.text}`);
          }
        }
        
        if (!imageSaved) {
          throw new Error(`No image data received for page ${pageNumber}`);
        }
        
        // Success - break retry loop
        break;
        
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        console.error(`Failed to generate page ${pageNumber} (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
        
        // Check for quota/rate limit errors
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || 
            errorMessage.includes('quota') || 
            errorMessage.includes('429')) {
          throw new Error('API quota exceeded. Please wait a moment and try again, or check your API usage limits.');
        }
        
        // If this was the last attempt, throw the error
        if (attempt === MAX_RETRIES) {
          throw new Error(`Failed to generate illustration for page ${pageNumber} after ${MAX_RETRIES} attempts: ${errorMessage}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Small delay between pages to avoid rate limits
    if (pageIndex < pageTexts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`✓ Successfully generated all ${imageUrls.length} illustrations for "${title}"`);
  return imageUrls;
}

// Generate an illustrated front cover
export async function generateCoverIllustration(
  title: string,
  artStyle: string,
  storyOverview: string,
  characterDescription: string | undefined,
  outputPath: string,
  pdfFormat?: string,  // PDF format for orientation guidance
  width?: number,  // Image width in pixels (300 DPI)
  height?: number  // Image height in pixels (300 DPI)
): Promise<void> {
  const parts = [];
  
  let prompt = `Create a stunning full-page front cover illustration for the children's book titled "${title}".

STORY OVERVIEW:
${storyOverview}`;

  if (characterDescription && characterDescription.trim()) {
    prompt += `

MAIN CHARACTER:
${characterDescription}`;
  }

  // Get format info for proper composition
  const formatInfo = getFormatPromptInfo(pdfFormat || '8x8');
  const compositionGuidance = getCompositionGuidance(formatInfo.orientation);

  prompt += `

COVER REQUIREMENTS:
- Art style: STRICTLY ${artStyle} style
- Format: Full-page cover (${formatInfo.dimensions} ${formatInfo.orientationGuide})
- Show the main scene or character(s) from the story in an engaging, eye-catching way
- Make it colorful, magical, and inviting to children
- Use vibrant colors and captivating details that represent the story
- The cover should make children excited to read the book
- CRITICAL: Fill the ENTIRE canvas edge-to-edge with artwork
- ABSOLUTELY NO white borders, white margins, or white space on ANY edge (top, bottom, left, right)
- Extend the artwork all the way to the canvas boundaries
- The illustration must bleed to all four edges

${compositionGuidance}

CRITICAL TITLE TEXT PLACEMENT:
- Display this EXACT title: "${title}"
- Position title in the UPPER THIRD of the cover (approximately 25-35% from the top)
- Center-align the title text horizontally (50% from left edge)
- Keep title within the MIDDLE 70% of page width (15% margin on left, 15% on right)
- NEVER place title near left/right edges or in corners
- Use MEDIUM-SIZED, BEAUTIFUL, child-friendly typography that is readable but not overwhelming
- Title must be FULLY VISIBLE with NO CUTOFF whatsoever
- Title color must CONTRAST STRONGLY with background for perfect readability
- Title should be artistically integrated but not dominate the entire cover
- Make title text CLEAR, READABLE, and VISUALLY APPEALING

Create an enchanting, professional-quality children's book cover with a perfectly centered, prominent title.`;

  parts.push({ text: prompt });

  const config = {
    responseModalities: ['IMAGE', 'TEXT'],
  };
  
  const model = 'gemini-2.5-flash-image-preview';
  const contents = [{
    role: 'user',
    parts: parts,
  }];

  // Stream the response from Nano Banana
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  
  let imageSaved = false;
  
  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts) {
      continue;
    }
    
    for (const part of chunk.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data || '', 'base64');
        const originalSize = buffer.length;
        
        // Compress and save the cover image
        // Use provided dimensions or default to 8x10 format (2400x3000)
        const imgWidth = width || 2400;
        const imgHeight = height || 3000;
        await compressImage(buffer, outputPath, imgWidth, imgHeight);
        const compressedSize = fs.statSync(outputPath).size;
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        console.log(`✓ Cover generated: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
        imageSaved = true;
      }
    }
  }
  
  if (!imageSaved) {
    throw new Error("Failed to generate cover illustration");
  }
}

// Helper function to create a consistent prompt for individual page illustrations
function createIndividualPagePrompt(params: {
  pageText: string;
  pageNumber: number;
  totalPages: number;
  title: string;
  storyOverview: string;
  artStyle: string;
  characterDescription?: string;
  pdfFormat?: string;
}): string {
  const { pageText, pageNumber, totalPages, title, storyOverview, artStyle, characterDescription, pdfFormat = '8x8' } = params;
  
  let prompt = `Create a full-page ${artStyle} illustration for page ${pageNumber} of ${totalPages} in the children's book "${title}".

STORY OVERVIEW:
${storyOverview}

THIS PAGE (${pageNumber}/${totalPages}):
${pageText}`;

  if (characterDescription && characterDescription.trim()) {
    prompt += `

CHARACTER DESCRIPTION (maintain consistency):
${characterDescription}`;
  }

  // Get format info for proper composition
  const formatInfo = getFormatPromptInfo(pdfFormat);
  const compositionGuidance = getCompositionGuidance(formatInfo.orientation);

  prompt += `

CRITICAL REQUIREMENTS:
- Art style: STRICTLY ${artStyle} style - maintain this exact art style throughout the entire book
- Format: Full-page illustration (${formatInfo.dimensions} ${formatInfo.orientationGuide})
- Create ONE full-page illustration that depicts this specific page's scene
- Maintain EXACT SAME character design, color palette, and artistic style throughout the entire book
- Keep characters looking IDENTICAL to how they appear in all other pages
- Use vibrant, rich colors appropriate for children
- Make it detailed, engaging, and true to the story
- CRITICAL: Fill the ENTIRE canvas edge-to-edge with artwork
- ABSOLUTELY NO white borders, white margins, white space, or padding on ANY edge (top, bottom, left, right)
- ABSOLUTELY NO rounded corners or decorative borders
- Extend the artwork all the way to the canvas boundaries
- The illustration must bleed to all four edges with NO exceptions

${compositionGuidance}

IMPORTANT TEXT INSTRUCTION:
- DO NOT add any text, words, or letters to the image
- Generate ONLY the artwork/illustration
- Text will be added programmatically later for consistency
- Create clean, beautiful artwork without any embedded text`;

  return prompt;
}
