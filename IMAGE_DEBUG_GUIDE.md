# Image Debugging Guide

## Enhanced Logging Added

I've added detailed logging to help debug why images aren't showing. The logs will now show:

### Image Search Flow
```
🖼️ Starting image search for: { vin, make, model, year }
🔍 No cache found, searching image sources...
```

### Google Custom Search API
```
🔍 Google Search API check: { hasApiKey, apiKeyLength, hasSearchEngineId, searchEngineIdLength }
🔍 Google Search query: { query, year, make, model }
🔍 Attempting Google Search (attempt 1/3)...
🔍 Google Search response: { status, statusText, ok }
🔍 Google Search API response: { hasItems, itemCount, hasError, error }
✅ Google Search returned X images
```

### DuckDuckGo Search
```
🦆 DuckDuckGo search query: { query }
🦆 DuckDuckGo response: { status, ok }
🦆 DuckDuckGo data: { hasImage, hasRelatedTopics, relatedTopicsCount }
✅ DuckDuckGo found X total images
```

### Final Results
```
📊 Total images collected: X
✅ Returning X images (sources: google, duckduckgo, placeholder)
```

## How to Debug

### Step 1: Check Railway Logs

1. Go to your Railway project
2. Click on your service
3. Go to "Deployments" → Latest deployment → "View Logs"
4. Make a test payment
5. Look for the image search logs above

### Step 2: Verify Environment Variables

Check that these are set in Railway:
```bash
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=017576662512468239146:...
```

Look for this log line:
```
🔍 Google Search API check: { hasApiKey: true, apiKeyLength: 39, hasSearchEngineId: true, searchEngineIdLength: 33 }
```

If you see `hasApiKey: false` or `hasSearchEngineId: false`, the environment variables aren't set correctly.

### Step 3: Check API Response

Look for:
```
🔍 Google Search API response: { hasItems: true, itemCount: 5, hasError: false }
```

**If you see `hasError: true`**, check the error details:
- `"error": { "code": 400, "message": "API key not valid" }` → API key is wrong
- `"error": { "code": 403, "message": "The request is missing a valid API key" }` → API key not set
- `"error": { "code": 403, "message": "Custom Search API has not been used" }` → Enable the API
- `"error": { "code": 429, "message": "Quota exceeded" }` → You've hit the 100/day limit

**If you see `hasItems: false`**, the API is working but returning no results:
- Check that "Image search" is enabled in your Custom Search Engine
- Try enabling "Search the entire web" in the search engine settings
- Verify the search query makes sense (check the `query` field in logs)

### Step 4: Check Image Embedding

Even if images are fetched, they might fail to embed. Look for:

**In DOCX:**
```
Failed to embed image from https://...: HTTP 403: Forbidden
```

**In PDF:**
```
Failed to embed image from google: Error: ...
```

Common embedding failures:
- **403 Forbidden**: Image URL requires authentication or blocks bots
- **Timeout**: Image took >5 seconds to download
- **Too large**: Image is >5MB
- **Invalid format**: Image isn't a valid image file

### Step 5: Test API Directly

Test your Google API credentials with curl:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=2020+Toyota+Camry+car&searchType=image&num=5"
```

Expected response:
```json
{
  "items": [
    {
      "title": "2020 Toyota Camry",
      "link": "https://example.com/image.jpg",
      "image": {
        "contextLink": "https://example.com",
        "height": 480,
        "width": 640
      }
    }
  ]
}
```

Error response:
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "errors": [...]
  }
}
```

## Common Issues & Solutions

### Issue 1: No logs at all
**Problem**: You don't see any image search logs
**Solution**: 
- Verify the code was deployed to Railway
- Check that you're looking at the latest deployment logs
- Make sure you're triggering a NEW payment (not an old cached one)

### Issue 2: "Google Search API credentials not configured"
**Problem**: Logs show `hasApiKey: false` or `hasSearchEngineId: false`
**Solution**:
1. Go to Railway → Your Service → Variables
2. Add both variables:
   ```
   GOOGLE_SEARCH_API_KEY=AIza...
   GOOGLE_SEARCH_ENGINE_ID=017576662512468239146:...
   ```
3. Redeploy the service
4. Wait for deployment to complete
5. Try again

### Issue 3: "API key not valid"
**Problem**: Google API returns 400 or 403 error
**Solution**:
1. Verify API key is correct (copy-paste from Google Cloud Console)
2. Check that Custom Search API is enabled:
   - Go to https://console.cloud.google.com/apis/library
   - Search "Custom Search API"
   - Click "Enable"
3. Check API key restrictions:
   - Go to https://console.cloud.google.com/apis/credentials
   - Click your API key
   - Under "API restrictions", ensure "Custom Search API" is allowed

### Issue 4: "No items in Google Search response"
**Problem**: API works but returns no images
**Solution**:
1. Go to https://programmablesearchengine.google.com/
2. Click your search engine
3. Go to "Setup" → "Basics"
4. **Enable "Image search"** (toggle to ON) ← CRITICAL
5. Enable "Search the entire web" (toggle to ON)
6. Save changes
7. Try again

### Issue 5: Images fetched but not showing in reports
**Problem**: Logs show images found, but reports don't have them
**Solution**:
1. Check for embedding errors in logs:
   ```
   Failed to embed image from https://...: ...
   ```
2. If all images fail to embed:
   - Images might be behind authentication
   - Images might be too large (>5MB)
   - Network issues between Railway and image hosts
3. Try with a different vehicle (some vehicles have better image availability)

### Issue 6: Only placeholder images
**Problem**: All images are placeholders (SVG silhouettes)
**Solution**:
- This means NO images were successfully fetched from any source
- Check Google API logs (see Issue 2-4 above)
- Check DuckDuckGo logs (should work without API key)
- If both fail, there might be a network issue

### Issue 7: DuckDuckGo returns no images
**Problem**: DuckDuckGo logs show 0 images
**Solution**:
- DuckDuckGo's instant answer API doesn't always return images
- This is normal - it's a free service with limited image results
- Google Custom Search is more reliable for images
- Placeholder will be used as fallback

## Quick Checklist

- [ ] Environment variables set in Railway (GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID)
- [ ] Custom Search API enabled in Google Cloud Console
- [ ] API key has correct restrictions (allows Custom Search API)
- [ ] Search Engine has "Image search" enabled
- [ ] Search Engine has "Search the entire web" enabled (optional but recommended)
- [ ] Latest code deployed to Railway
- [ ] Testing with a NEW payment (not cached)
- [ ] Checking Railway logs for detailed error messages

## Test Command

Run this in your terminal to test the API:

```bash
# Replace with your actual credentials
API_KEY="AIza..."
SEARCH_ENGINE_ID="017576662512468239146:..."

curl "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=2020+Toyota+Camry+car&searchType=image&num=5" | jq
```

If this works, your API is configured correctly and the issue is elsewhere.

## Next Steps

1. **Deploy the updated code** with enhanced logging
2. **Make a test payment** on Railway
3. **Check the logs** for the detailed output
4. **Share the logs** with me if you still don't see images

The logs will tell us exactly what's happening at each step of the image search process.
