# Google Gemini API Setup Guide

This guide will help you get a free Google Gemini API key for the vehicle history platform.

## Why Gemini?

- **Free Tier**: 15 requests/minute, 1 million tokens/day, 1500 requests/day
- **High Quality**: Excellent for structured analysis and JSON output
- **No Credit Card**: Free tier doesn't require payment information
- **Fast**: Quick response times for analysis tasks

## Getting Your API Key

### Step 1: Go to Google AI Studio

Visit: https://makersuite.google.com/app/apikey

### Step 2: Sign In

- Sign in with your Google account
- If you don't have one, create a free Google account

### Step 3: Create API Key

1. Click "Get API Key" or "Create API Key"
2. Select "Create API key in new project" (recommended)
3. Copy the generated API key

### Step 4: Configure in Railway

1. Go to your Railway project
2. Select your web app service
3. Go to "Variables" tab
4. Add these environment variables:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   ```
5. Repeat for your worker service

### Step 5: Deploy

- Railway will automatically redeploy with the new environment variables
- Check logs to confirm Gemini is being used

## Verifying Setup

After deployment, check the worker logs for:

```
[llm-analyze] Using gemini (gemini-1.5-flash) for VIN: XXXXX
[llm-write-sections] Section generated: summary using gemini (gemini-1.5-flash)
```

## Free Tier Limits

### Daily Limits
- **Requests**: 1,500 per day
- **Tokens**: 1,000,000 per day
- **Rate**: 15 requests per minute

### What This Means
- Each vehicle report uses approximately 10-15 requests (1 analysis + 9 sections)
- You can generate **100-150 reports per day** on the free tier
- Perfect for testing and small-scale production use

## Upgrading to Paid

If you need more capacity:

1. Go to Google Cloud Console
2. Enable billing for your project
3. Gemini pricing is very competitive:
   - Input: $0.075 per 1M tokens
   - Output: $0.30 per 1M tokens

## Switching to Anthropic

If you prefer to use Claude instead:

1. Get an Anthropic API key from: https://console.anthropic.com/
2. Update environment variables:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```
3. Redeploy

## Model Options

### Gemini Models

**gemini-1.5-flash** (default, recommended)
- Fastest responses
- Best for production use
- Free tier: 15 RPM, 1M tokens/day

**gemini-1.5-pro**
- Higher quality analysis
- Slower responses
- Free tier: 2 RPM, 50 requests/day

To change model:
```
GEMINI_MODEL=gemini-1.5-pro
```

### Anthropic Models

**claude-sonnet-4-20250514** (default)
- High quality analysis
- Paid only ($3/$15 per 1M tokens)

## Troubleshooting

### "API key not configured" Error

Check that:
1. `GEMINI_API_KEY` is set in Railway environment variables
2. `LLM_PROVIDER` is set to `gemini`
3. Both web app and worker services have the variables
4. Services have been redeployed after adding variables

### "Rate limit exceeded" Error

You've hit the free tier limits:
- Wait for the rate limit to reset (1 minute for RPM, 24 hours for daily)
- Upgrade to paid tier for higher limits
- Reduce concurrent worker instances

### "Invalid API key" Error

- Verify the API key is copied correctly (no extra spaces)
- Check the key hasn't been revoked in Google AI Studio
- Generate a new API key if needed

## Best Practices

### For Development
- Use `gemini-1.5-flash` for fast iteration
- Monitor usage in Google AI Studio dashboard
- Test with a few VINs before bulk processing

### For Production
- Start with free tier to validate
- Monitor daily usage patterns
- Upgrade to paid when approaching limits
- Consider caching report results to reduce API calls

### Cost Optimization
- Cache completed reports (already implemented)
- Don't regenerate reports unnecessarily
- Use `gemini-1.5-flash` instead of `pro` for most cases
- Monitor token usage in logs

## Support

### Google AI Studio
- Documentation: https://ai.google.dev/docs
- Community: https://discuss.ai.google.dev/

### Application Issues
- Check worker logs for detailed error messages
- Verify environment variables are set correctly
- Test with a single VIN first

## Security

### API Key Protection
- Never commit API keys to git
- Use Railway's environment variable management
- Rotate keys regularly
- Restrict API key usage in Google Cloud Console if needed

### Rate Limiting
- The application handles rate limits automatically
- Failed requests are retried with exponential backoff
- Monitor logs for rate limit warnings

## Comparison: Gemini vs Anthropic

| Feature | Gemini (Free) | Anthropic (Paid) |
|---------|---------------|------------------|
| Cost | Free | $3-15 per 1M tokens |
| Daily Limit | 1,500 requests | No limit |
| Rate Limit | 15 RPM | 50 RPM |
| Quality | Excellent | Excellent |
| Speed | Fast | Fast |
| JSON Support | Native | Native |
| Best For | Testing, small-scale | Production, high-volume |

## Conclusion

Google Gemini provides an excellent free tier for testing and small-scale production use. Start with Gemini, monitor your usage, and upgrade to paid Gemini or switch to Anthropic when you need higher capacity.
