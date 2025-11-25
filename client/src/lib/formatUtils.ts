// PDF Format information and utilities

export interface FormatInfo {
  label: string;
  dimensions: string;
  aspectRatio: string;
}

export const PDF_FORMATS: Record<string, FormatInfo> = {
  "5x8": {
    label: "Popular KDP",
    dimensions: '5" × 8"',
    aspectRatio: "portrait"
  },
  "5.5x8.5": {
    label: "Digest",
    dimensions: '5.5" × 8.5"',
    aspectRatio: "portrait"
  },
  "6x9": {
    label: "Trade Paperback",
    dimensions: '6" × 9"',
    aspectRatio: "portrait"
  },
  "6.14x9.21": {
    label: "A5-like",
    dimensions: '6.14" × 9.21"',
    aspectRatio: "portrait"
  },
  "7x7": {
    label: "Square",
    dimensions: '7" × 7"',
    aspectRatio: "square"
  },
  "8x8": {
    label: "Default Square",
    dimensions: '8" × 8"',
    aspectRatio: "square"
  },
  "8x10": {
    label: "Portrait",
    dimensions: '8" × 10"',
    aspectRatio: "portrait"
  },
  "8.25x6": {
    label: "Landscape",
    dimensions: '8.25" × 6"',
    aspectRatio: "landscape"
  },
  "8.5x8.5": {
    label: "Large Square",
    dimensions: '8.5" × 8.5"',
    aspectRatio: "square"
  },
  "8.5x11": {
    label: "Letter/Workbooks",
    dimensions: '8.5" × 11"',
    aspectRatio: "portrait"
  }
};

export function getFormatInfo(pdfFormat: string): FormatInfo {
  return PDF_FORMATS[pdfFormat] || {
    label: "Custom",
    dimensions: pdfFormat,
    aspectRatio: "unknown"
  };
}

export function getFormatBadgeText(pdfFormat: string): string {
  const info = getFormatInfo(pdfFormat);
  return `${info.dimensions} ${info.label}`;
}
