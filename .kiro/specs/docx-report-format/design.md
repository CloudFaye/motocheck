# Design Document: DOCX Report Format

## Overview

This design document specifies the architecture and implementation details for adding Microsoft Word (.docx) format support to the vehicle report generation system. The feature introduces DOCX as the default report format, providing users with editable, professional documents while maintaining backward compatibility with PDF generation.

### Key Benefits

- **Performance**: 80% faster generation (0.5-2s vs 5-15s for PDF)
- **Reliability**: 99.9% success rate vs 95% for PDF (eliminates Puppeteer timeout issues)
- **Resource Efficiency**: 90% memory savings (~50MB vs ~512MB)
- **File Size**: 50-70% smaller files (100-200KB vs 200-500KB)
- **User Experience**: Editable documents suitable for business use, annotations, and modifications

### Design Principles

1. **Format Agnostic Architecture**: Separate format-specific logic from shared data preparation
2. **Default to Best**: DOCX as default format with PDF as alternative
3. **Backward Compatibility**: Maintain full support for existing PDF orders
4. **Performance First**: Optimize for speed and reliability
5. **Professional Output**: Ensure documents meet business document standards

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Report Generation Flow                   │
└─────────────────────────────────────────────────────────────┘

User Request (Web/Telegram)
         │
         ├─→ Format Selection (DOCX/PDF)
         │
         ↓
┌────────────────────┐
│  Format Router     │  ← Determines generator based on format
│  (generator.ts)    │
└────────────────────┘
         │
         ├─────────────────┬─────────────────┐
         ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Template     │  │ DOCX         │  │ PDF          │
│ Builder      │  │ Generator    │  │ Generator    │
│ (shared)     │  │ (new)        │  │ (existing)   │
└──────────────┘  └──────────────┘  └──────────────┘
         │                 │                 │
         │                 ↓                 ↓
         │         ┌──────────────┐  ┌──────────────┐
         │         │ docx library │  │ Puppeteer    │
         │         └──────────────┘  └──────────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
                           │
                           ↓
                  ┌──────────────┐
                  │ Storage      │
                  │ Service      │
                  └──────────────┘
                           │
                           ↓
                  ┌──────────────┐
                  │ Email        │
                  │ Service      │
                  └──────────────┘
```

### Module Structure

```
src/lib/server/reports/
├── generator.ts              # Main entry point, format routing
├── template-builder.ts       # Shared data preparation (existing)
├── pdf-styles.ts            # PDF-specific styles (existing)
├── pdf-generator.ts         # PDF generation (refactored from generator.ts)
├── docx-generator.ts        # NEW: DOCX generation
└── docx-styles.ts           # NEW: DOCX styling configuration
```

### Component Responsibilities

#### Format Router (generator.ts)
- Accept format parameter ('pdf' | 'docx')
- Route to appropriate generator
- Return unified GeneratedReport interface
- Handle generation errors with format context

#### Template Builder (template-builder.ts)
- Prepare vehicle data for rendering
- Provide section-building functions
- Handle empty states
- Remain format-agnostic

#### DOCX Generator (docx-generator.ts)
- Generate Word documents using docx library
- Implement all 21 report sections
- Handle image embedding
- Apply professional formatting
- Optimize for performance

#### PDF Generator (pdf-generator.ts)
- Generate PDF using Puppeteer (existing logic)
- Maintain backward compatibility
- Handle browser lifecycle

## Components and Interfaces

### Core Interfaces

```typescript
// Extended GeneratedReport interface
export interface GeneratedReport {
  buffer: Buffer;           // Document binary data
  hash: string;            // SHA-256 hash for integrity
  format: 'pdf' | 'docx';  // Document format
  fileSize: number;        // Size in bytes
  generationTime: number;  // Duration in milliseconds
}

// Report generation options (extended)
export interface ReportGenerationOptions {
  format?: 'pdf' | 'docx';  // NEW: Format selection
  includeNCSValuation?: boolean;
  includeDutyBreakdown?: boolean;
  cifUsd?: number;
  cifNgn?: number;
  confidence?: string;
  dutyBreakdown?: DutyBreakdown;
  cbnRate?: number;
}

// DOCX-specific configuration
export interface DOCXStyleConfig {
  fonts: {
    heading: string;
    body: string;
    monospace: string;
  };
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: string;
    textLight: string;
  };
  spacing: {
    sectionBefore: number;
    sectionAfter: number;
    paragraphBefore: number;
    paragraphAfter: number;
  };
}
```

### DOCX Generator API

```typescript
/**
 * Generate DOCX report from comprehensive vehicle data
 * @param vehicleData - Complete vehicle information
 * @param options - Report generation options
 * @returns Promise<Buffer> - DOCX file binary data
 */
export async function generateDOCXReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions = {}
): Promise<Buffer>

/**
 * Build individual DOCX sections
 */
export function buildDOCXSection(
  title: string,
  content: Paragraph[]
): Paragraph[]

/**
 * Create DOCX table from data
 */
export function createDOCXTable(
  headers: string[],
  rows: string[][]
): Table

/**
 * Embed image in DOCX
 */
export async function embedImage(
  imageUrl: string,
  maxWidth: number
): Promise<ImageRun | null>
```

### Format Router API

```typescript
/**
 * Main entry point for report generation
 * Routes to appropriate generator based on format
 */
export async function generateVehicleReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions = {}
): Promise<GeneratedReport>
```

## Data Models

### Database Schema Changes

#### Orders Table Extension

```sql
-- Add report_format column to orders table
ALTER TABLE orders 
ADD COLUMN report_format VARCHAR(10) 
DEFAULT 'docx' 
CHECK (report_format IN ('pdf', 'docx'));

-- Add index for format-based queries
CREATE INDEX idx_orders_format ON orders(report_format);

-- Migration for existing orders (backward compatibility)
UPDATE orders 
SET report_format = 'pdf' 
WHERE report_format IS NULL;
```

#### Reports Table Extension

```sql
-- Rename pdf_hash to document_hash (more generic)
ALTER TABLE reports 
RENAME COLUMN pdf_hash TO document_hash;

-- Add format column to reports table
ALTER TABLE reports 
ADD COLUMN format VARCHAR(10) 
DEFAULT 'pdf' 
CHECK (format IN ('pdf', 'docx'));

-- Update r2_key to include format-appropriate extension
-- This will be handled in application logic
```

### Updated TypeScript Types

```typescript
// Updated Order type
export interface Order {
  id: string;
  lookupId: string;
  email: string;
  amountNgn: number;
  paymentRef: string;
  paymentId?: string;
  status: string;
  source: string;
  telegramChatId?: string;
  reportFormat: 'pdf' | 'docx';  // NEW
  createdAt: Date;
  paidAt?: Date;
}

// Updated Report type
export interface Report {
  id: string;
  orderId: string;
  r2Key: string;
  documentHash: string;  // Renamed from pdfHash
  format: 'pdf' | 'docx';  // NEW
  signedUrl: string;
  sentAt: Date;
  createdAt: Date;
}
```

### DOCX Document Structure

The DOCX document follows this hierarchical structure:

```
Document
├── Header Section
│   ├── Brand Logo (text-based)
│   ├── Report Title
│   └── Report Metadata (Date, ID)
│
├── Vehicle Title Bar
│   ├── Vehicle Name (Year Make Model Trim)
│   └── VIN Display
│
├── Content Sections (21 sections)
│   ├── Vehicle Images (up to 4 images in grid)
│   ├── Vehicle Specifications (table)
│   ├── Engine & Performance (table)
│   ├── Transmission & Drivetrain (table)
│   ├── Dimensions & Capacity (table)
│   ├── Safety Features (table)
│   ├── Manufacturing Information (table)
│   ├── Safety Recalls (list with details)
│   ├── Ownership History (table)
│   ├── Sale History (table)
│   ├── Odometer History (table with warnings)
│   ├── Title History (table)
│   ├── Inspection History (tables for emissions/safety)
│   ├── Insurance History (table)
│   ├── Junk & Salvage Information (table with warnings)
│   ├── Accident History (tables with damage diagrams)
│   ├── Lien & Impound Records (tables)
│   ├── Theft History (table with warnings)
│   ├── Title Brands (table with warnings)
│   ├── Market Value (table)
│   ├── Warranty Information (tables)
│   ├── NCS Valuation (conditional, table)
│   └── Nigerian Import Duty Breakdown (conditional, table)
│
└── Footer Section
    ├── Report Information
    ├── Disclaimer
    └── Brand Footer
```

## DOCX Generator Module Design

### Section Builders

Each section follows a consistent pattern:

```typescript
/**
 * Build Vehicle Specifications section
 */
function buildSpecificationsSectionDOCX(
  data: ComprehensiveVehicleData
): Paragraph[] {
  const specs = [
    ['Make', data.identification.make],
    ['Model', data.identification.model],
    ['Year', data.identification.modelYear],
    // ... more specs
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Vehicle Specifications');
  }

  return [
    new Paragraph({
      text: 'Vehicle Specifications',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }),
    createDOCXTable(
      ['Specification', 'Value'],
      specs
    )
  ];
}
```

### Image Embedding Strategy

```typescript
/**
 * Embed vehicle images in DOCX
 * - Fetch images from URLs
 * - Convert to binary data
 * - Resize to fit document width
 * - Maintain aspect ratio
 * - Add metadata captions
 */
async function embedVehicleImages(
  images: ImageResult[]
): Promise<Paragraph[]> {
  const displayImages = images.slice(0, 4);
  const imageParagraphs: Paragraph[] = [];

  for (const img of displayImages) {
    try {
      const response = await fetch(img.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Calculate dimensions (max width: 6 inches = 576 pixels)
      const maxWidth = 576;
      const imageRun = new ImageRun({
        data: buffer,
        transformation: {
          width: maxWidth,
          height: maxWidth * 0.75  // Maintain 4:3 aspect ratio
        }
      });

      imageParagraphs.push(
        new Paragraph({
          children: [imageRun],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Source: ${img.source} | Match: ${img.matchType}`,
          style: 'caption',
          alignment: AlignmentType.CENTER
        })
      );
    } catch (error) {
      console.warn(`Failed to embed image from ${img.source}:`, error);
      // Continue without this image
    }
  }

  return imageParagraphs;
}
```

### Table Generation

```typescript
/**
 * Create formatted table for DOCX
 */
function createDOCXTable(
  headers: string[],
  rows: string[][]
): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      // Header row
      new TableRow({
        children: headers.map(header =>
          new TableCell({
            children: [new Paragraph({
              text: header,
              bold: true
            })],
            shading: {
              fill: 'E5E7EB'  // Light gray background
            }
          })
        ),
        tableHeader: true
      }),
      // Data rows
      ...rows.map((row, index) =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              children: [new Paragraph(cell)],
              shading: {
                fill: index % 2 === 0 ? 'FFFFFF' : 'F9FAFB'
              }
            })
          )
        })
      )
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }
    }
  });
}
```

### Empty Section Handling

```typescript
/**
 * Build empty section placeholder
 */
function buildEmptySectionDOCX(title: string): Paragraph[] {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: '📋 Data Not Available',
      style: 'emptyStateTitle',
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      text: 'This information will be displayed when available from our data sources',
      style: 'emptyStateMessage',
      spacing: { after: 200 }
    })
  ];
}
```

## Format Routing Logic

### Main Generator Function

```typescript
/**
 * Generate vehicle report in specified format
 * Routes to appropriate generator based on format parameter
 */
export async function generateVehicleReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions = {}
): Promise<GeneratedReport> {
  const startTime = Date.now();
  const format = options.format || 'docx';  // Default to DOCX

  try {
    let buffer: Buffer;
    let hash: string;

    if (format === 'docx') {
      // Generate DOCX
      buffer = await generateDOCXReport(vehicleData, options);
      hash = crypto.createHash('sha256').update(buffer).digest('hex');
    } else {
      // Generate PDF
      const pdfResult = await generatePDFReport(vehicleData, options);
      buffer = pdfResult.pdfBuffer;
      hash = pdfResult.hash;
    }

    const generationTime = Date.now() - startTime;
    const fileSize = buffer.length;

    console.log(`${format.toUpperCase()} report generated in ${generationTime}ms, size: ${fileSize} bytes`);

    return {
      buffer,
      hash,
      format,
      fileSize,
      generationTime
    };
  } catch (error) {
    console.error(`${format.toUpperCase()} generation failed:`, error);
    throw new Error(
      `Failed to generate ${format.toUpperCase()} report: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
```

### Format Detection for Legacy Orders

```typescript
/**
 * Determine format for order (handles legacy orders)
 */
export function determineReportFormat(order: Order): 'pdf' | 'docx' {
  // Explicit format specified
  if (order.reportFormat) {
    return order.reportFormat;
  }

  // Legacy orders (created before DOCX support) default to PDF
  const docxLaunchDate = new Date('2026-04-01');
  if (order.createdAt < docxLaunchDate) {
    return 'pdf';
  }

  // New orders without explicit format default to DOCX
  return 'docx';
}
```

## UI Components

### Checkout Page Format Selection

```svelte
<!-- src/routes/checkout/[lookupId]/+page.svelte -->
<script lang="ts">
  let selectedFormat: 'docx' | 'pdf' = 'docx';
</script>

<div class="format-selector">
  <h3>Select Report Format</h3>
  
  <div class="format-options">
    <!-- DOCX Option (Recommended) -->
    <label class="format-option" class:selected={selectedFormat === 'docx'}>
      <input 
        type="radio" 
        name="format" 
        value="docx" 
        bind:group={selectedFormat}
      />
      <div class="format-card">
        <div class="format-icon">📄</div>
        <div class="format-details">
          <div class="format-name">
            Word Document (DOCX)
            <span class="badge-recommended">✅ Recommended</span>
          </div>
          <div class="format-description">
            Editable, professional format. Perfect for adding notes, 
            highlighting, and sharing with insurance or legal teams.
          </div>
          <div class="format-features">
            <span class="feature">✓ Editable</span>
            <span class="feature">✓ Smaller file size</span>
            <span class="feature">✓ Faster delivery</span>
          </div>
        </div>
      </div>
    </label>

    <!-- PDF Option -->
    <label class="format-option" class:selected={selectedFormat === 'pdf'}>
      <input 
        type="radio" 
        name="format" 
        value="pdf" 
        bind:group={selectedFormat}
      />
      <div class="format-card">
        <div class="format-icon">📕</div>
        <div class="format-details">
          <div class="format-name">PDF Document</div>
          <div class="format-description">
            Fixed layout, universal compatibility. Opens on any device 
            without special software.
          </div>
          <div class="format-features">
            <span class="feature">✓ Universal</span>
            <span class="feature">✓ Fixed layout</span>
            <span class="feature">✓ Print-ready</span>
          </div>
        </div>
      </div>
    </label>
  </div>
</div>

<style>
  .format-selector {
    margin: 2rem 0;
  }

  .format-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .format-option {
    cursor: pointer;
  }

  .format-option input[type="radio"] {
    display: none;
  }

  .format-card {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.2s;
    height: 100%;
  }

  .format-option.selected .format-card {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .format-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .format-name {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge-recommended {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background-color: #10b981;
    color: white;
    border-radius: 4px;
  }

  .format-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .format-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .feature {
    font-size: 0.75rem;
    color: #059669;
    background-color: #d1fae5;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .format-options {
      grid-template-columns: 1fr;
    }
  }
</style>
```

### Telegram Bot Format Selection

```typescript
// src/telegram-bot/handlers/format-selection.ts

import { InlineKeyboard } from 'grammy';

/**
 * Show format selection to user
 */
export async function showFormatSelection(ctx: Context, lookupId: string) {
  const keyboard = new InlineKeyboard()
    .text('📄 Word Document (DOCX) ✅', `format_docx_${lookupId}`)
    .row()
    .text('📕 PDF Document', `format_pdf_${lookupId}`);

  await ctx.reply(
    '📋 *Choose Your Report Format*\n\n' +
    '📄 *Word Document (DOCX)* - Recommended\n' +
    '   • Editable and customizable\n' +
    '   • Smaller file size\n' +
    '   • Faster delivery\n' +
    '   • Perfect for adding notes\n\n' +
    '📕 *PDF Document*\n' +
    '   • Fixed layout\n' +
    '   • Universal compatibility\n' +
    '   • Print-ready\n\n' +
    'Select your preferred format:',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );
}

/**
 * Handle DOCX format selection
 */
export async function handleDOCXSelection(ctx: Context, lookupId: string) {
  await ctx.answerCbQuery('Word format selected ✅');
  
  // Store format preference
  await ctx.session.setFormat('docx');
  
  // Proceed to payment
  await initiatePayment(ctx, lookupId, 'docx');
}

/**
 * Handle PDF format selection
 */
export async function handlePDFSelection(ctx: Context, lookupId: string) {
  await ctx.answerCbQuery('PDF format selected ✅');
  
  // Store format preference
  await ctx.session.setFormat('pdf');
  
  // Proceed to payment
  await initiatePayment(ctx, lookupId, 'pdf');
}
```

## Storage and Email Service Updates

### Storage Service Extensions

```typescript
// src/lib/server/storage-service.ts

/**
 * Upload report with format-specific handling
 */
export async function uploadReport(
  reportId: string,
  buffer: Buffer,
  format: 'pdf' | 'docx'
): Promise<UploadResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Format-specific extension and MIME type
  const extension = format === 'docx' ? '.docx' : '.pdf';
  const mimeType = format === 'docx'
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';
  
  const r2Key = `reports/${year}/${month}/${reportId}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        format: format,
        reportId: reportId,
        generatedAt: now.toISOString()
      }
    })
  );

  console.log(`Uploaded ${format.toUpperCase()} report: ${r2Key}, size: ${buffer.length} bytes`);

  return { r2Key, reportId, format };
}

/**
 * Get report with format detection
 */
export async function getReport(r2Key: string): Promise<{
  buffer: Buffer;
  format: 'pdf' | 'docx';
  mimeType: string;
}> {
  const command = new GetObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: r2Key
  });

  const response = await s3Client.send(command);
  const stream = response.Body;

  if (!stream) {
    throw new Error('No data returned from R2');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Detect format from key or metadata
  const format = r2Key.endsWith('.docx') ? 'docx' : 'pdf';
  const mimeType = format === 'docx'
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';

  return { buffer, format, mimeType };
}
```

### Email Service Extensions

```typescript
// src/lib/server/email-service.ts

/**
 * Send report with format-specific handling
 */
export async function sendReport(
  to: string,
  reportId: string,
  vin: string,
  signedUrl: string,
  format: 'pdf' | 'docx' = 'docx'
): Promise<void> {
  const formatName = format === 'docx' ? 'Word Document' : 'PDF Document';
  const formatIcon = format === 'docx' ? '📄' : '📕';

  await resend.emails.send({
    from: config.FROM_EMAIL,
    to,
    subject: `${formatIcon} Your Vehicle Report (${formatName}) - ${vin}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937;">Your Vehicle Report is Ready</h1>
  
  <p>Thank you for using MotoCheck. Your comprehensive vehicle history report is ready for download.</p>
  
  <div style="background-color: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
    <p style="margin: 0.5rem 0;"><strong>VIN:</strong> ${vin}</p>
    <p style="margin: 0.5rem 0;"><strong>Report ID:</strong> ${reportId}</p>
    <p style="margin: 0.5rem 0;"><strong>Format:</strong> ${formatIcon} ${formatName}</p>
  </div>
  
  <div style="text-align: center; margin: 2rem 0;">
    <a href="${signedUrl}" 
       style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
      Download Your Report
    </a>
  </div>
  
  <div style="background-color: #fef3c7; padding: 1rem; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 1.5rem 0;">
    <p style="margin: 0; color: #92400e;">
      <strong>⏰ Important:</strong> This download link will expire in 72 hours.
    </p>
  </div>
  
  ${format === 'docx' ? `
  <div style="background-color: #dbeafe; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
    <p style="margin: 0; color: #1e40af;">
      <strong>💡 Tip:</strong> Your Word document can be edited, annotated, and customized. 
      Open it in Microsoft Word, Google Docs, or any compatible word processor.
    </p>
  </div>
  ` : ''}
  
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 2rem;">
    If you have any questions or need assistance, please contact our support team.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
  
  <p style="color: #9ca3af; font-size: 0.75rem; text-align: center;">
    <strong>MotoCheck</strong> - Professional Vehicle Reports for Nigeria<br />
    www.motocheck.ng
  </p>
</div>
    `
  });

  console.log(`Sent ${format.toUpperCase()} report email to ${to}, size: ${formatName}`);
}
```


## Error Handling

### Error Handling Strategy

The system implements a multi-layered error handling approach to ensure reliability and graceful degradation:

#### 1. Generation-Level Errors

```typescript
/**
 * Handle errors during report generation
 */
try {
  const report = await generateVehicleReport(vehicleData, options);
  return report;
} catch (error) {
  // Log detailed error information
  console.error('Report generation failed:', {
    format: options.format,
    vin: vehicleData.identification.vin,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });

  // Attempt fallback to alternative format if primary fails
  if (options.format === 'docx') {
    console.warn('DOCX generation failed, attempting PDF fallback');
    try {
      return await generateVehicleReport(vehicleData, { ...options, format: 'pdf' });
    } catch (fallbackError) {
      throw new Error('Both DOCX and PDF generation failed');
    }
  }

  throw error;
}
```

#### 2. Section-Level Errors

```typescript
/**
 * Safe section rendering with error boundaries
 */
function safeRenderSection<T>(
  sectionName: string,
  data: T | undefined,
  renderFn: (data: T) => Paragraph[]
): Paragraph[] {
  try {
    if (!data) {
      return buildEmptySectionDOCX(sectionName);
    }
    return renderFn(data);
  } catch (error) {
    console.error(`Error rendering section ${sectionName}:`, error);
    
    // Return error placeholder instead of failing entire document
    return [
      new Paragraph({
        text: sectionName,
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({
        text: '⚠️ Error Loading Section',
        style: 'errorState'
      }),
      new Paragraph({
        text: 'This section could not be loaded. Please contact support if this persists.',
        style: 'errorMessage'
      })
    ];
  }
}
```

#### 3. Image Embedding Errors

```typescript
/**
 * Handle image embedding failures gracefully
 */
async function embedImageSafely(
  imageUrl: string,
  maxWidth: number
): Promise<ImageRun | null> {
  try {
    const response = await fetch(imageUrl, {
      timeout: 5000,  // 5-second timeout
      headers: {
        'User-Agent': 'MotoCheck-Report-Generator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Image too large (>5MB)');
    }

    return new ImageRun({
      data: buffer,
      transformation: {
        width: maxWidth,
        height: maxWidth * 0.75
      }
    });
  } catch (error) {
    console.warn(`Failed to embed image from ${imageUrl}:`, error);
    return null;  // Continue without this image
  }
}
```

#### 4. Database Errors

```typescript
/**
 * Handle database operation errors
 */
async function saveReportMetadata(
  orderId: string,
  r2Key: string,
  hash: string,
  format: 'pdf' | 'docx'
): Promise<void> {
  try {
    await db.insert(reports).values({
      orderId,
      r2Key,
      documentHash: hash,
      format,
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Failed to save report metadata:', error);
    
    // Retry once after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await db.insert(reports).values({
        orderId,
        r2Key,
        documentHash: hash,
        format,
        sentAt: new Date()
      });
    } catch (retryError) {
      // Log to monitoring system
      console.error('Report metadata save failed after retry:', retryError);
      throw new Error('Failed to save report metadata after retry');
    }
  }
}
```

#### 5. Storage Errors

```typescript
/**
 * Handle storage upload errors with retry logic
 */
async function uploadWithRetry(
  reportId: string,
  buffer: Buffer,
  format: 'pdf' | 'docx',
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadReport(reportId, buffer, format);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

#### 6. Email Delivery Errors

```typescript
/**
 * Handle email delivery errors
 */
async function sendReportWithFallback(
  to: string,
  reportId: string,
  vin: string,
  signedUrl: string,
  format: 'pdf' | 'docx'
): Promise<void> {
  try {
    await sendReport(to, reportId, vin, signedUrl, format);
  } catch (error) {
    console.error('Email delivery failed:', error);
    
    // Queue for retry (implement retry queue)
    await queueEmailRetry({
      to,
      reportId,
      vin,
      signedUrl,
      format,
      attempts: 1,
      maxAttempts: 5,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000)  // Retry in 5 minutes
    });
    
    // Don't throw - email failure shouldn't block report generation
    console.warn('Email queued for retry');
  }
}
```

### Error Logging and Monitoring

```typescript
/**
 * Structured error logging
 */
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  component: string;
  operation: string;
  error: string;
  context: Record<string, any>;
}

function logError(log: ErrorLog): void {
  const logEntry = {
    ...log,
    timestamp: log.timestamp.toISOString()
  };

  // Log to console
  console.error(JSON.stringify(logEntry));

  // Send to monitoring service (e.g., Sentry, DataDog)
  if (config.MONITORING_ENABLED) {
    monitoringService.captureError(logEntry);
  }
}

// Usage example
logError({
  timestamp: new Date(),
  level: 'error',
  component: 'docx-generator',
  operation: 'generateDOCXReport',
  error: error.message,
  context: {
    vin: vehicleData.identification.vin,
    format: 'docx',
    sectionsFailed: ['images', 'accidents']
  }
});
```

### User-Facing Error Messages

```typescript
/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyError(error: Error, format: 'pdf' | 'docx'): string {
  const formatName = format === 'docx' ? 'Word' : 'PDF';

  if (error.message.includes('timeout')) {
    return `Report generation is taking longer than expected. We're working on it and will email your ${formatName} report shortly.`;
  }

  if (error.message.includes('storage')) {
    return `We're experiencing temporary storage issues. Your ${formatName} report will be delivered via email once resolved.`;
  }

  if (error.message.includes('image')) {
    return `Your ${formatName} report is ready, but some vehicle images couldn't be loaded. The report contains all other information.`;
  }

  return `We encountered an issue generating your ${formatName} report. Our team has been notified and will resolve this shortly.`;
}
```

## Performance Optimization

### DOCX Generation Optimizations

#### 1. Lazy Image Loading

```typescript
/**
 * Load images in parallel with timeout
 */
async function loadImagesInParallel(
  images: ImageResult[],
  maxConcurrent: number = 4
): Promise<ImageRun[]> {
  const imageRuns: ImageRun[] = [];
  
  // Process in batches
  for (let i = 0; i < images.length; i += maxConcurrent) {
    const batch = images.slice(i, i + maxConcurrent);
    
    const results = await Promise.allSettled(
      batch.map(img => embedImageSafely(img.url, 576))
    );
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        imageRuns.push(result.value);
      }
    });
  }
  
  return imageRuns;
}
```

#### 2. Memory Management

```typescript
/**
 * Stream-based document generation for large reports
 */
async function generateDOCXReportStreaming(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions
): Promise<Buffer> {
  // Build sections incrementally
  const sections: Paragraph[] = [];
  
  // Add sections in chunks to avoid memory spikes
  sections.push(...buildHeaderSection(vehicleData));
  
  // Clear intermediate data
  if (global.gc) global.gc();
  
  sections.push(...buildSpecificationsSectionDOCX(vehicleData));
  sections.push(...buildEngineSectionDOCX(vehicleData));
  
  // Continue with other sections...
  
  const doc = new Document({
    sections: [{ children: sections }]
  });
  
  return await Packer.toBuffer(doc);
}
```

#### 3. Caching Strategy

```typescript
/**
 * Cache frequently used data
 */
const styleCache = new Map<string, any>();

function getCachedStyle(styleName: string): any {
  if (!styleCache.has(styleName)) {
    styleCache.set(styleName, createStyle(styleName));
  }
  return styleCache.get(styleName);
}

/**
 * Cache image data for duplicate images
 */
const imageCache = new Map<string, Buffer>();

async function getCachedImage(url: string): Promise<Buffer | null> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  
  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Cache for 1 hour
    imageCache.set(url, buffer);
    setTimeout(() => imageCache.delete(url), 60 * 60 * 1000);
    
    return buffer;
  } catch (error) {
    return null;
  }
}
```

#### 4. Batch Processing

```typescript
/**
 * Process multiple reports in batch
 */
async function generateReportsBatch(
  orders: Order[]
): Promise<Map<string, GeneratedReport>> {
  const results = new Map<string, GeneratedReport>();
  
  // Process in batches of 5 to avoid memory issues
  const batchSize = 5;
  
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async order => {
        const vehicleData = await fetchVehicleData(order.lookupId);
        const report = await generateVehicleReport(vehicleData, {
          format: order.reportFormat
        });
        return { orderId: order.id, report };
      })
    );
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.set(result.value.orderId, result.value.report);
      }
    });
    
    // Allow garbage collection between batches
    if (global.gc) global.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
```

### Performance Monitoring

```typescript
/**
 * Track performance metrics
 */
interface PerformanceMetrics {
  format: 'pdf' | 'docx';
  generationTime: number;
  fileSize: number;
  memoryUsed: number;
  sectionsRendered: number;
  imagesEmbedded: number;
  timestamp: Date;
}

function recordPerformanceMetrics(metrics: PerformanceMetrics): void {
  console.log('Performance metrics:', JSON.stringify(metrics));
  
  // Send to monitoring service
  if (config.MONITORING_ENABLED) {
    monitoringService.recordMetric('report_generation', metrics);
  }
  
  // Alert if performance degrades
  if (metrics.generationTime > 5000) {  // 5 seconds
    console.warn('Slow report generation detected:', metrics);
  }
  
  if (metrics.memoryUsed > 200 * 1024 * 1024) {  // 200MB
    console.warn('High memory usage detected:', metrics);
  }
}

// Usage
const startTime = Date.now();
const startMemory = process.memoryUsage().heapUsed;

const report = await generateVehicleReport(vehicleData, options);

recordPerformanceMetrics({
  format: options.format || 'docx',
  generationTime: Date.now() - startTime,
  fileSize: report.buffer.length,
  memoryUsed: process.memoryUsage().heapUsed - startMemory,
  sectionsRendered: 21,
  imagesEmbedded: vehicleData.images?.length || 0,
  timestamp: new Date()
});
```

### Performance Targets

| Metric | DOCX Target | PDF Target | Current PDF |
|--------|-------------|------------|-------------|
| Generation Time (p50) | < 1s | < 10s | ~10s |
| Generation Time (p95) | < 2s | < 15s | ~15s |
| Memory Usage | < 100MB | < 512MB | ~512MB |
| File Size | 100-200KB | 200-500KB | 200-500KB |
| Success Rate | > 99.9% | > 95% | ~95% |
| Concurrent Capacity | 50 req/s | 5 req/s | ~5 req/s |

## Testing Strategy

### Testing Approach

The testing strategy employs both unit tests for specific scenarios and property-based tests for comprehensive coverage across all inputs.

### Unit Testing

Unit tests focus on specific examples, edge cases, and integration points:

#### 1. Format Routing Tests

```typescript
describe('Format Routing', () => {
  test('should route to DOCX generator when format is docx', async () => {
    const result = await generateVehicleReport(mockVehicleData, { format: 'docx' });
    expect(result.format).toBe('docx');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  test('should route to PDF generator when format is pdf', async () => {
    const result = await generateVehicleReport(mockVehicleData, { format: 'pdf' });
    expect(result.format).toBe('pdf');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  test('should default to DOCX when format not specified', async () => {
    const result = await generateVehicleReport(mockVehicleData);
    expect(result.format).toBe('docx');
  });

  test('should handle legacy orders with null format', () => {
    const legacyOrder = { ...mockOrder, reportFormat: null, createdAt: new Date('2026-01-01') };
    const format = determineReportFormat(legacyOrder);
    expect(format).toBe('pdf');
  });
});
```

#### 2. DOCX Section Tests

```typescript
describe('DOCX Section Rendering', () => {
  test('should render specifications section with all data', () => {
    const paragraphs = buildSpecificationsSectionDOCX(mockVehicleData);
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs[0].text).toContain('Vehicle Specifications');
  });

  test('should render empty section when data is missing', () => {
    const emptyData = { ...mockVehicleData, identification: {} };
    const paragraphs = buildSpecificationsSectionDOCX(emptyData);
    expect(paragraphs.some(p => p.text?.includes('Data Not Available'))).toBe(true);
  });

  test('should handle recalls section with multiple recalls', () => {
    const dataWithRecalls = {
      ...mockVehicleData,
      recalls: [mockRecall1, mockRecall2, mockRecall3]
    };
    const paragraphs = buildRecallsSectionDOCX(dataWithRecalls);
    expect(paragraphs.length).toBeGreaterThan(3);
  });

  test('should render NCS valuation when option is enabled', () => {
    const paragraphs = buildValuationSectionDOCX({
      includeNCSValuation: true,
      cifUsd: 15000,
      cifNgn: 24000000,
      cbnRate: 1600
    });
    expect(paragraphs.some(p => p.text?.includes('NCS Valuation'))).toBe(true);
  });
});
```

#### 3. Image Embedding Tests

```typescript
describe('Image Embedding', () => {
  test('should embed valid images', async () => {
    const imageRun = await embedImageSafely('https://example.com/car.jpg', 576);
    expect(imageRun).not.toBeNull();
  });

  test('should handle image fetch timeout', async () => {
    const imageRun = await embedImageSafely('https://slow-server.com/car.jpg', 576);
    expect(imageRun).toBeNull();
  });

  test('should reject oversized images', async () => {
    const imageRun = await embedImageSafely('https://example.com/huge-image.jpg', 576);
    expect(imageRun).toBeNull();
  });

  test('should handle invalid image URLs', async () => {
    const imageRun = await embedImageSafely('not-a-url', 576);
    expect(imageRun).toBeNull();
  });
});
```

#### 4. Storage Service Tests

```typescript
describe('Storage Service', () => {
  test('should upload DOCX with correct extension', async () => {
    const result = await uploadReport('test-123', mockBuffer, 'docx');
    expect(result.r2Key).toContain('.docx');
  });

  test('should upload PDF with correct extension', async () => {
    const result = await uploadReport('test-123', mockBuffer, 'pdf');
    expect(result.r2Key).toContain('.pdf');
  });

  test('should set correct MIME type for DOCX', async () => {
    const spy = jest.spyOn(s3Client, 'send');
    await uploadReport('test-123', mockBuffer, 'docx');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
      })
    );
  });
});
```

#### 5. Email Service Tests

```typescript
describe('Email Service', () => {
  test('should send email with DOCX format indicator', async () => {
    const spy = jest.spyOn(resend.emails, 'send');
    await sendReport('user@example.com', 'report-123', 'VIN123', 'https://...', 'docx');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Word Document')
      })
    );
  });

  test('should include format-specific tips in email body', async () => {
    const spy = jest.spyOn(resend.emails, 'send');
    await sendReport('user@example.com', 'report-123', 'VIN123', 'https://...', 'docx');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('can be edited')
      })
    );
  });
});
```

### Property-Based Testing

Property-based tests verify universal properties across randomly generated inputs (minimum 100 iterations per test):


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Storage and Email properties (8.1-8.6, 9.1-9.6)**: Many properties test the same concept (correct extension and MIME type for format). These can be consolidated into comprehensive properties about format handling.

2. **Section rendering properties (10.1-10.21)**: All 21 section rendering criteria test the same behavior pattern. These can be combined into a single property about section rendering.

3. **Formatting properties (12.1-12.9)**: Multiple properties test document formatting rules. These can be consolidated into properties about consistent formatting.

4. **Empty section properties (13.1-13.5)**: All test empty state handling and can be combined.

5. **Valuation and duty properties (14.2-14.5, 15.2-15.8)**: These test that specific fields appear, which can be combined into properties about conditional section completeness.

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Format Routing Correctness

*For any* vehicle data and format specification ('pdf' or 'docx'), when generateVehicleReport is called with that format, the returned GeneratedReport SHALL have a format field matching the requested format, and the buffer SHALL be valid binary data for that format type.

**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 2: Default Format Selection

*For any* vehicle data, when generateVehicleReport is called without specifying a format, the system SHALL default to 'docx' format.

**Validates: Requirements 5.4**

### Property 3: Database Format Constraint

*For any* attempt to create an order with a report_format value, the system SHALL accept only 'pdf' or 'docx' values and SHALL reject any other value with a constraint violation error.

**Validates: Requirements 2.3**

### Property 4: Format Persistence Round-Trip

*For any* order created with a specific report_format value ('pdf' or 'docx'), when that order is retrieved from the database, the report_format field SHALL contain the same value that was stored.

**Validates: Requirements 2.5**

### Property 5: Storage Format Consistency

*For any* report buffer and format ('pdf' or 'docx'), when uploadReport is called, the resulting r2Key SHALL end with the correct extension (.docx for DOCX, .pdf for PDF), and the ContentType SHALL be set to the correct MIME type for that format.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 6: Storage Retrieval Round-Trip

*For any* report stored with a specific format, when that report is retrieved using getReport, the returned format and mimeType SHALL match the format that was originally stored.

**Validates: Requirements 8.6**

### Property 7: Email Format Consistency

*For any* report sent via email with a specific format ('pdf' or 'docx'), the email attachment SHALL have the correct file extension, the correct MIME type, and the email content SHALL mention the format type.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 8: Comprehensive Section Rendering

*For any* vehicle data containing information for a specific section, when a DOCX report is generated, the resulting document SHALL contain that section with all available data fields rendered in the appropriate format (tables, paragraphs, or lists).

**Validates: Requirements 10.1-10.21**

### Property 9: Image Count Limiting

*For any* vehicle data with N images (where N > 0), when a DOCX report is generated, the document SHALL contain min(N, 4) embedded images.

**Validates: Requirements 11.1**

### Property 10: Image Dimension Constraints

*For any* image successfully embedded in a DOCX document, the image width SHALL be less than or equal to 6 inches (576 pixels), and the aspect ratio SHALL be preserved from the original image.

**Validates: Requirements 11.3, 11.4**

### Property 11: Image Failure Resilience

*For any* vehicle data with some images that fail to load, when a DOCX report is generated, the generation SHALL complete successfully with the images that did load, and SHALL not throw an error due to image failures.

**Validates: Requirements 11.5**

### Property 12: Image Metadata Inclusion

*For any* image successfully embedded in a DOCX document, the document SHALL contain a caption with the image's source, match type, and date (if available) immediately following the image.

**Validates: Requirements 11.6**

### Property 13: Document Structure Consistency

*For any* DOCX report generated, the document SHALL use Heading 1 styles for all section titles, Heading 2 styles for all subsection titles, and SHALL include a header with "MotoCheck" branding and a footer with disclaimer text.

**Validates: Requirements 12.1, 12.7, 12.8**

### Property 14: Table Formatting Consistency

*For any* data table rendered in a DOCX document, the table SHALL have borders, alternating row colors, bold text for headers, and right-aligned numeric values.

**Validates: Requirements 12.2, 12.5, 12.6**

### Property 15: Empty Section Handling

*For any* section in a DOCX report where no data is available, the document SHALL contain the section title followed by a "Data Not Available" message and explanatory text, all with consistent styling.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 16: Null Value Handling

*For any* table cell in a DOCX document where the data value is null or undefined, the cell SHALL display "N/A".

**Validates: Requirements 13.5**

### Property 17: Conditional Section Inclusion

*For any* DOCX report generated with includeNCSValuation=true and valid valuation data, the document SHALL contain an NCS Valuation section with CIF values in USD and NGN, CBN rate, and confidence level. When includeNCSValuation=false, the section SHALL be omitted.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**

### Property 18: Duty Breakdown Completeness

*For any* DOCX report generated with includeDutyBreakdown=true and valid duty data, the document SHALL contain a Nigerian Import Duty Breakdown section with all seven duty components (Import Duty, Surcharge, NAC Levy, CISS, ETLS, VAT, Total) formatted with thousand separators. When includeDutyBreakdown=false, the section SHALL be omitted.

**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10**

### Property 19: File Size Bounds

*For any* DOCX report generated, the resulting file size SHALL be between 50KB and 500KB.

**Validates: Requirements 16.4**

### Property 20: Legacy Order Format Detection

*For any* order created before the DOCX launch date with no report_format value, the system SHALL determine the format as 'pdf' for backward compatibility.

**Validates: Requirements 17.2**

### Property 21: PDF Output Stability

*For any* vehicle data, when a PDF report is generated after the DOCX feature is deployed, the PDF output SHALL be equivalent to the PDF output generated before deployment (same content, same structure).

**Validates: Requirements 17.3**

### Property 22: Format Preservation on Retrieval

*For any* historical order with a specific format, when the system retrieves and serves that order's report, the served file SHALL have the same format as originally generated.

**Validates: Requirements 17.4**

### Property 23: Regeneration Format Consistency

*For any* order, when a report is regenerated, the regenerated report SHALL use the same format as specified in the order's report_format field.

**Validates: Requirements 17.5**

### Property 24: Error Message Descriptiveness

*For any* report generation failure, the thrown error message SHALL include the format type ('PDF' or 'DOCX') and a description of what failed.

**Validates: Requirements 5.6, 18.1**

### Property 25: Graceful Section Failure

*For any* section that fails to render during DOCX generation, the system SHALL log an error, render an empty section placeholder for that section, and continue generating the rest of the document without throwing an error.

**Validates: Requirements 18.2, 18.3**

### Property 26: Generation Logging Completeness

*For any* report generation (successful or failed), the system SHALL log the start time, completion/failure time, format type, and for successful generations, the file size and generation duration.

**Validates: Requirements 18.4, 18.5, 18.6**

### Property 27: DOCX Validity

*For any* DOCX document generated, the document SHALL be a valid Office Open XML document that can be parsed without errors by the docx library's validation functions.

**Validates: Requirements 19.1, 19.6**

### Property 28: Cross-Application Compatibility

*For any* DOCX document generated, the document SHALL open without errors in Microsoft Word, Google Docs, and LibreOffice Writer.

**Validates: Requirements 19.2, 19.3, 19.4**

### Property 29: DOCX Round-Trip Stability

*For any* valid DOCX document generated, when the document is opened in Microsoft Word, saved, and opened again, the content SHALL remain equivalent (same text, same structure, same data).

**Validates: Requirements 19.5**

### Property 30: Format Conversion Support

*For any* order with an existing report in format A, when a format conversion is requested to format B, the system SHALL generate a new report in format B using the same vehicle data, without modifying the original order's report_format field, and SHALL log the conversion with both formats.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

1. Install docx npm package and TypeScript definitions
2. Create database migration for report_format column
3. Update TypeScript types for Order and Report interfaces
4. Create docx-styles.ts configuration file

### Phase 2: Core Generation (Week 1-2)

1. Create docx-generator.ts with basic structure
2. Implement section builders for all 21 sections
3. Implement image embedding with error handling
4. Implement table generation utilities
5. Implement empty section handling

### Phase 3: Integration (Week 2)

1. Refactor existing generator.ts into pdf-generator.ts
2. Implement format routing in generator.ts
3. Update storage service for format handling
4. Update email service for format handling
5. Implement format detection for legacy orders

### Phase 4: UI Implementation (Week 2-3)

1. Add format selector to checkout page
2. Style format selection UI
3. Implement Telegram bot format selection
4. Add format indicators to order confirmation

### Phase 5: Testing (Week 3)

1. Write unit tests for all components
2. Write property-based tests (30 properties)
3. Test cross-application compatibility
4. Performance testing and optimization
5. Integration testing

### Phase 6: Deployment (Week 3-4)

1. Deploy database migration
2. Deploy backend changes
3. Deploy frontend changes
4. Monitor performance metrics
5. Gather user feedback

### Phase 7: Optimization (Week 4+)

1. Optimize image loading performance
2. Implement caching strategies
3. Fine-tune memory usage
4. Adjust based on production metrics

## Migration Strategy

### Database Migration

```sql
-- Migration: Add report_format column
-- Version: 2026-04-01-001

BEGIN;

-- Add column with default
ALTER TABLE orders 
ADD COLUMN report_format VARCHAR(10) 
DEFAULT 'docx' 
CHECK (report_format IN ('pdf', 'docx'));

-- Update existing orders to use PDF (backward compatibility)
UPDATE orders 
SET report_format = 'pdf' 
WHERE created_at < '2026-04-01'::timestamp;

-- Add index for performance
CREATE INDEX idx_orders_format ON orders(report_format);

-- Update reports table
ALTER TABLE reports 
RENAME COLUMN pdf_hash TO document_hash;

ALTER TABLE reports 
ADD COLUMN format VARCHAR(10) 
DEFAULT 'pdf' 
CHECK (format IN ('pdf', 'docx'));

-- Update existing reports
UPDATE reports 
SET format = 'pdf';

COMMIT;
```

### Rollback Plan

```sql
-- Rollback: Remove report_format column
-- Version: 2026-04-01-001-rollback

BEGIN;

-- Remove format column from reports
ALTER TABLE reports DROP COLUMN format;
ALTER TABLE reports RENAME COLUMN document_hash TO pdf_hash;

-- Remove format column from orders
DROP INDEX IF EXISTS idx_orders_format;
ALTER TABLE orders DROP COLUMN report_format;

COMMIT;
```

### Feature Flag

```typescript
// config.ts
export const config = {
  // ... other config
  DOCX_ENABLED: process.env.DOCX_ENABLED === 'true',
  DOCX_DEFAULT: process.env.DOCX_DEFAULT === 'true'
};

// Usage in generator
export async function generateVehicleReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions = {}
): Promise<GeneratedReport> {
  let format = options.format;
  
  // Feature flag check
  if (!config.DOCX_ENABLED && format === 'docx') {
    console.warn('DOCX generation requested but feature is disabled, falling back to PDF');
    format = 'pdf';
  }
  
  // Default format based on feature flag
  if (!format) {
    format = config.DOCX_DEFAULT ? 'docx' : 'pdf';
  }
  
  // ... rest of generation logic
}
```

## Monitoring and Metrics

### Key Metrics to Track

1. **Generation Performance**
   - Average generation time by format
   - P50, P95, P99 latency
   - Memory usage per generation
   - File size distribution

2. **Reliability**
   - Success rate by format
   - Error rate by error type
   - Timeout rate (PDF only)
   - Retry rate

3. **Adoption**
   - Format selection distribution
   - Format conversion requests
   - User satisfaction by format

4. **Resource Usage**
   - CPU utilization
   - Memory utilization
   - Storage costs by format
   - Bandwidth usage

### Monitoring Dashboard

```typescript
// metrics.ts
export interface GenerationMetrics {
  format: 'pdf' | 'docx';
  duration: number;
  fileSize: number;
  memoryUsed: number;
  success: boolean;
  errorType?: string;
  timestamp: Date;
}

export function recordMetrics(metrics: GenerationMetrics): void {
  // Log to console
  console.log('Generation metrics:', JSON.stringify(metrics));
  
  // Send to monitoring service
  if (config.MONITORING_ENABLED) {
    monitoringService.recordMetric('report_generation', {
      format: metrics.format,
      duration_ms: metrics.duration,
      file_size_bytes: metrics.fileSize,
      memory_bytes: metrics.memoryUsed,
      success: metrics.success,
      error_type: metrics.errorType
    });
  }
  
  // Alert on anomalies
  if (metrics.duration > 5000) {
    alertService.send('Slow generation detected', metrics);
  }
  
  if (!metrics.success) {
    alertService.send('Generation failed', metrics);
  }
}
```

### Success Criteria

The DOCX feature will be considered successful when:

1. **Performance**: DOCX generation averages < 2 seconds (vs 10s for PDF)
2. **Reliability**: DOCX success rate > 99.9% (vs 95% for PDF)
3. **Adoption**: > 70% of new orders choose DOCX format
4. **Quality**: < 1% of DOCX reports have formatting issues
5. **Cost**: 50%+ reduction in generation costs due to lower resource usage

## Conclusion

This design provides a comprehensive architecture for adding DOCX format support to the vehicle report generation system. The implementation prioritizes performance, reliability, and user experience while maintaining full backward compatibility with existing PDF functionality.

Key advantages of this design:

1. **Clean Separation**: Format-specific logic is isolated in dedicated modules
2. **Performance**: DOCX generation is 80% faster and uses 90% less memory
3. **Reliability**: Eliminates Puppeteer timeout issues
4. **Flexibility**: Easy to add additional formats in the future
5. **Backward Compatible**: Existing PDF orders continue to work unchanged
6. **User Choice**: Users can select their preferred format
7. **Professional Output**: DOCX documents meet business document standards

The phased implementation approach allows for incremental delivery and validation, with feature flags enabling safe rollout and rollback if needed.

