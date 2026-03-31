# Implementation Plan: DOCX Report Format

## Overview

This implementation plan breaks down the DOCX report format feature into actionable coding tasks. The feature adds Microsoft Word (.docx) format support to the vehicle report generation system, providing users with editable, professional reports as an alternative to PDF. DOCX will become the default format due to superior performance: 80% faster generation, 90% memory savings, 99.9% reliability, and 50-70% smaller file sizes.

## Tasks

- [x] 1. Install dependencies and setup
  - Install docx npm package as production dependency
  - Install @types/docx for TypeScript support
  - Verify package imports work correctly
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Database schema migration
  - [x] 2.1 Create migration file for orders table
    - Add report_format column (VARCHAR(10), default 'docx')
    - Add CHECK constraint for 'pdf' or 'docx' values only
    - Add index on report_format column
    - Update existing orders to 'pdf' for backward compatibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.2 Create migration file for reports table
    - Rename pdf_hash column to document_hash
    - Add format column (VARCHAR(10), default 'pdf')
    - Add CHECK constraint for format column
    - Update existing reports to format='pdf'
    - _Requirements: 2.1_
  
  - [x] 2.3 Update TypeScript types
    - Update Order interface with reportFormat field
    - Update Report interface with format field and renamed documentHash
    - Update ReportGenerationOptions interface with format parameter
    - Update GeneratedReport interface with format, fileSize, and generationTime fields
    - _Requirements: 2.5, 5.5_

- [x] 3. Create DOCX styling configuration
  - Create src/lib/server/reports/docx-styles.ts
  - Define DOCXStyleConfig interface with fonts, colors, and spacing
  - Export style constants for headings, tables, and text
  - Define page layout settings (A4, 1-inch margins)
  - _Requirements: 12.3, 12.4, 12.9_

- [x] 4. Implement DOCX generator core module
  - [x] 4.1 Create DOCX generator file structure
    - Create src/lib/server/reports/docx-generator.ts
    - Import docx library components (Document, Paragraph, Table, etc.)
    - Define generateDOCXReport function signature
    - Implement basic document structure with header and footer
    - _Requirements: 3.1, 3.2, 3.3, 12.7, 12.8_
  
  - [x] 4.2 Implement DOCX utility functions
    - Create buildDOCXSection function for section structure
    - Create createDOCXTable function with borders and alternating rows
    - Create buildEmptySectionDOCX function for missing data
    - Implement safe section rendering with error boundaries
    - _Requirements: 12.2, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 18.3_
  
  - [ ]* 4.3 Write property test for DOCX utility functions
    - **Property 13: Document Structure Consistency**
    - **Validates: Requirements 12.1, 12.7, 12.8**
  
  - [ ]* 4.4 Write property test for table formatting
    - **Property 14: Table Formatting Consistency**
    - **Validates: Requirements 12.2, 12.5, 12.6**
  
  - [ ]* 4.5 Write property test for empty section handling
    - **Property 15: Empty Section Handling**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

- [x] 5. Implement DOCX section builders (21 sections)
  - [x] 5.1 Implement vehicle identification and specifications sections
    - Build Vehicle Specifications section with table rendering
    - Build Engine & Performance section
    - Build Transmission & Drivetrain section
    - Build Dimensions & Capacity section
    - Build Safety Features section
    - Build Manufacturing Information section
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [x] 5.2 Implement history sections
    - Build Ownership History section with owner table
    - Build Sale History section with sales table
    - Build Odometer History section with rollback warnings
    - Build Title History section
    - Build Inspection History section (emissions and safety)
    - _Requirements: 10.9, 10.10, 10.11, 10.12, 10.13_
  
  - [x] 5.3 Implement risk and incident sections
    - Build Safety Recalls section with recall details
    - Build Insurance History section
    - Build Junk & Salvage Information section with warnings
    - Build Accident History section with damage details
    - Build Lien & Impound Records section
    - Build Theft History section with stolen vehicle warnings
    - Build Title Brands section with warning badges
    - _Requirements: 10.8, 10.14, 10.15, 10.16, 10.17, 10.18, 10.19_
  
  - [x] 5.4 Implement valuation and warranty sections
    - Build Market Value section
    - Build Warranty Information section (manufacturer and extended)
    - _Requirements: 10.20, 10.21_
  
  - [x] 5.5 Implement conditional sections
    - Build NCS Valuation section (conditional on includeNCSValuation)
    - Build Nigerian Import Duty Breakdown section (conditional on includeDutyBreakdown)
    - Format currency values with thousand separators
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_
  
  - [ ]* 5.6 Write property test for comprehensive section rendering
    - **Property 8: Comprehensive Section Rendering**
    - **Validates: Requirements 10.1-10.21**
  
  - [ ]* 5.7 Write property test for conditional sections
    - **Property 17: Conditional Section Inclusion**
    - **Validates: Requirements 14.1-14.6**
  
  - [ ]* 5.8 Write property test for duty breakdown
    - **Property 18: Duty Breakdown Completeness**
    - **Validates: Requirements 15.1-15.10**

- [x] 6. Implement image embedding for DOCX
  - [x] 6.1 Create image embedding function
    - Implement embedImageSafely function with timeout (5 seconds)
    - Fetch images from URLs and convert to Buffer
    - Resize images to max width 6 inches (576 pixels)
    - Maintain aspect ratio during resize
    - Handle fetch failures gracefully (return null, continue generation)
    - _Requirements: 11.2, 11.3, 11.4, 11.5_
  
  - [x] 6.2 Build vehicle images section
    - Limit to first 4 images
    - Embed images in document with proper alignment
    - Add image metadata captions (source, match type, date)
    - Handle empty images array with placeholder
    - _Requirements: 11.1, 11.6, 11.7_
  
  - [ ]* 6.3 Write property test for image count limiting
    - **Property 9: Image Count Limiting**
    - **Validates: Requirements 11.1**
  
  - [ ]* 6.4 Write property test for image dimensions
    - **Property 10: Image Dimension Constraints**
    - **Validates: Requirements 11.3, 11.4**
  
  - [ ]* 6.5 Write property test for image failure resilience
    - **Property 11: Image Failure Resilience**
    - **Validates: Requirements 11.5**
  
  - [ ]* 6.6 Write property test for image metadata
    - **Property 12: Image Metadata Inclusion**
    - **Validates: Requirements 11.6**

- [ ] 7. Refactor PDF generator
  - [x] 7.1 Create pdf-generator.ts module
    - Create src/lib/server/reports/pdf-generator.ts
    - Move existing PDF generation logic from generator.ts
    - Export generatePDFReport function with same signature as DOCX generator
    - Maintain all Puppeteer-specific logic
    - Return { pdfBuffer, hash } object
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Write property test for PDF output stability
    - **Property 21: PDF Output Stability**
    - **Validates: Requirements 17.3**

- [x] 8. Implement format routing
  - [x] 8.1 Create format router in generator.ts
    - Refactor generator.ts to be format router
    - Accept format parameter ('pdf' | 'docx', default 'docx')
    - Route to generateDOCXReport when format is 'docx'
    - Route to generatePDFReport when format is 'pdf'
    - Return unified GeneratedReport interface with buffer, hash, format, fileSize, generationTime
    - Add error handling with format context in error messages
    - Log generation metrics (duration, file size)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 3.5, 18.4, 18.5_
  
  - [x] 8.2 Implement legacy order format detection
    - Create determineReportFormat function
    - Check order.reportFormat field
    - Default to 'pdf' for orders created before DOCX launch date
    - Default to 'docx' for new orders without explicit format
    - _Requirements: 17.2, 17.4_
  
  - [ ]* 8.3 Write property test for format routing
    - **Property 1: Format Routing Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
  
  - [ ]* 8.4 Write property test for default format
    - **Property 2: Default Format Selection**
    - **Validates: Requirements 5.4**
  
  - [ ]* 8.5 Write property test for legacy order detection
    - **Property 20: Legacy Order Format Detection**
    - **Validates: Requirements 17.2**

- [x] 9. Checkpoint - Ensure core generation works
  - Test DOCX generation with sample vehicle data
  - Test PDF generation still works (backward compatibility)
  - Test format routing with both formats
  - Verify generated DOCX files open in Microsoft Word
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Update storage service for format handling
  - [ ] 10.1 Extend uploadReport function
    - Accept format parameter ('pdf' | 'docx')
    - Use .docx extension for DOCX files
    - Use .pdf extension for PDF files
    - Set MIME type to 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' for DOCX
    - Set MIME type to 'application/pdf' for PDF
    - Add format metadata to S3 object
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 10.2 Extend getReport function
    - Detect format from r2Key extension or metadata
    - Return format and mimeType along with buffer
    - _Requirements: 8.6_
  
  - [ ]* 10.3 Write property test for storage format consistency
    - **Property 5: Storage Format Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [ ]* 10.4 Write property test for storage retrieval
    - **Property 6: Storage Retrieval Round-Trip**
    - **Validates: Requirements 8.6**

- [ ] 11. Update email service for format handling
  - [ ] 11.1 Extend sendReport function
    - Accept format parameter ('pdf' | 'docx')
    - Set email subject with format indicator (📄 for DOCX, 📕 for PDF)
    - Include format name in email body
    - Add format-specific tips for DOCX (editable, can annotate)
    - Log format and file size when sending
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 11.2 Write property test for email format consistency
    - **Property 7: Email Format Consistency**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 12. Implement checkout UI format selection
  - [ ] 12.1 Add format selector to checkout page
    - Create format selector component in src/routes/checkout/[lookupId]/+page.svelte
    - Add radio buttons for DOCX and PDF options
    - Pre-select DOCX option by default
    - Add "Recommended" badge to DOCX option
    - Display format icons (📄 for DOCX, 📕 for PDF)
    - Show format descriptions and features
    - Highlight selected option visually
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 12.2 Update checkout form submission
    - Include selected format in order data
    - Pass format to payment initiation
    - Store format in order record
    - _Requirements: 6.7_

- [ ] 13. Implement Telegram bot format selection
  - [ ] 13.1 Create format selection handler
    - Create src/telegram-bot/handlers/format-selection.ts
    - Implement showFormatSelection function with inline keyboard
    - Add "Word Document (DOCX) ✅" and "PDF Document" buttons
    - Display format descriptions and benefits
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 13.2 Implement format selection callbacks
    - Create handleDOCXSelection callback handler
    - Create handlePDFSelection callback handler
    - Store format preference in session
    - Acknowledge selection with callback query answer
    - Proceed to payment after format selection
    - _Requirements: 7.4, 7.5, 7.6_
  
  - [ ] 13.3 Integrate format selection into bot flow
    - Add format selection step before payment
    - Update bot index to register format handlers
    - Test format selection in Telegram

- [ ] 14. Checkpoint - Ensure UI and integrations work
  - Test checkout page format selection
  - Test Telegram bot format selection
  - Test end-to-end order flow with both formats
  - Verify storage and email services handle both formats
  - Ensure all tests pass, ask the user if questions arise

- [ ] 15. Implement error handling and logging
  - [ ] 15.1 Add generation-level error handling
    - Wrap generation calls in try-catch blocks
    - Log detailed error information with format context
    - Implement fallback to PDF if DOCX generation fails
    - Throw descriptive errors with format type
    - _Requirements: 5.6, 18.1_
  
  - [ ] 15.2 Add section-level error handling
    - Implement safeRenderSection wrapper for all sections
    - Log section rendering errors
    - Render error placeholder instead of failing entire document
    - Continue generation when individual sections fail
    - _Requirements: 18.2, 18.3_
  
  - [ ] 15.3 Add image embedding error handling
    - Implement timeout for image fetching (5 seconds)
    - Validate image size (max 5MB)
    - Log image embedding failures as warnings
    - Continue generation without failed images
    - _Requirements: 18.2_
  
  - [ ] 15.4 Add storage and email retry logic
    - Implement uploadWithRetry with exponential backoff (3 attempts)
    - Implement sendReportWithFallback for email delivery
    - Queue failed emails for retry
    - Log retry attempts and final outcomes
    - _Requirements: 18.6_
  
  - [ ]* 15.5 Write property test for error messages
    - **Property 24: Error Message Descriptiveness**
    - **Validates: Requirements 5.6, 18.1**
  
  - [ ]* 15.6 Write property test for graceful section failure
    - **Property 25: Graceful Section Failure**
    - **Validates: Requirements 18.2, 18.3**
  
  - [ ]* 15.7 Write property test for generation logging
    - **Property 26: Generation Logging Completeness**
    - **Validates: Requirements 18.4, 18.5, 18.6**

- [ ] 16. Implement DOCX validation and compatibility
  - [ ] 16.1 Add DOCX structure validation
    - Validate generated DOCX conforms to ECMA-376 standard
    - Check document structure before returning buffer
    - Log validation errors
    - _Requirements: 19.1, 19.6_
  
  - [ ] 16.2 Test cross-application compatibility
    - Test DOCX files open in Microsoft Word without errors
    - Test DOCX files open in Google Docs without errors
    - Test DOCX files open in LibreOffice Writer without errors
    - Document any compatibility issues
    - _Requirements: 19.2, 19.3, 19.4_
  
  - [ ]* 16.3 Write property test for DOCX validity
    - **Property 27: DOCX Validity**
    - **Validates: Requirements 19.1, 19.6**
  
  - [ ]* 16.4 Write property test for cross-application compatibility
    - **Property 28: Cross-Application Compatibility**
    - **Validates: Requirements 19.2, 19.3, 19.4**
  
  - [ ]* 16.5 Write property test for round-trip stability
    - **Property 29: DOCX Round-Trip Stability**
    - **Validates: Requirements 19.5**

- [ ] 17. Implement format conversion support
  - [ ] 17.1 Create format conversion function
    - Implement convertReportFormat function
    - Fetch original order data
    - Generate report in new format
    - Upload to storage with new format
    - Log conversion with both formats
    - Preserve original order.reportFormat value
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [ ] 17.2 Add conversion endpoint
    - Create API endpoint for format conversion requests
    - Validate order ownership
    - Call convertReportFormat function
    - Deliver new format via same method as original
    - _Requirements: 20.5_
  
  - [ ]* 17.3 Write property test for format conversion
    - **Property 30: Format Conversion Support**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

- [ ] 18. Implement performance optimizations
  - [ ] 18.1 Optimize image loading
    - Implement loadImagesInParallel with batch processing (4 concurrent)
    - Use Promise.allSettled for parallel image fetching
    - Implement image caching with 1-hour TTL
    - _Requirements: 16.1, 16.2_
  
  - [ ] 18.2 Optimize memory management
    - Implement incremental section building
    - Clear intermediate data between sections
    - Use streaming for large reports if needed
    - _Requirements: 16.2_
  
  - [ ] 18.3 Add performance monitoring
    - Record generation time, file size, memory usage
    - Log performance metrics for each generation
    - Alert on slow generation (>5s) or high memory (>200MB)
    - Track success rate by format
    - _Requirements: 16.1, 16.2, 16.3, 16.5_
  
  - [ ]* 18.4 Write property test for file size bounds
    - **Property 19: File Size Bounds**
    - **Validates: Requirements 16.4**

- [ ] 19. Write comprehensive unit tests
  - [ ]* 19.1 Write unit tests for format routing
    - Test routing to DOCX generator
    - Test routing to PDF generator
    - Test default format selection
    - Test legacy order handling
  
  - [ ]* 19.2 Write unit tests for DOCX sections
    - Test specifications section with full data
    - Test empty section rendering
    - Test recalls section with multiple recalls
    - Test NCS valuation conditional rendering
  
  - [ ]* 19.3 Write unit tests for image embedding
    - Test valid image embedding
    - Test image fetch timeout
    - Test oversized image rejection
    - Test invalid URL handling
  
  - [ ]* 19.4 Write unit tests for storage service
    - Test DOCX upload with correct extension
    - Test PDF upload with correct extension
    - Test MIME type setting for both formats
  
  - [ ]* 19.5 Write unit tests for email service
    - Test email with DOCX format indicator
    - Test format-specific tips in email body

- [ ] 20. Write property-based tests
  - [ ]* 20.1 Write property test for database format constraint
    - **Property 3: Database Format Constraint**
    - **Validates: Requirements 2.3**
  
  - [ ]* 20.2 Write property test for format persistence
    - **Property 4: Format Persistence Round-Trip**
    - **Validates: Requirements 2.5**
  
  - [ ]* 20.3 Write property test for null value handling
    - **Property 16: Null Value Handling**
    - **Validates: Requirements 13.5**
  
  - [ ]* 20.4 Write property test for format preservation
    - **Property 22: Format Preservation on Retrieval**
    - **Validates: Requirements 17.4**
  
  - [ ]* 20.5 Write property test for regeneration consistency
    - **Property 23: Regeneration Format Consistency**
    - **Validates: Requirements 17.5**

- [ ] 21. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Fix any failing tests
  - Verify test coverage is adequate
  - Ensure all tests pass, ask the user if questions arise

- [ ] 22. Create deployment artifacts
  - [ ] 22.1 Create database migration scripts
    - Create up migration SQL file
    - Create down migration (rollback) SQL file
    - Test migration on development database
    - Document migration steps
  
  - [ ] 22.2 Create feature flag configuration
    - Add DOCX_ENABLED environment variable
    - Add DOCX_DEFAULT environment variable
    - Implement feature flag checks in generator
    - Document feature flag usage
  
  - [ ] 22.3 Update deployment documentation
    - Document deployment steps
    - Document rollback procedure
    - Document monitoring and alerting setup
    - Create runbook for common issues

- [ ] 23. Deploy to staging environment
  - [ ] 23.1 Deploy database migration
    - Run migration on staging database
    - Verify schema changes
    - Test backward compatibility with existing data
  
  - [ ] 23.2 Deploy application code
    - Deploy backend changes
    - Deploy frontend changes
    - Enable DOCX feature flag
    - Verify deployment health
  
  - [ ] 23.3 Test in staging
    - Test DOCX generation end-to-end
    - Test PDF generation (backward compatibility)
    - Test checkout UI format selection
    - Test Telegram bot format selection
    - Test email delivery for both formats
    - Test storage and retrieval for both formats

- [ ] 24. Monitor and optimize in staging
  - Monitor generation performance metrics
  - Monitor error rates by format
  - Monitor memory and CPU usage
  - Identify and fix any performance bottlenecks
  - Verify success rate targets (>99.9% for DOCX)

- [ ] 25. Deploy to production
  - [ ] 25.1 Deploy database migration to production
    - Schedule maintenance window if needed
    - Run migration on production database
    - Verify schema changes
  
  - [ ] 25.2 Deploy application code to production
    - Deploy backend changes
    - Deploy frontend changes
    - Enable DOCX feature flag gradually (canary deployment)
    - Monitor error rates and performance
  
  - [ ] 25.3 Monitor production deployment
    - Monitor generation performance (target <2s for DOCX)
    - Monitor success rates (target >99.9% for DOCX)
    - Monitor user adoption (format selection distribution)
    - Monitor resource usage (memory, CPU, storage)
    - Set up alerts for anomalies

- [ ] 26. Final checkpoint - Verify production success
  - Verify DOCX generation meets performance targets
  - Verify success rate meets reliability targets
  - Verify user adoption is positive
  - Verify no regressions in PDF generation
  - Document lessons learned and optimization opportunities

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: foundation → core generation → integration → testing → deployment
- DOCX becomes the default format due to superior performance characteristics
- Full backward compatibility is maintained for existing PDF orders
- Feature flags enable safe rollout and rollback if needed
