# Vehicle Images Integration - Complete

## What Was Fixed

### 1. Image Fetching Added to Webhook Handler
- **File**: `src/routes/api/webhook/paystack/+server.ts`
- **Change**: Added `VehicleImageService` import and image fetching before report generation
- **Impact**: Images are now fetched from Google Custom Search API and other sources before generating reports

### 2. PDF Image Support Added
- **File**: `src/lib/server/reports/pdfkit-generator.ts`
- **Change**: Added `addVehicleImages()` function to embed images in PDF reports
- **Features**:
  - Fetches up to 3 images per report
  - 5-second timeout per image
  - 5MB size limit per image
  - Graceful error handling (continues if image fails)
  - Displays image source, match type, and date in captions

### 3. Environment Variables Documented
- **File**: `.env`
- **Change**: Added Google Custom Search API configuration with helpful comments
- **Variables**:
  - `GOOGLE_SEARCH_API_KEY` - Your Google API key
  - `GOOGLE_SEARCH_ENGINE_ID` - Your Custom Search Engine ID

## How It Works

### Image Fetching Flow
1. **Webhook receives payment confirmation**
2. **Fetch vehicle data** from database
3. **Fetch vehicle images** using `VehicleImageService`:
   - Searches Google Custom Search API (if configured)
   - Searches DuckDuckGo (free, no API key)
   - Falls back to generated placeholder if no images found
4. **Add images to vehicle data** object
5. **Generate reports** (both PDF and DOCX with images)
6. **Upload to R2** and send to customer

### Image Sources (Priority Order)
1. **Auction sites** - VIN-exact matches (requires scraping setup)
2. **Dealer listings** - VIN-exact matches (requires API access)
3. **Google Custom Search** - Stock images by make/model/year
4. **DuckDuckGo** - Stock images by make/model/year (free)
5. **Generated placeholder** - Professional SVG with vehicle silhouette

### Caching
- Images are cached in database for 24 hours
- Reduces API calls and improves performance
- Automatic cache eviction when limit (1000 entries) is reached

## Setup Instructions

### For Production (Railway)

1. **Get Google Custom Search API Key**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a new API key
   - Enable "Custom Search API"
   - Copy the API key

2. **Create Custom Search Engine**:
   - Go to https://programmablesearchengine.google.com/
   - Click "Add" to create a new search engine
   - Add the sites from your site list (NHTSA, automotive sites, etc.)
   - Enable "Image search"
   - Copy the Search Engine ID (cx parameter)

3. **Add to Railway Environment Variables**:
   ```
   GOOGLE_SEARCH_API_KEY=your_actual_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

4. **Redeploy** your Railway app to pick up the new environment variables

### For Local Development

1. Add your credentials to `.env`:
   ```env
   GOOGLE_SEARCH_API_KEY="your_api_key"
   GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id"
   ```

2. Restart your dev server

## Testing

### Test Image Fetching Locally
```bash
# Make a test payment and check logs for:
🖼️ Fetching vehicle images...
✅ Found 3 images (sources: google, duckduckgo, placeholder)
```

### Verify Images in Reports
1. Open generated DOCX file
2. Check "Vehicle Images" section
3. Should see 1-4 images with captions

1. Open generated PDF file
2. Check "Vehicle Images" section after VIN
3. Should see 1-3 images with captions

## API Quotas

### Google Custom Search API
- **Free tier**: 100 queries per day
- **Paid tier**: $5 per 1,000 queries (after free tier)
- **Recommendation**: Monitor usage in Google Cloud Console

### DuckDuckGo
- **Free**: No API key required
- **Rate limit**: Respect 1-second delay between requests (already implemented)

## Fallback Behavior

If image fetching fails (API down, quota exceeded, network error):
- **Graceful degradation**: Report generation continues
- **Placeholder image**: Professional SVG with vehicle silhouette
- **Logs warning**: Check logs for troubleshooting
- **No user impact**: Customer still receives complete report

## What About "Rich Data"?

The comprehensive vehicle data structure already includes 21 sections:
- ✅ Vehicle Images (now working)
- ✅ Vehicle Specifications
- ✅ Engine & Performance
- ✅ Transmission & Drivetrain
- ✅ Dimensions & Capacity
- ✅ Safety Features
- ✅ Manufacturing Information
- ✅ Safety Recalls
- ⏳ Ownership History (placeholder - needs data source)
- ⏳ Sale History (placeholder - needs data source)
- ⏳ Odometer History (placeholder - needs data source)
- ⏳ Title History (placeholder - needs data source)
- ⏳ Inspection History (placeholder - needs data source)
- ⏳ Insurance History (placeholder - needs data source)
- ⏳ Junk & Salvage (placeholder - needs data source)
- ⏳ Accident History (placeholder - needs data source)
- ⏳ Lien & Impound (placeholder - needs data source)
- ⏳ Theft History (placeholder - needs data source)
- ⏳ Title Brands (placeholder - needs data source)
- ⏳ Market Value (placeholder - needs data source)
- ⏳ Warranty Information (placeholder - needs data source)

**Note**: Sections marked ⏳ show "Data Not Available" placeholders. To populate these, you'll need to integrate additional data sources (CARFAX, AutoCheck, NMVTIS, etc.) which typically require paid API access.

## Next Steps

1. **Add Google API credentials to Railway** (see Setup Instructions above)
2. **Test with a real payment** to verify images appear in reports
3. **Monitor API usage** in Google Cloud Console
4. **Consider paid tier** if you exceed 100 queries/day
5. **Add more data sources** for comprehensive vehicle history (ownership, accidents, etc.)
