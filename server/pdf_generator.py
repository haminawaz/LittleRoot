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


def add_text_overlay(c, overlay, page_width, page_height):
    """
    Add text overlay with a blurred background box
    """
    if not overlay or not overlay.get('isVisible', True):
        return
    
    try:
        text = overlay.get('text', '')
        if not text:
            return
            
        font_size = overlay.get('fontSize', 48)
        font_family = overlay.get('fontFamily', 'Helvetica-Bold')
        # Map common fonts to standard ReportLab fonts if needed
        font_map = {
            'Arial': 'Helvetica-Bold',
            'Georgia': 'Times-Bold',
            'Verdana': 'Helvetica-Bold',
            'Times New Roman': 'Times-Bold',
            'Courier New': 'Courier-Bold',
            'Comic Sans MS': 'Helvetica-Bold',
            'Trebuchet MS': 'Helvetica-Bold'
        }
        actual_font = font_map.get(font_family, 'Helvetica-Bold')
        
        color_hex = overlay.get('color', '#ffffff').lstrip('#')
        r = int(color_hex[0:2], 16) / 255.0
        g = int(color_hex[2:4], 16) / 255.0
        b = int(color_hex[4:6], 16) / 255.0
        
        x_pct = overlay.get('x', 50) / 100.0
        y_pct = overlay.get('y', 65) / 100.0
        text_align = overlay.get('textAlign', 'center')
        
        # ReportLab coordinates start from bottom-left
        # Invert Y from percentage (top-down) to points (bottom-up)
        # We also need to account for font height to roughly center vertically
        # Simple approximation: y_points = page_height * (1 - y_pct)
        y_points = page_height * (1 - y_pct)
        x_points = page_width * x_pct
        
        # Render background blur/glow (optional but improves readability)
        # We'll use a semi-transparent black rectangle
        c.saveState()
        c.setFillAlpha(0.4)
        c.setFillColorRGB(0, 0, 0)
        
        # Calculate text width for background sizing
        c.setFont(actual_font, font_size)
        
        # Handle multi-line text
        lines = text.split('\n')
        line_height = font_size * 1.2
        max_width = 0
        for line in lines:
            max_width = max(max_width, c.stringWidth(line, actual_font, font_size))
        
        # Background box
        bg_padding = font_size * 0.5
        bg_width = max_width + (bg_padding * 2)
        bg_height = (len(lines) * line_height) + (bg_padding * 1)
        
        # Rect coordinates
        if text_align == 'center':
            bg_x = x_points - (bg_width / 2)
        elif text_align == 'left':
            bg_x = x_points - bg_padding
        else: # right
            bg_x = x_points - bg_width + bg_padding
            
        bg_y = y_points - (bg_height / 2) - (font_size * 0.2)
        
        # Draw rounded rect for background
        c.roundRect(bg_x, bg_y, bg_width, bg_height, 10, stroke=0, fill=1)
        c.restoreState()
        
        # Draw text
        c.saveState()
        c.setFont(actual_font, font_size)
        c.setFillColorRGB(r, g, b)
        
        for i, line in enumerate(lines):
            # Calculate Y for each line (centered around y_points)
            line_y = y_points + ((len(lines) - 1) / 2.0 - i) * line_height - (font_size * 0.3)
            
            if text_align == 'center':
                c.drawCentredString(x_points, line_y, line)
            elif text_align == 'left':
                c.drawString(x_points, line_y, line)
            else: # right
                c.drawRightString(x_points, line_y, line)
        
        c.restoreState()
        
    except Exception as e:
        print(f"Error adding text overlay: {e}", file=sys.stderr)


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
                
                cover_overlay = config.get('cover_overlay')
                if cover_overlay:
                    add_text_overlay(c, cover_overlay, page_width, page_height)
                
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
                
                overlay = page.get('overlay')
                if overlay:
                    add_text_overlay(c, overlay, page_width, page_height)
                
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
