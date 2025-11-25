// PDF Format utilities for image generation prompts

export interface FormatPromptInfo {
  dimensions: string;
  orientation: 'portrait' | 'landscape' | 'square';
  aspectRatio: string;
  orientationGuide: string;
}

// Map PDF formats to dimensions and orientation for AI prompts
export const FORMAT_PROMPT_INFO: Record<string, FormatPromptInfo> = {
  "5x8": {
    dimensions: '5" × 8"',
    orientation: 'portrait',
    aspectRatio: '5:8',
    orientationGuide: 'vertical/portrait orientation (taller than wide)'
  },
  "5.5x8.5": {
    dimensions: '5.5" × 8.5"',
    orientation: 'portrait',
    aspectRatio: '5.5:8.5',
    orientationGuide: 'vertical/portrait orientation (taller than wide)'
  },
  "6x9": {
    dimensions: '6" × 9"',
    orientation: 'portrait',
    aspectRatio: '6:9',
    orientationGuide: 'vertical/portrait orientation (taller than wide)'
  },
  "6.14x9.21": {
    dimensions: '6.14" × 9.21"',
    orientation: 'portrait',
    aspectRatio: '6.14:9.21',
    orientationGuide: 'vertical/portrait orientation (taller than wide, A5-like)'
  },
  "7x7": {
    dimensions: '7" × 7"',
    orientation: 'square',
    aspectRatio: '1:1',
    orientationGuide: 'square format (equal width and height)'
  },
  "8x8": {
    dimensions: '8" × 8"',
    orientation: 'square',
    aspectRatio: '1:1',
    orientationGuide: 'square format (equal width and height)'
  },
  "8x10": {
    dimensions: '8" × 10"',
    orientation: 'portrait',
    aspectRatio: '8:10',
    orientationGuide: 'vertical/portrait orientation (taller than wide)'
  },
  "8.25x6": {
    dimensions: '8.25" × 6"',
    orientation: 'landscape',
    aspectRatio: '8.25:6',
    orientationGuide: 'horizontal/landscape orientation (wider than tall)'
  },
  "8.5x8.5": {
    dimensions: '8.5" × 8.5"',
    orientation: 'square',
    aspectRatio: '1:1',
    orientationGuide: 'square format (equal width and height)'
  },
  "8.5x11": {
    dimensions: '8.5" × 11"',
    orientation: 'portrait',
    aspectRatio: '8.5:11',
    orientationGuide: 'vertical/portrait orientation (taller than wide, standard letter)'
  }
};

export function getFormatPromptInfo(pdfFormat: string): FormatPromptInfo {
  return FORMAT_PROMPT_INFO[pdfFormat] || FORMAT_PROMPT_INFO["8x8"];
}

// Generate composition guidance based on orientation
export function getCompositionGuidance(orientation: 'portrait' | 'landscape' | 'square'): string {
  switch (orientation) {
    case 'landscape':
      return `CRITICAL COMPOSITION for LANDSCAPE format:
- Compose the scene horizontally (wider than tall)
- Use the full width for panoramic scenes
- Place main elements across the horizontal space
- Avoid tall vertical compositions - use the landscape orientation naturally
- Think wide, horizontal scenes that fill the landscape format beautifully`;
    
    case 'portrait':
      return `CRITICAL COMPOSITION for PORTRAIT format:
- Compose the scene vertically (taller than wide)
- Use the full height for vertical scenes
- Place main elements in vertical arrangement
- Avoid wide horizontal compositions - use the portrait orientation naturally
- Think tall, vertical scenes that fill the portrait format beautifully`;
    
    case 'square':
      return `CRITICAL COMPOSITION for SQUARE format:
- Compose the scene with balanced, centered composition
- Equal emphasis on all directions
- Main elements centered or evenly distributed
- Use the square format's symmetry for balanced, pleasing compositions`;
  }
}
