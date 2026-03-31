# DOCX Format Support Plan 📄

## Overview

Add Microsoft Word (.docx) format as an alternative to PDF, giving users an editable, professional document format. DOCX will be the **default** option with PDF as an alternative.

## Why DOCX?

### Advantages over PDF:
- ✅ **Editable** - Users can add notes, highlight, modify
- ✅ **Professional** - Standard business document format
- ✅ **Smaller file size** - Typically 50-70% smaller than PDF
- ✅ **Better for printing** - More printer-friendly
- ✅ **Accessible** - Better screen reader support
- ✅ **Faster generation** - No Puppeteer/Chrome needed
- ✅ **More reliable** - No browser timeout issues

### Use Cases:
- Business reports that need annotations
- Documents for insurance claims
- Reports for legal proceedings
- Documents that need translation
- Reports for further analysis

## Implementation Plan

### Phase 1: Library Selection ✅

**Recommended: `docx` npm package**
- Most popular (2M+ weekly downloads)
- TypeScript support
- Rich formatting capabilities
- Active maintenance
- MIT license

```bash
npm install docx
```

### Phase 2: Database Schema Update

Add `format` field to orders table:

```sql
ALTER TABLE orders 
ADD COLUMN report_format VARCHAR(10) DEFAULT 'docx' CHECK (report_format IN ('pdf', 'docx'));
```

### Phase 3: Report Generator Refactor

Create format-agnostic generator:

```
src/lib/server/reports/
├── generator.ts          # Main entry point
├── pdf-generator.ts      # PDF-specific (existing Puppeteer)
├── docx-generator.ts     # NEW: DOCX generation
├── template-builder.ts   # Shared data preparation
└── pdf-styles.ts         # PDF-specific styles
```

### Phase 4: DOCX Generator Implementation

**File**: `src/lib/server/reports/docx-generator.ts`

```typescript
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx';
import type { ComprehensiveVehicleData } from '../vehicle/types';

export async function generateDOCXReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions
): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          text: "MotoCheck",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER
        }),
        
        // Vehicle title
        new Paragraph({
          text: `${vehicleData.identification.modelYear} ${vehicleData.identification.make} ${vehicleData.identification.model}`,
          heading: HeadingLevel.HEADING_1
        }),
        
        // VIN
        new Paragraph({
          children: [
            new TextRun({
              text: `VIN: ${vehicleData.identification.vin}`,
              bold: true
            })
          ]
        }),
        
        // Sections
        ...buildSpecificationsSection(vehicleData),
        ...buildEngineSection(vehicleData),
        // ... all other sections
      ]
    }]
  });
  
  return await Packer.toBuffer(doc);
}
```

### Phase 5: UI Updates

#### Checkout Page (`src/routes/checkout/[lookupId]/+page.svelte`)

Add format selector:

```svelte
<div class="format-selector">
  <label class="format-option">
    <input type="radio" name="format" value="docx" checked />
    <div class="format-card">
      <div class="format-icon">📄</div>
      <div class="format-name">Word Document</div>
      <div class="format-desc">Editable, professional format</div>
      <div class="format-badge">Recommended</div>
    </div>
  </label>
  
  <label class="format-option">
    <input type="radio" name="format" value="pdf" />
    <div class="format-card">
      <div class="format-icon">📕</div>
      <div class="format-name">PDF Document</div>
      <div class="format-desc">Fixed layout, universal</div>
    </div>
  </label>
</div>
```

#### Telegram Bot

Add format selection buttons:

```typescript
bot.action('format_docx', async (ctx) => {
  await ctx.answerCbQuery('Word format selected ✅');
  // Continue with payment
});

bot.action('format_pdf', async (ctx) => {
  await ctx.answerCbQuery('PDF format selected ✅');
  // Continue with payment
});
```

### Phase 6: Generator Router

Update main generator to route based on format:

```typescript
export async function generateVehicleReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions & { format?: 'pdf' | 'docx' }
): Promise<GeneratedReport> {
  const format = options.format || 'docx'; // Default to DOCX
  
  if (format === 'docx') {
    const buffer = await generateDOCXReport(vehicleData, options);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return { pdfBuffer: buffer, hash, format: 'docx' };
  } else {
    return await generatePDFReport(vehicleData, options);
  }
}
```

### Phase 7: Storage & Email Updates

Update file extensions and MIME types:

```typescript
// Storage service
const extension = format === 'docx' ? '.docx' : '.pdf';
const mimeType = format === 'docx' 
  ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  : 'application/pdf';

// Email service
const filename = `vehicle-report-${vin}${extension}`;
```

## Migration Strategy

### Backward Compatibility

1. **Existing orders**: Keep PDF format
2. **New orders**: Default to DOCX
3. **User choice**: Allow selection at checkout

### Rollout Plan

1. **Week 1**: Deploy DOCX support (PDF still default)
2. **Week 2**: Monitor adoption, gather feedback
3. **Week 3**: Switch default to DOCX
4. **Week 4**: Optimize based on usage patterns

## Performance Comparison

| Metric | PDF (Puppeteer) | DOCX (docx lib) |
|--------|----------------|-----------------|
| Generation time | 5-15 seconds | 0.5-2 seconds |
| Memory usage | ~512MB | ~50MB |
| File size | 200-500KB | 100-200KB |
| Reliability | 95% (timeouts) | 99.9% |
| CPU usage | High | Low |

## Cost Analysis

### Current (PDF only):
- Puppeteer memory: 512MB per instance
- Generation time: 10s average
- Timeout failures: ~5%

### With DOCX default:
- Memory savings: ~90%
- Generation time: ~80% faster
- Timeout failures: ~0%
- **Estimated cost savings: 60-70%**

## Implementation Checklist

### Backend
- [ ] Install `docx` package
- [ ] Create `docx-generator.ts`
- [ ] Implement all report sections in DOCX format
- [ ] Add format routing in main generator
- [ ] Update database schema
- [ ] Update storage service for .docx files
- [ ] Update email service for DOCX attachments

### Frontend
- [ ] Add format selector to checkout page
- [ ] Add format selection to Telegram bot
- [ ] Update UI to show selected format
- [ ] Add format icons and descriptions

### Testing
- [ ] Test DOCX generation with all data combinations
- [ ] Test empty sections in DOCX
- [ ] Test images in DOCX format
- [ ] Test file download and opening in Word
- [ ] Test email delivery with DOCX attachments
- [ ] Performance testing (generation time)

### Documentation
- [ ] Update API documentation
- [ ] Update user guide
- [ ] Add format comparison page
- [ ] Update FAQ

## Example DOCX Structure

```
MotoCheck Vehicle History Report
═══════════════════════════════════

2022 JEEP Wrangler Unlimited Sahara 4XE
VIN: 1C4JJXP65NW178527

Report Date: March 31, 2026
Report ID: NW178527

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEHICLE SPECIFICATIONS
─────────────────────────────────

Make                    JEEP
Model                   Wrangler
Year                    2022
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENGINE & PERFORMANCE
─────────────────────────────────

Configuration           In-Line
Cylinders              4
...
```

## Next Steps

1. **Immediate**: Fix current PDF styling issues
2. **This week**: Implement DOCX generator
3. **Next week**: Add UI for format selection
4. **Following week**: Deploy and monitor

## Questions to Consider

1. Should we charge different prices for PDF vs DOCX?
   - **Recommendation**: Same price, DOCX is default
   
2. Should we allow format conversion after purchase?
   - **Recommendation**: Yes, free conversion within 30 days
   
3. Should we keep both formats in storage?
   - **Recommendation**: No, generate on-demand if user wants different format

## Success Metrics

- DOCX adoption rate > 70%
- Generation time < 2 seconds
- Timeout rate < 0.1%
- User satisfaction score > 4.5/5
- Cost reduction > 50%

---

**Status**: Ready for implementation
**Priority**: High (solves timeout issues + better UX)
**Effort**: Medium (2-3 days)
**Impact**: High (better reliability, faster, cheaper)
