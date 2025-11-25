# Overview
LittleRoot is a children's book creation application that allows users to generate illustrated storybooks using AI. The application provides a complete workflow from story input to final book generation, including automatic text splitting into pages and AI-generated illustrations. Users can customize art styles, upload character reference images, and preview their completed books in an interactive format.

The app features a comprehensive tiered subscription system:
- **Free 7-Day Trial**: 1 book (24 illustrations), 0 template books, 2 bonus illustration variations
- **Hobbyist ($19.99/month)**: 6 books (144 illustrations), 3 template books, 10 bonus variations, full commercial rights for personal publishing
- **Pro ($39.99/month)**: 15 books (360 illustrations), 15 template books, 25 bonus variations, all formatting options, full commercial rights for publishing & selling
- **Reseller ($74.99/month)**: 25 books (600 illustrations), 30 template books, 75 bonus variations, all formatting options, full commercial rights + resell rights

Each subscription tier includes: up to 24 pages per book, all art styles, character consistency, standard formatting (Pro/Reseller get all formatting options), and PDF export.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **File Uploads**: Uppy with dashboard interface

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Build System**: esbuild for production, tsx for development
- **Storage Pattern**: Interface-based storage abstraction (IStorage)
- **File Handling**: Multer for multipart form data
- **Development**: Integrated Vite development server with HMR

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema Structure**: `stories` table (metadata, status) and `pages` table (content, foreign key to stories)
- **Relationships**: One-to-many between stories and pages with cascade deletion

## AI Integration
- **Service**: Google Gemini AI for text processing and image generation (Gemini 2.0 Flash Experimental for illustrations)
- **Character Consistency**: Support for reference images
- **Prompt Engineering**: Automated generation of child-friendly illustration prompts
- **Format Awareness**: AI receives exact PDF format in prompts (e.g., "8" × 10" portrait") and guidance for orientation-specific composition. Images are generated at precise PDF format dimensions (e.g., 6x9 = 1800x2700px at 300 DPI) to eliminate resizing artifacts.

## File Storage Architecture
- **Provider**: Google Cloud Storage
- **Authentication**: External account credentials with Replit sidecar endpoint
- **Access Control**: Custom ACL system
- **Upload Strategy**: Presigned URL pattern for direct client-to-storage uploads

## PDF Generation
- **Professional PDF Generation**: ReportLab library for print-ready PDFs
- **Full-Bleed Images**: Images fill entire page with no white margins
- **Consistent Formatting**: Center-cropped images for perfect alignment across 10 supported formats
- **PDF Pre-generation**: PDFs are automatically generated server-side after story completion and uploaded to cloud storage for instant downloads.

## Authentication & User Management
- **Dual Authentication**: Replit Auth (OIDC) and Local Email/Password (bcrypt hashing)
- **Session Structure**: Handles both Replit OAuth and local auth user claims
- **User Schema**: `passwordHash` field in users table (null for Replit Auth)
- **Security**: Session-based authentication with `express-session`, no passwords in `localStorage`.

## Quota Tracking System
- **Dynamic Tracking**: Template book and bonus variation usage tracked atomically in real-time
- **Race Condition Prevention**: Uses atomic database operations with COALESCE
- **User Feedback**: Clear messages for quota limits and upgrade guidance.

## Recurring Payment System
- **Automatic Billing**: Stripe automatically charges customers when `currentPeriodEnd` is reached
- **Webhook Integration**: `invoice.payment_succeeded` event resets monthly usage and updates billing period
- **Payment Tracking**: `lastPaymentDate` field tracks when each payment is received
- **Grace Period**: Users retain access until `currentPeriodEnd` even if payment status is `past_due`
- **Period Enforcement**: Access blocked when `currentPeriodEnd` has passed AND status is not active

## Text Management & Overlays
- **Live Text Regeneration**: Uses current text from the textarea, with `pageTexts` state for live edits.
- **Text Overlays**: Regenerated images include text overlays with semi-transparent black background (35% opacity), increased padding, and blur filter for readability.
- **Explicit Save**: Manual save button for text changes.

# External Dependencies

## AI Services
- **Google Gemini AI**: `@google/genai`

## Cloud Storage
- **Google Cloud Storage**: `@google-cloud/storage`

## Database
- **Neon Database (PostgreSQL)**: `@neondatabase/serverless`
- **Drizzle ORM**: For schema migrations and database interactions

## UI Libraries
- **Radix UI**: Unstyled, accessible UI primitives
- **Uppy**: File upload handling
- **React Query**: Server state management

## PDF Generation
- **ReportLab**: Python library for professional PDF creation

## Development Tools
- **Vite**: Build tool
- **Replit Plugins**: Development banner, cartographer, and runtime error overlay
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

## Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation
- **Drizzle Zod**: Integration with Drizzle schemas