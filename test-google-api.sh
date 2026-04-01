#!/bin/bash

# Test Google Custom Search API
# Usage: ./test-google-api.sh

echo "🔍 Testing Google Custom Search API..."
echo ""

# Check if environment variables are set
if [ -z "$GOOGLE_SEARCH_API_KEY" ]; then
    echo "❌ GOOGLE_SEARCH_API_KEY is not set"
    echo "   Set it with: export GOOGLE_SEARCH_API_KEY='your_key_here'"
    exit 1
fi

if [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    echo "❌ GOOGLE_SEARCH_ENGINE_ID is not set"
    echo "   Set it with: export GOOGLE_SEARCH_ENGINE_ID='your_id_here'"
    exit 1
fi

echo "✅ Environment variables found:"
echo "   API Key: ${GOOGLE_SEARCH_API_KEY:0:10}... (${#GOOGLE_SEARCH_API_KEY} chars)"
echo "   Search Engine ID: ${GOOGLE_SEARCH_ENGINE_ID:0:20}... (${#GOOGLE_SEARCH_ENGINE_ID} chars)"
echo ""

# Test query
QUERY="2020 Toyota Camry car"
URL="https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${QUERY}&searchType=image&num=5"

echo "🔍 Testing query: $QUERY"
echo ""

# Make request
RESPONSE=$(curl -s "$URL")

# Check for error
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ API Error:"
    echo "$RESPONSE" | jq '.error'
    echo ""
    echo "Common fixes:"
    echo "  - Verify API key is correct"
    echo "  - Enable Custom Search API in Google Cloud Console"
    echo "  - Check API key restrictions allow Custom Search API"
    exit 1
fi

# Check for items
ITEM_COUNT=$(echo "$RESPONSE" | jq '.items | length')

if [ "$ITEM_COUNT" = "null" ] || [ "$ITEM_COUNT" = "0" ]; then
    echo "⚠️  API works but returned no images"
    echo ""
    echo "Possible fixes:"
    echo "  1. Enable 'Image search' in your Custom Search Engine settings"
    echo "  2. Enable 'Search the entire web' in your Custom Search Engine"
    echo "  3. Try a different search query"
    echo ""
    echo "Full response:"
    echo "$RESPONSE" | jq
    exit 1
fi

echo "✅ Success! Found $ITEM_COUNT images"
echo ""
echo "Image URLs:"
echo "$RESPONSE" | jq -r '.items[].link'
echo ""
echo "🎉 Your Google Custom Search API is working correctly!"
