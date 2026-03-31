# Requirements Document

## Introduction

This document specifies requirements for adding Microsoft Word (.docx) format support to the vehicle report generation system. The feature will provide users with editable, professional reports as an alternative to PDF format. DOCX will become the default format due to superior performance characteristics: 80% faster generation (0.5-2s vs 5-15s), 90% memory savings (~50MB vs ~512MB), 99.9% reliability (vs 95% with PDF timeouts), and 50-70% smaller file sizes.

## Glossary

- **Report_Generator**: The system component responsible for generating vehicle history reports
- **DOCX_Generator**: New module that creates Microsoft Word format documents using the docx npm library
- **PDF_Generator**: Existing module that creates PDF documents using Puppeteer
- **Format_Router**: Component that directs report generation to the appropriate generator based on user selection
- **Storage_Service**: System component that handles file storage and retrieval
- **Email_Service**: System component that sends reports to users via email
- **Checkout_UI**: User interface where customers select report options and complete payment
- **Telegram_Bot**: Conversational interface for ordering reports via Telegram
- **Orders_Table**: Database table storing order information including format preference
- **Report_Section**: A distinct content block in the report (e.g., specifications, recalls, ownership history)
- **Template_Builder**: Shared module that prepares vehicle data for rendering in any format
- **Comprehensive_Report**: Report containing 15+ sections including images, specifications, history, and optional valuation/duty data

## Requirements

### Requirement 1: DOCX Library Integration

**User Story:** As a developer, I want to integrate the docx npm package, so that the system can generate Microsoft Word documents programmatically.

#### Acceptance Criteria

1. THE System SHALL install the docx npm package as a production dependency
2. THE System SHALL install TypeScript type definitions for the docx package
3. WHEN the docx package is imported, THE System SHALL successfully load all required modules without errors
4. THE DOCX_Generator SHALL use the docx package API to create Document objects

### Requirement 2: Database Schema Extension

**User Story:** As a system administrator, I want to store user format preferences in the database, so that orders can be fulfilled with the correct document format.

#### Acceptance Criteria

1. THE Orders_Table SHALL include a report_format column with VARCHAR(10) data type
2. THE report_format column SHALL default to 'docx' for new orders
3. THE report_format column SHALL enforce a CHECK constraint allowing only 'pdf' or 'docx' values
4. WHEN an order is created without specifying format, THE System SHALL store 'docx' as the report_format value
5. WHEN an order is retrieved, THE System SHALL include the report_format value in the order data

### Requirement 3: DOCX Generator Module Creation

**User Story:** As a developer, I want a dedicated DOCX generation module, so that Word document creation is separated from PDF generation logic.

#### Acceptance Criteria

1. THE System SHALL create a docx-generator.ts file in the src/lib/server/reports directory
2. THE DOCX_Generator SHALL export a generateDOCXReport function accepting ComprehensiveVehicleData and ReportGenerationOptions
3. WHEN generateDOCXReport is called, THE DOCX_Generator SHALL return a Promise<Buffer> containing the Word document binary data
4. THE DOCX_Generator SHALL generate documents without requiring browser automation or Puppeteer
5. WHEN generation completes, THE DOCX_Generator SHALL log the generation duration in milliseconds

### Requirement 4: PDF Generator Refactoring

**User Story:** As a developer, I want the existing PDF generation code isolated in its own module, so that format-specific logic is cleanly separated.

#### Acceptance Criteria

1. THE System SHALL create a pdf-generator.ts file in the src/lib/server/reports directory
2. THE PDF_Generator SHALL export a generatePDFReport function with the same signature as generateDOCXReport
3. THE PDF_Generator SHALL contain all Puppeteer-specific logic previously in generator.ts
4. THE PDF_Generator SHALL maintain all existing PDF generation functionality without regression
5. WHEN generatePDFReport is called, THE PDF_Generator SHALL return a Promise containing pdfBuffer and hash

### Requirement 5: Format Routing Logic

**User Story:** As a system architect, I want a central router that directs to the appropriate generator, so that format selection is handled consistently.

#### Acceptance Criteria

1. THE Format_Router SHALL accept a format parameter with values 'pdf' or 'docx'
2. WHEN format is 'docx', THE Format_Router SHALL invoke the DOCX_Generator
3. WHEN format is 'pdf', THE Format_Router SHALL invoke the PDF_Generator
4. WHEN format is not specified, THE Format_Router SHALL default to 'docx'
5. THE Format_Router SHALL return a GeneratedReport object containing buffer, hash, and format fields
6. WHEN generation fails, THE Format_Router SHALL throw an error with a descriptive message including the format type

### Requirement 6: Checkout UI Format Selection

**User Story:** As a customer, I want to choose between DOCX and PDF formats at checkout, so that I receive my report in my preferred format.

#### Acceptance Criteria

1. THE Checkout_UI SHALL display a format selector with radio buttons for DOCX and PDF options
2. THE DOCX option SHALL be pre-selected by default
3. THE DOCX option SHALL display a "Recommended" badge
4. THE Checkout_UI SHALL show format icons (📄 for DOCX, 📕 for PDF)
5. THE Checkout_UI SHALL display format descriptions ("Editable, professional format" for DOCX, "Fixed layout, universal" for PDF)
6. WHEN a user selects a format, THE Checkout_UI SHALL visually highlight the selected option
7. WHEN the order is submitted, THE Checkout_UI SHALL include the selected format in the order data

### Requirement 7: Telegram Bot Format Selection

**User Story:** As a Telegram user, I want to select my report format through the bot interface, so that I can order reports without using the web interface.

#### Acceptance Criteria

1. THE Telegram_Bot SHALL present format selection using inline keyboard buttons
2. THE Telegram_Bot SHALL offer "Word Document (DOCX)" and "PDF Document" buttons
3. THE DOCX button SHALL include a "✅ Recommended" indicator
4. WHEN a user taps a format button, THE Telegram_Bot SHALL acknowledge the selection with a callback query answer
5. WHEN a user selects a format, THE Telegram_Bot SHALL store the format preference for the order
6. THE Telegram_Bot SHALL proceed to payment after format selection

### Requirement 8: Storage Service Format Handling

**User Story:** As a system administrator, I want the storage service to handle both file formats correctly, so that files are stored with appropriate extensions and metadata.

#### Acceptance Criteria

1. WHEN storing a DOCX report, THE Storage_Service SHALL use the .docx file extension
2. WHEN storing a PDF report, THE Storage_Service SHALL use the .pdf file extension
3. WHEN storing a DOCX report, THE Storage_Service SHALL set the MIME type to 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
4. WHEN storing a PDF report, THE Storage_Service SHALL set the MIME type to 'application/pdf'
5. THE Storage_Service SHALL generate filenames in the format: vehicle-report-{vin}{extension}
6. WHEN retrieving a report, THE Storage_Service SHALL return the correct MIME type based on the stored format

### Requirement 9: Email Service Format Handling

**User Story:** As a customer, I want to receive my report via email with the correct file format, so that I can open it with the appropriate application.

#### Acceptance Criteria

1. WHEN emailing a DOCX report, THE Email_Service SHALL attach the file with .docx extension
2. WHEN emailing a PDF report, THE Email_Service SHALL attach the file with .pdf extension
3. WHEN emailing a DOCX report, THE Email_Service SHALL set the attachment MIME type to 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
4. WHEN emailing a PDF report, THE Email_Service SHALL set the attachment MIME type to 'application/pdf'
5. THE Email_Service SHALL include the format type in the email subject or body
6. WHEN the email is sent, THE Email_Service SHALL log the format and file size

### Requirement 10: Comprehensive Report Sections in DOCX

**User Story:** As a customer, I want all report sections available in DOCX format, so that I have complete information regardless of format choice.

#### Acceptance Criteria

1. THE DOCX_Generator SHALL render the Vehicle Identification section with make, model, year, VIN, and trim
2. THE DOCX_Generator SHALL render the Vehicle Specifications section with all available specification data
3. THE DOCX_Generator SHALL render the Engine & Performance section with engine details
4. THE DOCX_Generator SHALL render the Transmission & Drivetrain section
5. THE DOCX_Generator SHALL render the Dimensions & Capacity section
6. THE DOCX_Generator SHALL render the Safety Features section
7. THE DOCX_Generator SHALL render the Manufacturing Information section
8. THE DOCX_Generator SHALL render the Safety Recalls section
9. THE DOCX_Generator SHALL render the Ownership History section
10. THE DOCX_Generator SHALL render the Sale History section
11. THE DOCX_Generator SHALL render the Odometer History section
12. THE DOCX_Generator SHALL render the Title History section
13. THE DOCX_Generator SHALL render the Inspection History section
14. THE DOCX_Generator SHALL render the Insurance History section
15. THE DOCX_Generator SHALL render the Junk & Salvage Information section
16. THE DOCX_Generator SHALL render the Accident History section
17. THE DOCX_Generator SHALL render the Lien & Impound Records section
18. THE DOCX_Generator SHALL render the Theft History section
19. THE DOCX_Generator SHALL render the Title Brands section
20. THE DOCX_Generator SHALL render the Market Value section
21. THE DOCX_Generator SHALL render the Warranty Information section

### Requirement 11: Image Embedding in DOCX

**User Story:** As a customer, I want to see vehicle images in my DOCX report, so that I can visually identify the vehicle.

#### Acceptance Criteria

1. WHEN vehicle images are available, THE DOCX_Generator SHALL embed up to 4 images in the document
2. THE DOCX_Generator SHALL fetch images from URLs and convert them to binary data for embedding
3. THE DOCX_Generator SHALL resize images to fit within document margins (maximum width: 6 inches)
4. THE DOCX_Generator SHALL maintain image aspect ratios when resizing
5. WHEN an image fails to load, THE DOCX_Generator SHALL continue generation without that image
6. THE DOCX_Generator SHALL include image metadata (source, match type, date) as captions below each image
7. WHEN no images are available, THE DOCX_Generator SHALL display a "Data Not Available" placeholder

### Requirement 12: Professional DOCX Formatting

**User Story:** As a customer, I want my DOCX report to look professional and well-formatted, so that I can use it for business purposes.

#### Acceptance Criteria

1. THE DOCX_Generator SHALL use heading styles (Heading 1 for sections, Heading 2 for subsections)
2. THE DOCX_Generator SHALL render data tables with borders and alternating row colors
3. THE DOCX_Generator SHALL use consistent fonts throughout the document (Arial or Calibri)
4. THE DOCX_Generator SHALL apply appropriate spacing between sections (12pt before, 6pt after)
5. THE DOCX_Generator SHALL use bold text for labels and regular text for values in tables
6. THE DOCX_Generator SHALL align numeric values to the right in table cells
7. THE DOCX_Generator SHALL include a header with "MotoCheck" branding and report date
8. THE DOCX_Generator SHALL include a footer with disclaimer text and page numbers
9. THE DOCX_Generator SHALL use A4 page size with 1-inch margins

### Requirement 13: Empty Section Handling in DOCX

**User Story:** As a customer, I want to see helpful placeholders for unavailable data, so that I understand which information is missing.

#### Acceptance Criteria

1. WHEN a Report_Section has no data, THE DOCX_Generator SHALL display the section title
2. WHEN a Report_Section has no data, THE DOCX_Generator SHALL display a "Data Not Available" message
3. WHEN a Report_Section has no data, THE DOCX_Generator SHALL display explanatory text: "This information will be displayed when available from our data sources"
4. THE DOCX_Generator SHALL use consistent styling for all empty section placeholders
5. WHEN a table row has a missing value, THE DOCX_Generator SHALL display "N/A" in that cell

### Requirement 14: NCS Valuation Section in DOCX

**User Story:** As a Nigerian customer, I want to see NCS valuation data in my DOCX report, so that I can understand import costs.

#### Acceptance Criteria

1. WHEN includeNCSValuation is true, THE DOCX_Generator SHALL render the NCS Valuation section
2. THE DOCX_Generator SHALL display CIF Value in USD with proper formatting
3. THE DOCX_Generator SHALL display CIF Value in NGN with naira symbol (₦)
4. THE DOCX_Generator SHALL display the CBN Exchange Rate
5. THE DOCX_Generator SHALL display the Confidence Level with appropriate styling
6. WHEN includeNCSValuation is false, THE DOCX_Generator SHALL omit the NCS Valuation section

### Requirement 15: Duty Breakdown Section in DOCX

**User Story:** As a Nigerian customer, I want to see detailed import duty calculations in my DOCX report, so that I can budget for vehicle importation.

#### Acceptance Criteria

1. WHEN includeDutyBreakdown is true, THE DOCX_Generator SHALL render the Nigerian Import Duty Breakdown section
2. THE DOCX_Generator SHALL display Import Duty (35%) with amount in NGN
3. THE DOCX_Generator SHALL display Surcharge (7%) with amount in NGN
4. THE DOCX_Generator SHALL display NAC Levy (20%) with amount in NGN
5. THE DOCX_Generator SHALL display CISS (1%) with amount in NGN
6. THE DOCX_Generator SHALL display ETLS (0.5%) with amount in NGN
7. THE DOCX_Generator SHALL display VAT (7.5%) with amount in NGN
8. THE DOCX_Generator SHALL display Total Import Duty with emphasized styling
9. THE DOCX_Generator SHALL format all currency amounts with thousand separators
10. WHEN includeDutyBreakdown is false, THE DOCX_Generator SHALL omit the duty breakdown section

### Requirement 16: DOCX Generation Performance

**User Story:** As a system administrator, I want DOCX generation to be fast and reliable, so that users receive reports quickly without timeouts.

#### Acceptance Criteria

1. WHEN generating a comprehensive report, THE DOCX_Generator SHALL complete within 2 seconds for 90% of requests
2. THE DOCX_Generator SHALL use less than 100MB of memory during generation
3. THE DOCX_Generator SHALL achieve 99.9% success rate (less than 0.1% failures)
4. THE DOCX_Generator SHALL generate files between 100KB and 300KB in size
5. WHEN generation completes, THE DOCX_Generator SHALL log performance metrics (duration, memory, file size)

### Requirement 17: Backward Compatibility

**User Story:** As a system administrator, I want existing PDF orders to continue working, so that the system maintains compatibility with historical data.

#### Acceptance Criteria

1. WHEN an order has report_format set to 'pdf', THE System SHALL generate a PDF report
2. WHEN an order has no report_format value (legacy orders), THE System SHALL default to 'pdf' for backward compatibility
3. THE System SHALL maintain all existing PDF generation functionality without changes to output format
4. WHEN retrieving historical orders, THE System SHALL correctly identify and serve PDF files
5. THE System SHALL support regeneration of reports in their original format

### Requirement 18: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN DOCX generation fails, THE DOCX_Generator SHALL throw an error with a descriptive message
2. WHEN an image fails to embed, THE DOCX_Generator SHALL log a warning and continue generation
3. WHEN a section fails to render, THE DOCX_Generator SHALL log the error and render an empty section placeholder
4. THE System SHALL log the start and completion of each report generation with format type
5. THE System SHALL log generation duration, file size, and memory usage for performance monitoring
6. WHEN format routing fails, THE Format_Router SHALL log the error with order ID and requested format

### Requirement 19: DOCX Parser and Pretty Printer

**User Story:** As a developer, I want to ensure DOCX documents are correctly structured, so that they open properly in Microsoft Word and other applications.

#### Acceptance Criteria

1. THE DOCX_Generator SHALL produce valid Office Open XML documents conforming to ECMA-376 standard
2. WHEN a generated DOCX file is opened in Microsoft Word, THE document SHALL display without errors
3. WHEN a generated DOCX file is opened in Google Docs, THE document SHALL display without errors
4. WHEN a generated DOCX file is opened in LibreOffice Writer, THE document SHALL display without errors
5. FOR ALL valid DOCX documents, opening in Word then saving then opening again SHALL produce an equivalent document (round-trip property)
6. THE System SHALL validate DOCX structure before returning the buffer to ensure document integrity

### Requirement 20: Format Conversion Support

**User Story:** As a customer, I want to request a different format after purchase, so that I can get both formats if needed.

#### Acceptance Criteria

1. THE System SHALL support regenerating reports in a different format using the same order data
2. WHEN a customer requests format conversion, THE System SHALL generate the report in the new format
3. THE System SHALL maintain the original order's report_format value in the database
4. THE System SHALL log format conversion requests with order ID, original format, and new format
5. WHEN conversion completes, THE System SHALL deliver the new format via the same delivery method as the original
