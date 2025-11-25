# LittleRoot Design Guidelines

## Design Approach
**Reference-Based Creative Tools Design** inspired by Canva's approachable creativity, Notion's friendly professionalism, and Headspace's calming color psychology. The design balances playful energy (for children's content) with credible professionalism (for parent/educator trust).

**Core Principles:**
- Joyful whimsy with purposeful restraint
- Illustration-forward showcase strategy
- Trust-building through polish and clarity

## Color Palette

**Primary Colors:**
- Primary Blue: 217 91% 60% (friendly, trustworthy sky blue)
- Primary Purple: 270 70% 65% (creative, imaginative soft purple)
- Success Green: 142 76% 36% (affirming, growth-oriented)

**Background System:**
- Light Mode Base: 0 0% 100% (pure white for content clarity)
- Gradient Overlays: blue-50 to purple-50 (existing, use sparingly for hero/CTAs)
- Card Backgrounds: 0 0% 98% (subtle off-white for depth)

**Accent & Functional:**
- Warm Accent: 24 85% 60% (playful coral-orange for CTAs)
- Text Primary: 222 47% 11% (dark blue-gray for readability)
- Text Secondary: 215 20% 45% (muted blue-gray)

**Dark Mode:**
- Base: 222 47% 11%
- Cards: 217 25% 16%
- Maintain same hues with adjusted lightness (60% → 70% for colors)

## Typography

**Font Families:**
- Headings: 'Poppins' (rounded, friendly, weights: 600, 700)
- Body: 'Inter' (clean readability, weights: 400, 500, 600)

**Scale & Hierarchy:**
- Hero H1: text-5xl md:text-6xl lg:text-7xl font-bold
- Section H2: text-3xl md:text-4xl lg:text-5xl font-semibold
- Card H3: text-xl md:text-2xl font-semibold
- Body: text-base md:text-lg leading-relaxed
- Small Text: text-sm for captions, labels

## Layout System

**Spacing Primitives:** Use Tailwind units 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Section padding: py-16 md:py-24 lg:py-32
- Card padding: p-6 md:p-8
- Element gaps: gap-4, gap-6, gap-8, gap-12

**Container Strategy:**
- Full-width sections with max-w-7xl centered containers
- Content max-width: max-w-6xl for reading comfort
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

**Navigation:**
- Sticky header with backdrop-blur-lg bg-white/80
- Logo (illustrated book icon + wordmark) on left
- Center: Features, Pricing, Gallery links
- Right: Login + "Start Creating" CTA (warm accent color)

**Hero Section (Full viewport 90vh):**
- Split layout: 50/50 text-left, image-right on desktop
- Left: Oversized H1, supporting paragraph, dual CTAs (primary solid + secondary outline with backdrop-blur-md)
- Right: Large hero image showcasing AI-generated storybook illustration
- Background: Subtle blue-to-purple gradient overlay at 20% opacity

**Feature Cards:**
- Elevated cards: rounded-2xl shadow-lg hover:shadow-xl transition
- Icon area: 64px circular gradient background (blue-to-purple)
- Title + 2-3 line description
- "Learn More" link in primary color
- Grid: 3 columns desktop, 2 tablet, 1 mobile

**Pricing Cards:**
- Tiered cards with middle plan elevated (scale-105 shadow-2xl)
- Price display: Large numerals with period annotation
- Feature checklist: checkmark icons in success green
- CTA button fills card width at bottom
- Badge for "Most Popular" plan

**Testimonial Section:**
- 2-column masonry grid on desktop
- Cards include: parent/educator photo (circular), quote, name/role
- Subtle card background with border-l-4 in primary color

**Gallery/Showcase:**
- 3-4 column masonry grid displaying book cover mockups
- Cards: book cover image + title overlay on hover
- Lightbox interaction for full preview

**Footer:**
- 4-column grid: Brand story, Product links, Resources, Contact
- Newsletter signup with inline form (input + button)
- Social icons in brand colors
- Trust badges: "Safe for Kids", "COPPA Compliant"

## Images

**Hero Image (Required):**
Whimsical AI-generated children's book illustration showing diverse children characters in a magical forest setting with vibrant colors, placed right side of hero section, 600x800px minimum

**Feature Section Icons:**
Use illustrated spot graphics (not photos): AI wand creating book, parent-child reading together, finished book showcase - place above each feature card title

**Gallery Section:**
6-8 book cover mockups showing variety of illustration styles (watercolor, digital, hand-drawn) - arrange in masonry grid

**Testimonial Photos:**
Circular parent/educator headshots (120x120px) - place top-left of each testimonial card

**Trust Section:**
Logos/badges for educational endorsements, safety certifications - horizontal row above footer

## Animations

**Minimal, Purposeful Motion:**
- Fade-up on scroll for cards (stagger 100ms)
- Gentle hover lift for cards (translate-y-1)
- Button hover: slight scale (scale-105)
- NO complex parallax or scroll-triggered animations