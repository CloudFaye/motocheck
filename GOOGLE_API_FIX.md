# Fix Google Custom Search API - Step by Step

## The Problem

Your logs show:
```
"error": {
  "code": 403,
  "message": "This project does not have the access to Custom Search JSON API.",
  "reason": "forbidden"
}
```

This means the API is not enabled in your Google Cloud project.

## Solution: Enable the API

### Step 1: Go to Google Cloud Console

1. Open https://console.cloud.google.com/apis/library
2. Make sure you're in the correct project (check the project dropdown at the top)

### Step 2: Enable Custom Search API

1. In the search box, type: **Custom Search API**
2. Click on **"Custom Search API"** in the results
3. Click the blue **"ENABLE"** button
4. Wait for it to enable (takes 5-10 seconds)

### Step 3: Verify Your API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your API key in the list
3. Click on it to edit
4. Under **"API restrictions"**, make sure it says:
   - Either **"Don't restrict key"** (easiest for testing)
   - OR **"Restrict key"** with **"Custom Search API"** in the allowed list

### Step 4: Test the API

Run this command in your terminal (replace with your actual credentials):

```bash
API_KEY="YOUR_API_KEY_HERE"
SEARCH_ENGINE_ID="YOUR_SEARCH_ENGINE_ID_HERE"

curl "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=2024+Toyota+Crown+car&searchType=image&num=5"
```

**Expected response:**
```json
{
  "items": [
    {
      "title": "2024 Toyota Crown",
      "link": "https://example.com/image.jpg",
      ...
    }
  ]
}
```

**If you see an error**, check:
- API key is correct (copy-paste from Google Cloud Console)
- Search Engine ID is correct (copy-paste from Programmable Search Engine)
- Custom Search API is enabled (see Step 2)

### Step 5: Redeploy to Railway

After enabling the API:
1. No need to change environment variables (they're already set)
2. Just redeploy your Railway service (or it will auto-deploy if connected to GitHub)
3. Wait for deployment to complete
4. Test with a new payment

## What Will Happen After Fix

Once the API is enabled, your logs will show:
```
🔍 Google Search API response: { hasItems: true, itemCount: 5, hasError: false }
✅ Google Search returned 5 images
📊 Total images collected: 5
✅ Returning 5 images (sources: google, google, google, google, google)
```

And your reports will have real vehicle images instead of "No vehicle images available".

## Alternative: Use Without Google API

If you don't want to use Google API (to avoid quotas/costs), the system will:
1. Try DuckDuckGo (free, no API key)
2. Fall back to "No vehicle images available" message

DuckDuckGo rarely returns images for vehicles, so Google API is recommended for best results.

## Cost Considerations

- **Free tier**: 100 queries per day
- **Paid tier**: $5 per 1,000 queries after free tier
- **Your usage**: ~1 query per report = 100 free reports per day

If you generate more than 100 reports per day, you'll start paying $0.005 per report for images.

## Summary

**Quick fix:**
1. Go to https://console.cloud.google.com/apis/library
2. Search "Custom Search API"
3. Click "ENABLE"
4. Test with a new payment

That's it! No code changes needed.
