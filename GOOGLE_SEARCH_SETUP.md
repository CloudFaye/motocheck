# Google Custom Search Engine Setup Guide

## Step 1: Create API Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the API key (starts with `AIza...`)
4. Click "Restrict Key" (recommended):
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API"
   - Save

## Step 2: Enable Custom Search API

1. Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)
2. Search for "Custom Search API"
3. Click "Enable"

## Step 3: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" or "Create a new search engine"
3. Configure:
   - **Name**: "MotoCheck Vehicle Images"
   - **What to search**: "Search specific sites"
   - **Sites to search**: Add these sites (one per line):
     ```
     www.nhtsa.gov/*
     www.safercar.gov/*
     www.cars.com/*
     www.autotrader.com/*
     www.edmunds.com/*
     www.kbb.com/*
     www.carfax.com/*
     www.autocheck.com/*
     www.cargurus.com/*
     www.truecar.com/*
     www.caranddriver.com/*
     www.motortrend.com/*
     www.autoblog.com/*
     ```
   - **Language**: English
   - **Search engine keywords**: vehicle, car, auto, images

4. Click "Create"

## Step 4: Configure Search Engine

1. After creation, click "Customize" or "Control Panel"
2. Go to "Setup" → "Basics"
3. **Enable Image Search**:
   - Toggle "Image search" to ON
   - This is CRITICAL for getting image results
4. **Search the entire web** (optional but recommended):
   - Toggle "Search the entire web" to ON
   - This allows broader image results beyond just the specified sites
5. Copy the **Search Engine ID** (looks like: `017576662512468239146:omuauf_lfve`)

## Step 5: Add to Environment Variables

### Railway (Production)
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add:
   ```
   GOOGLE_SEARCH_API_KEY=AIza...your_key_here
   GOOGLE_SEARCH_ENGINE_ID=017576662512468239146:omuauf_lfve
   ```
5. Redeploy

### Local Development
Add to `.env`:
```env
GOOGLE_SEARCH_API_KEY="AIza...your_key_here"
GOOGLE_SEARCH_ENGINE_ID="017576662512468239146:omuauf_lfve"
```

## Step 6: Test

### Test API Key
```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=2020+Toyota+Camry&searchType=image&num=5"
```

Expected response:
```json
{
  "items": [
    {
      "title": "2020 Toyota Camry",
      "link": "https://example.com/image.jpg",
      "image": {
        "contextLink": "https://example.com/page",
        "height": 480,
        "width": 640
      }
    }
  ]
}
```

### Test in Your App
1. Make a test payment
2. Check Railway logs for:
   ```
   🖼️ Fetching vehicle images...
   ✅ Found 3 images (sources: google, duckduckgo, placeholder)
   ```
3. Download the report and verify images appear

## Troubleshooting

### "API key not valid"
- Verify the API key is correct
- Check that Custom Search API is enabled
- Ensure API key restrictions allow Custom Search API

### "Invalid Value" for cx parameter
- Verify the Search Engine ID is correct
- Check that the search engine exists in your account

### No images returned
- Verify "Image search" is enabled in search engine settings
- Try enabling "Search the entire web"
- Check that your search query is valid (make/model/year)

### Quota exceeded (429 error)
- Free tier: 100 queries/day
- Upgrade to paid tier: $5 per 1,000 queries
- Monitor usage in Google Cloud Console

### Images not appearing in reports
- Check Railway logs for image fetch errors
- Verify environment variables are set correctly
- Test API key with curl command above
- Check that images are being fetched (look for "Fetching vehicle images" log)

## API Limits

### Free Tier
- **100 queries per day**
- **10 queries per second**
- **No credit card required**

### Paid Tier
- **$5 per 1,000 queries** (after free 100)
- **Same rate limits**
- **Billing must be enabled in Google Cloud**

### Recommendations
- Monitor usage in Google Cloud Console
- Set up billing alerts
- Consider caching (already implemented - 24 hours)
- Use DuckDuckGo as fallback (free, no API key)

## Alternative: DuckDuckGo Only

If you don't want to use Google Custom Search:
1. Leave `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` empty
2. The system will automatically use DuckDuckGo (free)
3. Quality may be lower, but no API costs

## Cost Estimation

### Example Usage
- **10 reports per day** = 10 API calls
- **300 reports per month** = 300 API calls
- **Cost**: Free (under 100/day limit)

### High Volume
- **500 reports per day** = 500 API calls
- **15,000 reports per month** = 15,000 API calls
- **Cost**: $5 × (15,000 - 3,000) / 1,000 = $60/month
  - First 3,000 free (100/day × 30 days)
  - Remaining 12,000 at $5 per 1,000

## Support

If you encounter issues:
1. Check [Google Custom Search API documentation](https://developers.google.com/custom-search/v1/overview)
2. Review [API quotas and limits](https://developers.google.com/custom-search/v1/overview#pricing)
3. Check Railway logs for detailed error messages
