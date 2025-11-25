#!/usr/bin/env python3
"""
Professional PDF Generator using ReportLab
Ensures consistent formatting across all pages with proper image and text positioning
"""

import sys
import json
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
import io

# PDF format dimensions in inches (converted to points: 1 inch = 72 points)
PDF_FORMATS = {
    # Standard 5 formats
    '5.5x8.5': (5.5, 8.5),
    '7x7': (7, 7),
    '8x8': (8, 8),
    '6x9': (6, 9),
    '8x10': (8, 10),
    # Additional 5 formats for Pro/Reseller tiers
    '5x8': (5, 8),
    '8.5x11': (8.5, 11),
    '8.5x8.5': (8.5, 8.5),
    '6.14x9.21': (6.14, 9.21),
    '8.25x6': (8.25, 6),
}


def get_page_size(format_name):
    """Get page size in points (72 points = 1 inch)"""
    if format_name in PDF_FORMATS:
        width_in, height_in = PDF_FORMATS[format_name]
        return (width_in * 72, height_in * 72)
    # Default to 8x8
    return (8 * 72, 8 * 72)


def load_image_from_path(image_path):
    """Load and prepare image for PDF insertion"""
    try:
        # Handle both local paths and object storage paths
        if image_path.startswith('/objects/') or image_path.startswith('objects/'):
            # For object storage paths, we'll need to handle them differently
            # For now, skip object storage images during direct file access
            print(f"Skipping object storage path: {image_path}", file=sys.stderr)
            return None
        
        # Handle local file paths
        if not os.path.exists(image_path):
            print(f"Image not found: {image_path}", file=sys.stderr)
            return None
            
        # Open and convert image
        img = Image.open(image_path)
        
        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        
        return ImageReader(img)
    except Exception as e:
        print(f"Error loading image {image_path}: {e}", file=sys.stderr)
        return None


def add_image_to_page(c, image_reader, page_width, page_height):
    """
    Add image to page with full-bleed formatting (no white margins)
    Images are scaled to completely fill the page, with center-cropping if needed
    """
    if not image_reader:
        return
    
    try:
        # Get image dimensions
        img_width, img_height = image_reader.getSize()
        
        # Calculate scaling to fill entire page with NO white space
        # Use MAX scale to ensure image covers entire page (may crop some parts)
        scale_x = page_width / img_width
        scale_y = page_height / img_height
        scale = max(scale_x, scale_y)  # Use max for full-bleed, no letterboxing
        
        # Calculate scaled dimensions
        scaled_width = img_width * scale
        scaled_height = img_height * scale
        
        # Center the image on the page (crop edges if image is larger)
        x = (page_width - scaled_width) / 2
        y = (page_height - scaled_height) / 2
        
        # Draw image with calculated dimensions for full-bleed effect
        # This ensures no white margins while maintaining aspect ratio
        c.drawImage(
            image_reader,
            x,  # Centered horizontally (may be negative if cropping)
            y,  # Centered vertically (may be negative if cropping)
            width=scaled_width,  # Actual scaled width
            height=scaled_height,  # Actual scaled height
            preserveAspectRatio=False,  # We handle aspect ratio manually
            mask='auto'
        )
    except Exception as e:
        print(f"Error adding image to page: {e}", file=sys.stderr)


def generate_pdf(config):
    """
    Generate PDF with consistent formatting
    
    Args:
        config: Dictionary with:
            - output_path: Where to save the PDF
            - format: PDF format (e.g., '8x8', '6x9')
            - cover_image: Path to cover image (optional)
            - pages: List of dicts with 'image_path' for each page
    """
    try:
        output_path = config['output_path']
        pdf_format = config.get('format', '8x8')
        cover_image = config.get('cover_image')
        pages = config.get('pages', [])
        
        # Get page size
        page_width, page_height = get_page_size(pdf_format)
        
        print(f"Generating PDF: {output_path}", file=sys.stderr)
        print(f"Format: {pdf_format} ({page_width/72}\" x {page_height/72}\")", file=sys.stderr)
        print(f"Pages: {len(pages)}", file=sys.stderr)
        
        # Create canvas
        c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
        
        # Add cover if provided
        if cover_image:
            print(f"Adding cover: {cover_image}", file=sys.stderr)
            img_reader = load_image_from_path(cover_image)
            if img_reader:
                add_image_to_page(c, img_reader, page_width, page_height)
                c.showPage()  # Move to next page
                print("✓ Cover added", file=sys.stderr)
        
        # Add story pages
        for i, page in enumerate(pages):
            image_path = page.get('image_path')
            if not image_path:
                print(f"Skipping page {i+1}: no image path", file=sys.stderr)
                continue
            
            print(f"Adding page {i+1}/{len(pages)}: {image_path}", file=sys.stderr)
            img_reader = load_image_from_path(image_path)
            if img_reader:
                add_image_to_page(c, img_reader, page_width, page_height)
                c.showPage()  # Move to next page
                print(f"✓ Page {i+1} added", file=sys.stderr)
        
        # Save PDF
        c.save()
        
        # Get file size
        file_size = os.path.getsize(output_path)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"✓ PDF generated: {output_path} ({file_size_mb:.1f} MB)", file=sys.stderr)
        
        return {
            'success': True,
            'output_path': output_path,
            'file_size': file_size,
            'page_count': len(pages) + (1 if cover_image else 0)
        }
        
    except Exception as e:
        print(f"Error generating PDF: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    # Read config from stdin or command line argument
    if len(sys.argv) > 1:
        # Config passed as command line argument
        config = json.loads(sys.argv[1])
    else:
        # Config passed via stdin
        config = json.load(sys.stdin)
    
    result = generate_pdf(config)
    
    # Output result as JSON
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)
