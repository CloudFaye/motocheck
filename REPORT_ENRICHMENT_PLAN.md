# Vehicle Report Enrichment Plan

## Current State Analysis

### What We Have (NHTSA Data)
✅ Vehicle Specifications (Make, Model, Year, Engine, etc.)
✅ Manufacturing Information (Plant, Country)
✅ Safety Features (Airbags, ABS, ESC)
✅ Recalls (NHTSA campaigns)
✅ NCS Valuation & Import Duty Calculation

### What We're Missing (From ClearVIN Analysis)

#### 1. **Ownership & Title History**
- Number of previous owners
- Ownership duration per owner
- State/country of registration
- Title transfers timeline
- **Data Source Needed**: NMVTIS (National Motor Vehicle Title Information System) or equivalent

#### 2. **Sale History**
- Previous sale dates
- Sale prices
- Sale locations
- Dealer vs private sales
- **Data Source Needed**: Auction data APIs, dealer networks

#### 3. **Odometer Readings**
- Historical odometer readings with dates
- Mileage progression timeline
- Odometer rollback detection
- **Data Source Needed**: State DMV records, inspection records

#### 4. **Accident & Damage History**
- Accident dates and locations
- Damage severity (minor, moderate, severe)
- Damaged areas (visual diagram)
- Repair costs
- Insurance claims
- **Data Source Needed**: Insurance databases (CARFAX, AutoCheck equivalents)

#### 5. **Title Brands**
- Salvage title
- Rebuilt title
- Flood damage
- Hail damage
- Lemon law buyback
- **Data Source Needed**: State DMV title records

#### 6. **Junk & Salvage Information**
- Salvage auction records
- Total loss declarations
- Salvage yard records
- **Data Source Needed**: Salvage auction databases

#### 7. **Lien & Impound Records**
- Active liens
- Lien holders
- Impound history
- **Data Source Needed**: State DMV lien records

#### 8. **Theft Records**
- Theft reports
- Recovery status
- NICB (National Insurance Crime Bureau) data
- **Data Source Needed**: NICB API, police databases

#### 9. **Emissions & Safety Inspections**
- Inspection dates
- Pass/fail status
- Inspection locations
- **Data Source Needed**: State inspection databases

#### 10. **Insurance Records**
- Insurance claims history
- Claim types
- Claim amounts
- **Data Source Needed**: Insurance industry databases

#### 11. **Market Values**
- Current market value
- Historical value trends
- Comparable sales
- **Data Source Needed**: KBB, NADA, Edmunds APIs

#### 12. **Warranty Information**
- Original warranty details
- Extended warranty
- Warranty expiration
- **Data Source Needed**: Manufacturer databases

## Vehicle Images Strategy

### Image Types Needed
1. **Hero Image** - Main vehicle photo (front 3/4 view)
2. **Multiple Angles** - Front, rear, side views
3. **Interior Photos** - Dashboard, seats, cargo area
4. **Damage Diagram** - Line drawing with highlighted areas
5. **Logo/Badge** - Manufacturer logo

### Image Sources & Approaches

#### Option 1: Stock Vehicle Images (Recommended for Phase 1)
**Free/Affordable APIs:**
- **Imagin Studio API** - High-quality stock vehicle images by make/model/year
  - URL pattern: `https://cdn.imagin.studio/getimage?customer=YOUR_KEY&make=honda&modelFamily=accord&modelYear=2021&angle=01`
  - Angles: 01-36 (360° views)
  - Cost: ~$50-200/month for API access
  
- **CarQuery API** - Free vehicle images database
  - Limited selection but free
  - Good for common vehicles
  
- **Edmunds API** - Vehicle photos
  - Paid but comprehensive
  - Multiple angles available

#### Option 2: Web Scraping (Fallback)
**Sources:**
- Google Images API (paid)
- Bing Image Search API (free tier available)
- Manufacturer websites (scrape with permission)
- Auto dealer websites

**Implementation:**
```typescript
async function getVehicleImage(make: string, model: string, year: string): Promise<string> {
  // 1. Try Imagin Studio API
  // 2. Fallback to Bing Image Search
  // 3. Fallback to placeholder with make/model text
}
```

#### Option 3: Generate Placeholder Images
**For when no image is available:**
- SVG placeholder with vehicle silhouette
- Show make, model, year as text
- Use vehicle type (sedan, SUV, truck) for appropriate silhouette
- Professional looking, not just "no image"

#### Option 4: User-Uploaded Images (Future)
- Allow users to upload photos when requesting report
- Store in R2 bucket
- Include in report generation

### Damage Diagram Images

#### Approach 1: SVG Templates (Recommended)
**Create SVG templates for each vehicle type:**
- Sedan (top view)
- SUV (top view)
- Truck (top view)
- Van (top view)

**Highlight damaged areas programmatically:**
```typescript
const damagedAreas = ['front-left', 'rear-bumper'];
// Dynamically color these areas in SVG
```

#### Approach 2: Pre-rendered Images
- Create 50+ variations of damage combinations
- Select appropriate image based on damage data
- Store in static assets

### Implementation Plan

#### Phase 1: Stock Images
1. ✅ Integrate Imagin Studio API (or similar)
2. ✅ Implement fallback to Bing Image Search
3. ✅ Create professional SVG placeholders
4. ✅ Cache images in R2 for performance

#### Phase 2: Enhanced Images
1. 🔄 Add multiple angle views
2. 🔄 Interior photos (if available)
3. 🔄 Manufacturer logos
4. 🔄 Dynamic damage diagrams

#### Phase 3: User Content
1. ⏳ Allow user photo uploads
2. ⏳ Photo verification system
3. ⏳ Build image database

### Image Caching Strategy
```typescript
// Cache structure
interface VehicleImageCache {
  vin: string;
  make: string;
  model: string;
  year: string;
  images: {
    hero: string; // R2 URL or base64
    front: string;
    rear: string;
    side: string;
    interior?: string;
  };
  cachedAt: Date;
}
```

## Data Sources We Can Access

### ✅ Currently Integrated
1. **NHTSA API** - Vehicle specs, recalls
2. **NCS Valuation Tables** - Import duty calculation
3. **CBN Exchange Rates** - Currency conversion

### 🔄 Can Integrate (Free/Affordable)
1. **NHTSA Recalls API** - Already have, can enhance
2. **VIN Decoder APIs** - Additional validation
3. **Market Value APIs** - KBB, Edmunds (paid but affordable)
4. **Imagin Studio API** - Stock vehicle images (~$50-200/month)
5. **Bing Image Search API** - Fallback images (free tier)

### ❌ Difficult/Expensive to Access
1. **CARFAX/AutoCheck** - Proprietary, expensive
2. **NMVTIS** - Requires certification, fees
3. **Insurance Databases** - Restricted access
4. **State DMV Records** - Varies by state, privacy laws

## Recommended Approach

### Phase 1: Enhance with Available Data (Immediate)
1. **Expand NHTSA Data Extraction**
   - Extract more detailed specs
   - Better recall formatting
   - Add safety ratings

2. **Add Market Valuation**
   - Integrate with free/affordable APIs
   - Show estimated market value
   - Compare to NCS valuation

3. **Improve Report Design**
   - Clean, professional layout
   - Vehicle damage diagram (placeholder for now)
   - Better typography
   - Section headers with icons

### Phase 2: Partner Integrations (Medium-term)
1. **Vehicle History Partners**
   - Research Nigerian vehicle history providers
   - Explore partnerships with insurance companies
   - Connect with customs/import databases

2. **Auction Data**
   - Partner with salvage auction houses
   - Get historical sale data

### Phase 3: Build Our Own Database (Long-term)
1. **Crowdsourced Data**
   - Allow users to report accidents, sales
   - Build Nigerian-specific vehicle history
   - Verify and aggregate user submissions

2. **Partner with Mechanics/Dealers**
   - Collect service records
   - Track vehicle maintenance
   - Build comprehensive history

## Report Structure (Comprehensive)

### Cover Page
- Vehicle image (if available)
- VIN
- Make, Model, Year
- Report date
- MotoCheck branding

### Table of Contents
- Quick navigation to all sections

### Executive Summary
- Overall vehicle condition score
- Key findings (accidents, title issues, etc.)
- Recommendation (buy/don't buy)

### Section 1: Vehicle Specifications
- Identification
- Engine & Performance
- Transmission & Drivetrain
- Dimensions & Weight
- Body & Interior
- Tires & Wheels

### Section 2: Manufacturing Information
- Plant details
- Production date
- Country of origin
- Manufacturer info

### Section 3: Safety Information
- Safety features
- Safety ratings (if available)
- Active recalls
- Recall history

### Section 4: Title & Ownership History
- Number of owners
- Ownership timeline
- Title transfers
- Title brands (if any)

### Section 5: Accident & Damage History
- Accident timeline
- Damage severity
- Visual damage diagram
- Repair records

### Section 6: Odometer History
- Mileage timeline graph
- Odometer readings with dates
- Rollback detection

### Section 7: Service & Maintenance
- Service records (if available)
- Inspection history
- Emissions tests

### Section 8: Market Analysis
- Current market value
- Historical value trends
- Comparable vehicles
- Price recommendation

### Section 9: Import Duty Calculation (Nigeria-specific)
- NCS valuation
- Duty breakdown
- Total import cost
- Exchange rate used

### Section 10: Additional Records
- Theft records
- Lien records
- Insurance claims
- Warranty information

### Appendix
- Data sources
- Methodology
- Disclaimers
- Glossary

## Design Guidelines (From Images)

### Typography
- **Monospace font** for tabular data (like expense list)
- Clean, legible sans-serif for body text
- Clear hierarchy with font sizes
- Adequate line spacing

### Layout
- **Damage Diagram**: Clean line drawing of vehicle with highlighted areas
- Light blue/gray accents for damaged areas
- Simple, minimalist design
- White background with subtle shadows

### Color Scheme
- Primary: Dark blue/teal for headers
- Accent: Light blue for highlights
- Text: Black for primary, gray for secondary
- Alerts: Red for issues, green for good status

### Data Presentation
- Tables with clear borders
- Dashed lines for separators
- Right-aligned numbers
- Bold totals
- Consistent spacing

## Implementation Priority

### High Priority (Do Now)
1. ✅ Enhance NHTSA data extraction
2. ✅ Improve PDF design/layout
3. ✅ Add vehicle damage diagram (placeholder)
4. ✅ Better recall formatting
5. ✅ Add "data not available" sections

### Medium Priority (Next Sprint)
1. 🔄 Integrate market value API
2. 🔄 Add safety ratings
3. 🔄 Create comprehensive report template
4. 🔄 Add report tiers (basic, standard, premium)

### Low Priority (Future)
1. ⏳ Partner integrations
2. ⏳ Build proprietary database
3. ⏳ Crowdsourced data collection

## Next Steps

1. **Review this plan** - Confirm approach
2. **Update vehicle types** - Add new data structures
3. **Enhance NHTSA mapper** - Extract more data
4. **Redesign PDF template** - Implement new design
5. **Add placeholder sections** - Show all sections even without data
6. **Test with real VINs** - Verify output quality
