# Google API 403 Error - Advanced Troubleshooting

## Your Current Error

```json
{
  "error": {
    "code": 403,
    "message": "This project does not have the access to Custom Search JSON API.",
    "reason": "forbidden"
  }
}
```

This error means the API is either:
1. Not enabled in the correct project
2. API key is from a different project
3. Billing is not enabled (required even for free tier)

## Step-by-Step Fix

### 1. Verify You're in the Correct Project

1. Go to https://console.cloud.google.com/
2. Look at the top bar - you'll see the project name dropdown
3. **Make sure you're in the same project where you created the API key**
4. Note the project ID (you'll need this)

### 2. Enable Billing (Required!)

Even for the free tier, Google requires billing to be enabled:

1. Go to https://console.cloud.google.com/billing
2. If you see "This project has no billing account", click "Link a billing account"
3. Create a new billing account (requires credit card, but won't charge for free tier)
4. Link it to your project
5. **Important**: Set up budget alerts to avoid unexpected charges:
   - Go to https://console.cloud.google.com/billing/budgets
   - Create budget: $5/month
   - Set alert at 50%, 90%, 100%

### 3. Enable the Custom Search API

1. Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. **Make sure you're in the correct project** (check top bar)
3. Click "ENABLE"
4. Wait 30 seconds for it to propagate

### 4. Verify API Key is in the Same Project

1. Go to https://console.cloud.google.com/apis/credentials
2. **Check the project name at the top**
3. Find your API key in the list
4. If you don't see it, you're in the wrong project OR you need to create a new key

### 5. Check API Key Restrictions

1. Click on your API key to edit it
2. Under "Application restrictions":
   - Select "None" (for testing)
   - Or select "IP addresses" and add your Railway server IPs
3. Under "API restrictions":
   - Select "Restrict key"
   - Check "Custom Search API" in the list
   - Click "Save"

### 6. Test the API Key

Run this command with your credentials:

```bash
API_KEY="YOUR_API_KEY"
SEARCH_ENGINE_ID="YOUR_SEARCH_ENGINE_ID"

curl -v "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=test&searchType=image&num=1"
```

**Look for these in the response:**

✅ **Success** (200 OK):
```json
{
  "items": [...]
}
```

❌ **API not enabled** (403):
```json
{
  "error": {
    "code": 403,
    "message": "This project does not have the access to Custom Search JSON API."
  }
}
```

❌ **Billing not enabled** (403):
```json
{
  "error": {
    "code": 403,
    "message": "The request is missing a valid API key."
  }
}
```

❌ **Invalid API key** (400):
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key."
  }
}
```

### 7. Create a New API Key (If Needed)

If your API key is from a different project:

1. Go to https://console.cloud.google.com/apis/credentials
2. **Make sure you're in the project where Custom Search API is enabled**
3. Click "Create Credentials" → "API Key"
4. Copy the new API key
5. Update Railway environment variables:
   ```
   GOOGLE_SEARCH_API_KEY=your_new_api_key_here
   ```
6. Redeploy

### 8. Verify Search Engine ID

1. Go to https://programmablesearchengine.google.com/
2. Click on your search engine
3. Go to "Setup" → "Basics"
4. Copy the "Search engine ID" (starts with a long string of numbers and letters)
5. Verify it matches your Railway environment variable

## Common Mistakes

### Mistake 1: API Enabled in Wrong Project
- **Problem**: You have multiple Google Cloud projects
- **Solution**: Make sure API key and API enablement are in the SAME project

### Mistake 2: No Billing Account
- **Problem**: Even free tier requires billing to be enabled
- **Solution**: Add a credit card (won't be charged for free tier usage)

### Mistake 3: API Key from Different Project
- **Problem**: API key was created in Project A, but API is enabled in Project B
- **Solution**: Create a new API key in the project where the API is enabled

### Mistake 4: Wrong Search Engine ID
- **Problem**: Using the wrong cx parameter
- **Solution**: Copy the exact Search engine ID from Programmable Search Engine console

## Alternative: Create Everything from Scratch

If you're still stuck, start fresh:

### Step 1: Create New Project
1. Go to https://console.cloud.google.com/
2. Click project dropdown → "New Project"
3. Name it "MotoCheck-Images"
4. Click "Create"

### Step 2: Enable Billing
1. Go to https://console.cloud.google.com/billing
2. Link a billing account
3. Set up budget alerts ($5/month)

### Step 3: Enable API
1. Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Click "ENABLE"

### Step 4: Create API Key
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Click "Restrict Key"
5. Under "API restrictions", select "Custom Search API"
6. Save

### Step 5: Create Search Engine
1. Go to https://programmablesearchengine.google.com/
2. Click "Add"
3. Name: "Vehicle Images"
4. Search: "Search the entire web"
5. Enable "Image search"
6. Create
7. Copy the Search engine ID

### Step 6: Update Railway
```
GOOGLE_SEARCH_API_KEY=your_new_api_key
GOOGLE_SEARCH_ENGINE_ID=your_new_search_engine_id
```

### Step 7: Test
```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_CX&q=2024+Toyota+Crown&searchType=image&num=1"
```

## Still Not Working?

If you've tried everything above and it's still not working, you have two options:

### Option 1: Use Without Google API
The system will fall back to:
- DuckDuckGo (free, no API key, but rarely returns vehicle images)
- "No vehicle images available" message in reports

### Option 2: Share Your Error
Run this and share the output:

```bash
# Test API
curl -v "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_CX&q=test&searchType=image&num=1" 2>&1 | grep -A 20 "< HTTP"

# Check project
gcloud config get-value project

# Check enabled APIs
gcloud services list --enabled | grep custom
```

## Cost Monitoring

Once it's working, monitor your usage:

1. Go to https://console.cloud.google.com/apis/api/customsearch.googleapis.com/metrics
2. Check daily queries
3. Free tier: 100 queries/day
4. After that: $5 per 1,000 queries

Set up alerts:
1. Go to https://console.cloud.google.com/billing/budgets
2. Create budget: $10/month
3. Alert at 50%, 90%, 100%

## Summary

The most common cause of this error is:
1. **Billing not enabled** (even for free tier)
2. **API key from different project** than where API is enabled
3. **API not actually enabled** (check in the correct project)

Follow the "Create Everything from Scratch" section if you're still stuck.
