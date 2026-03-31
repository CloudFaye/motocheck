# Requirements Document

## Introduction

This document specifies requirements for enriching vehicle reports with comprehensive data sections, professional design, and an intelligent vehicle image aggregation service. The goal is to match the data richness and professional presentation of industry-leading vehicle history reports while using only free data sources and services.

## Glossary

- **VIN**: Vehicle Identification Number - A unique 17-character code identifying a specific vehicle
- **Image_Aggregator**: The service that searches multiple free sources to find vehicle images matching a VIN
- **Report_Generator**: The system component that creates PDF vehicle reports
- **Template_Builder**: The component that constructs HTML templates for PDF generation
- **Vehicle_Data_Types**: TypeScript type definitions for vehicle information structures
- **ClearVIN**: Reference vehicle history report provider used as design inspiration
- **NHTSA**: National Highway Traffic Safety Administration - Current data source for vehicle specifications
- **Clay.io_Placeholder**: Professional placeholder image style with vehicle silhouette and text
- **Stock_Image**: Generic manufacturer-provided image for a vehicle make/model/year
- **VIN_Exact_Match**: Image confirmed to be of the specific vehicle identified by the VIN
- **Report_Section**: A distinct area of the report covering specific data (e.g., ownership history, accidents)
- **Data_Unavailable_State**: Display state showing a section exists but has no data to present

## Requirements

### Requirement 1: Intelligent Vehicle Image Aggregation Service

**User Story:** As a report generator, I want to aggregate vehicle images from multiple free sources, so that reports include relevant visual content without paid API dependencies.

#### Acceptance Criteria

1. THE Image_Aggregator SHALL search auction sites for VIN-exact matches
2. THE Image_Aggregator SHALL search dealer listings for VIN-exact matches
3. THE Image_Aggregator SHALL search Google Images for vehicle images
4. THE Image_Aggregator SHALL search DuckDuckGo for vehicle images
5. WHEN VIN-exact matches are found, THE Image_Aggregator SHALL prioritize those images over generic images
6. WHEN no VIN-exact matches are found, THE Image_Aggregator SHALL return generic stock images for the make/model/year
7. WHEN no stock images are found, THE Image_Aggregator SHALL return Clay.io style placeholder images
8. THE Image_Aggregator SHALL aggregate images by sale time, listing date, and auction date
9. THE Image_Aggregator SHALL return image metadata including source, date, and match confidence
10. THE Image_Aggregator SHALL implement rate limiting to respect free service usage limits
11. THE Image_Aggregator SHALL cache successful image searches to minimize repeated requests
12. THE Image_Aggregator SHALL be implemented in the file src/lib/server/vehicle-image-service.ts

### Requirement 2: Comprehensive Report Data Structures

**User Story:** As a developer, I want extended type definitions for all report sections, so that the codebase supports comprehensive vehicle data.

#### Acceptance Criteria

1. THE Vehicle_Data_Types SHALL include ownership history data structures
2. THE Vehicle_Data_Types SHALL include sale history data structures
3. THE Vehicle_Data_Types SHALL include odometer reading data structures
4. THE Vehicle_Data_Types SHALL include title history data structures
5. THE Vehicle_Data_Types SHALL include emissions inspection data structures
6. THE Vehicle_Data_Types SHALL include safety inspection data structures
7. THE Vehicle_Data_Types SHALL include insurance record data structures
8. THE Vehicle_Data_Types SHALL include junk and salvage information data structures
9. THE Vehicle_Data_Types SHALL include accident and damage history data structures
10. THE Vehicle_Data_Types SHALL include lien and impound record data structures
11. THE Vehicle_Data_Types SHALL include theft record data structures
12. THE Vehicle_Data_Types SHALL include title brand data structures
13. THE Vehicle_Data_Types SHALL include market value data structures
14. THE Vehicle_Data_Types SHALL include past sales detail data structures
15. THE Vehicle_Data_Types SHALL include warranty information data structures
16. THE Vehicle_Data_Types SHALL extend the existing ComprehensiveVehicleData interface

### Requirement 3: Complete Report Section Display

**User Story:** As a user, I want to see all report sections even when data is unavailable, so that I understand the full scope of information that could be available.

#### Acceptance Criteria

1. THE Report_Generator SHALL display ownership history section for all reports
2. THE Report_Generator SHALL display sale history section for all reports
3. THE Report_Generator SHALL display odometer readings section for all reports
4. THE Report_Generator SHALL display title history section for all reports
5. THE Report_Generator SHALL display emissions inspection section for all reports
6. THE Report_Generator SHALL display safety inspection section for all reports
7. THE Report_Generator SHALL display insurance records section for all reports
8. THE Report_Generator SHALL display junk and salvage section for all reports
9. THE Report_Generator SHALL display accident and damage history section for all reports
10. THE Report_Generator SHALL display lien and impound records section for all reports
11. THE Report_Generator SHALL display theft records section for all reports
12. THE Report_Generator SHALL display title brands section for all reports
13. THE Report_Generator SHALL display market values section for all reports
14. THE Report_Generator SHALL display past sales details section for all reports
15. THE Report_Generator SHALL display warranty information section for all reports
16. WHEN data is unavailable for a section, THE Report_Generator SHALL display "No data available" message
17. WHEN data is unavailable for a section, THE Report_Generator SHALL maintain consistent section styling and layout

### Requirement 4: Professional Report Design Implementation

**User Story:** As a user, I want professionally designed reports with clean typography and visual hierarchy, so that information is easy to read and understand.

#### Acceptance Criteria

1. THE Template_Builder SHALL use monospace font for tabular data
2. THE Template_Builder SHALL use clean sans-serif font for body text
3. THE Template_Builder SHALL implement clear visual hierarchy with font sizes
4. THE Template_Builder SHALL use light blue accent colors for section highlights
5. THE Template_Builder SHALL implement consistent section header styling
6. THE Template_Builder SHALL use adequate line spacing for readability
7. THE Template_Builder SHALL implement clean table layouts with clear borders
8. THE Template_Builder SHALL right-align numerical values in tables
9. THE Template_Builder SHALL use dashed lines for visual separators
10. THE Template_Builder SHALL implement white background with subtle shadows
11. THE Template_Builder SHALL ensure design is distinct from ClearVIN while maintaining professional quality

### Requirement 5: Vehicle Damage Diagram Visualization

**User Story:** As a user, I want to see a visual diagram of vehicle damage locations, so that I can quickly understand which areas have been damaged.

#### Acceptance Criteria

1. THE Template_Builder SHALL generate SVG vehicle outline diagrams
2. THE Template_Builder SHALL support sedan vehicle type outlines
3. THE Template_Builder SHALL support SUV vehicle type outlines
4. THE Template_Builder SHALL support truck vehicle type outlines
5. THE Template_Builder SHALL support van vehicle type outlines
6. WHEN damage data is available, THE Template_Builder SHALL highlight damaged areas on the diagram
7. THE Template_Builder SHALL use light blue or gray colors for damaged area highlights
8. THE Template_Builder SHALL display damage severity indicators on the diagram
9. WHEN no damage data is available, THE Template_Builder SHALL display clean vehicle outline with "No damage reported" message

### Requirement 6: Report Generator Integration

**User Story:** As a system, I want the report generator to use the new image service and comprehensive data structures, so that generated reports include all available information.

#### Acceptance Criteria

1. THE Report_Generator SHALL invoke Image_Aggregator for vehicle images
2. THE Report_Generator SHALL include aggregated images in generated reports
3. THE Report_Generator SHALL handle Image_Aggregator failures gracefully
4. WHEN Image_Aggregator returns placeholder images, THE Report_Generator SHALL include them without error
5. THE Report_Generator SHALL use extended Vehicle_Data_Types for all data handling
6. THE Report_Generator SHALL pass all comprehensive data sections to Template_Builder
7. THE Report_Generator SHALL maintain existing NHTSA data integration
8. THE Report_Generator SHALL maintain existing NCS valuation integration
9. THE Report_Generator SHALL generate reports within 10 seconds for typical data volumes

### Requirement 7: Image Service Parser and Pretty Printer

**User Story:** As a developer, I want to parse image search results and format them consistently, so that the system handles diverse image sources reliably.

#### Acceptance Criteria

1. THE Image_Aggregator SHALL parse auction site HTML responses
2. THE Image_Aggregator SHALL parse dealer listing JSON responses
3. THE Image_Aggregator SHALL parse Google Images API responses
4. THE Image_Aggregator SHALL parse DuckDuckGo search results
5. THE Image_Aggregator SHALL format parsed results into consistent ImageResult objects
6. THE Image_Aggregator SHALL validate image URLs before returning them
7. THE Image_Aggregator SHALL handle malformed responses without crashing
8. FOR ALL valid ImageResult objects, serializing then parsing SHALL produce equivalent objects (round-trip property)

### Requirement 8: PDF Styling Enhancement

**User Story:** As a developer, I want updated PDF styling rules, so that generated reports match the professional design specifications.

#### Acceptance Criteria

1. THE PDF_Styles SHALL define typography rules for headers, body text, and tables
2. THE PDF_Styles SHALL define color palette including primary, accent, and text colors
3. THE PDF_Styles SHALL define spacing rules for sections and elements
4. THE PDF_Styles SHALL define table styling with borders and alignment
5. THE PDF_Styles SHALL define damage diagram styling rules
6. THE PDF_Styles SHALL define placeholder image styling rules
7. THE PDF_Styles SHALL ensure consistent styling across all report sections
8. THE PDF_Styles SHALL be implemented in src/lib/server/reports/pdf-styles.ts

### Requirement 9: Graceful Degradation for Missing Data

**User Story:** As a system, I want to handle missing data gracefully, so that reports are always generated successfully regardless of data availability.

#### Acceptance Criteria

1. WHEN ownership history data is unavailable, THE Report_Generator SHALL display ownership section with Data_Unavailable_State
2. WHEN sale history data is unavailable, THE Report_Generator SHALL display sale history section with Data_Unavailable_State
3. WHEN accident data is unavailable, THE Report_Generator SHALL display accident section with Data_Unavailable_State
4. WHEN title brand data is unavailable, THE Report_Generator SHALL display title brands section with Data_Unavailable_State
5. WHEN market value data is unavailable, THE Report_Generator SHALL display market value section with Data_Unavailable_State
6. WHEN all optional data is unavailable, THE Report_Generator SHALL still generate a complete report with NHTSA data
7. THE Report_Generator SHALL never fail report generation due to missing optional data
8. THE Report_Generator SHALL log warnings for missing data without throwing errors

### Requirement 10: Image Caching and Performance

**User Story:** As a system, I want to cache image search results, so that repeated requests for the same vehicle are fast and don't exceed rate limits.

#### Acceptance Criteria

1. THE Image_Aggregator SHALL cache successful image searches by VIN
2. THE Image_Aggregator SHALL cache image search results for 24 hours
3. WHEN a cached result exists and is less than 24 hours old, THE Image_Aggregator SHALL return cached data
4. WHEN a cached result is older than 24 hours, THE Image_Aggregator SHALL perform a new search
5. THE Image_Aggregator SHALL store cache in memory for fast access
6. THE Image_Aggregator SHALL limit cache size to 1000 entries
7. WHEN cache exceeds 1000 entries, THE Image_Aggregator SHALL evict oldest entries first
8. THE Image_Aggregator SHALL complete cached lookups within 50 milliseconds

