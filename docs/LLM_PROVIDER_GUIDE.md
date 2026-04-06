# LLM Provider Configuration Guide

The vehicle history platform supports multiple LLM providers with easy switching via environment variables.

## Supported Providers

### 1. Google Gemini (Default)
- **Status**: Free tier available
- **Best for**: Testing, development, small-scale production
- **Setup**: See [GEMINI_SETUP.md](./GEMINI_SETUP.md)

### 2. Anthropic Claude
- **Status**: Paid only
- **Best for**: High-volume production, enterprise use
- **Setup**: Get API key from https://console.anthropic.com/

## Quick Start

### Using Gemini (Free)

```bash
# Railway Environment Variables
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash  # optional, this is the default
```

### Using Anthropic (Paid)

```bash
# Railway Environment Variables
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # optional, this is the default
```

## Switching Providers

To switch from Gemini to Anthropic (or vice versa):

1. Update `LLM_PROVIDER` environment variable in Railway
2. Ensure the corresponding API key is set
3. Railway will automatically redeploy
4. Verify in logs that the new provider is being used

## How It Works

The platform uses a unified LLM service (`src/lib/server/llm/index.ts`) that:

1. Reads `LLM_PROVIDER` environment variable
2. Initializes the appropriate client (Gemini or Anthropic)
3. Provides a consistent interface for both workers:
   - `llm-analyze.ts` - Analyzes vehicle timeline
   - `llm-write-sections.ts` - Writes 9 report sections

## Provider Comparison

| Feature | Gemini Free | Gemini Paid | Anthropic |
|---------|-------------|-------------|-----------|
| **Cost** | Free | $0.075-0.30/1M tokens | $3-15/1M tokens |
| **Daily Limit** | 1,500 requests | Unlimited | Unlimited |
| **Rate Limit** | 15 RPM | Higher | 50 RPM |
| **Quality** | Excellent | Excellent | Excellent |
| **JSON Support** | ✅ Native | ✅ Native | ✅ Native |
| **Timeout Handling** | ✅ 60s | ✅ 60s | ✅ 60s |
| **Retry Logic** | ✅ Auto | ✅ Auto | ✅ Auto |

## Model Options

### Gemini Models

```bash
# Fast, recommended for production (default)
GEMINI_MODEL=gemini-2.5-flash

# Higher quality, slower
GEMINI_MODEL=gemini-1.5-pro
```

### Anthropic Models

```bash
# Latest Sonnet model (default)
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Other options
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Monitoring Provider Usage

### Check Current Provider

Worker logs will show which provider is being used:

```
[llm-analyze] Using gemini (gemini-2.5-flash) for VIN: XXXXX
[llm-write-sections] Section generated: summary using gemini (gemini-2.5-flash)
```

### Token Usage

Both providers log token usage:

```
[llm-analyze] Analysis completed for VIN: XXXXX using gemini
[llm-analyze] Tokens used: 1234
```

### Cost Tracking

For paid providers, monitor costs in:
- **Gemini**: Google Cloud Console
- **Anthropic**: Anthropic Console

## Error Handling

The unified LLM service handles:

### Timeout Errors
- Default: 60 seconds per request
- Automatically retried by pg-boss (3 attempts)
- Exponential backoff between retries

### Rate Limiting
- Gemini: Handles 429 errors with retry
- Anthropic: Handles 429 errors with Retry-After header
- Both: Exponential backoff

### API Key Errors
- Clear error messages in logs
- Worker fails gracefully
- Report marked as failed with error message

## Testing Provider Switch

### Test Gemini

```bash
# Set environment variables
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Deploy and test
pnpm test:vin WBXHT3Z34G4A47548

# Check logs for "Using gemini"
```

### Test Anthropic

```bash
# Set environment variables
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key

# Deploy and test
pnpm test:vin WBXHT3Z34G4A47548

# Check logs for "Using anthropic"
```

## Best Practices

### Development
1. Use Gemini free tier for development
2. Test with multiple VINs to verify quality
3. Monitor token usage patterns

### Staging
1. Use Gemini free tier or paid tier
2. Test with production-like data volume
3. Verify rate limits are sufficient

### Production
1. Start with Gemini free tier
2. Monitor daily usage and rate limits
3. Upgrade to paid Gemini or switch to Anthropic when needed
4. Implement caching to reduce API calls

## Troubleshooting

### Provider Not Switching

**Symptoms**: Logs still show old provider after changing `LLM_PROVIDER`

**Solutions**:
1. Verify environment variable is set in Railway
2. Check both web app and worker services have the variable
3. Manually trigger a redeploy
4. Check for typos in provider name (must be lowercase)

### API Key Not Working

**Symptoms**: "API key not configured" error

**Solutions**:
1. Verify API key is copied correctly (no spaces)
2. Check the key is valid in provider console
3. Ensure `LLM_PROVIDER` matches the API key provider
4. Regenerate API key if needed

### Quality Issues

**Symptoms**: Poor analysis or section quality

**Solutions**:
1. Try different model (e.g., gemini-1.5-pro instead of flash)
2. Check if prompts need adjustment for provider
3. Verify timeline data is complete
4. Test with known-good VINs

### Rate Limit Errors

**Symptoms**: "Rate limit exceeded" in logs

**Solutions**:
1. Reduce worker concurrency
2. Upgrade to paid tier
3. Implement request throttling
4. Cache completed reports

## Advanced Configuration

### Custom Timeout

```typescript
// In worker code
const response = await generateText(messages, {
  maxTokens: 2000,
  temperature: 0.7,
  timeout: 120000, // 2 minutes
});
```

### Custom Temperature

```typescript
// More creative responses
temperature: 0.9

// More deterministic responses
temperature: 0.3
```

### Custom Max Tokens

```typescript
// Longer responses
maxTokens: 4000

// Shorter responses
maxTokens: 500
```

## Migration Guide

### From Anthropic to Gemini

1. Get Gemini API key (see GEMINI_SETUP.md)
2. Update environment variables:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_key
   ```
3. Remove or keep `ANTHROPIC_API_KEY` (for easy switching back)
4. Deploy and test with sample VINs
5. Monitor quality and adjust model if needed

### From Gemini to Anthropic

1. Get Anthropic API key
2. Update environment variables:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your_key
   ```
3. Keep `GEMINI_API_KEY` (for easy switching back)
4. Deploy and test
5. Monitor costs in Anthropic console

## Support

### Provider-Specific Issues
- **Gemini**: https://ai.google.dev/docs
- **Anthropic**: https://docs.anthropic.com/

### Application Issues
- Check worker logs for detailed errors
- Verify environment variables are correct
- Test with the test-vin script
- Review this guide for common solutions

## Future Providers

The unified LLM service is designed to support additional providers. To add a new provider:

1. Install provider SDK
2. Add provider logic to `src/lib/server/llm/index.ts`
3. Update environment variable documentation
4. Test thoroughly with sample VINs

Potential future providers:
- OpenAI GPT-4
- Groq (Llama models)
- Together AI
- Local models (Ollama)
