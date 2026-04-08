# LLM Provider Guide

This application supports multiple LLM providers for vehicle history analysis and report generation. You can easily switch between providers by changing environment variables.

## 🆓 Completely Free Options (No Billing Required)

### OpenRouter Free Models
OpenRouter provides access to several free models without requiring billing setup:

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_free_api_key  # Get from https://openrouter.ai/keys
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

**Available Free Models:**
- `meta-llama/llama-3.1-8b-instruct:free` - Good quality, reliable (recommended)
- `mistralai/mistral-7b-instruct:free` - Fast, decent quality
- `google/gemini-2.0-flash-exp:free` - Gemini via OpenRouter (no quota limits!)
- `qwen/qwen-2-7b-instruct:free` - Alternative option

**Advantages:**
- ✅ No billing setup required
- ✅ No daily quota limits
- ✅ No credit card needed
- ✅ Good quality for production use
- ✅ Multiple model options

**Setup Steps:**
1. Go to https://openrouter.ai/keys
2. Sign up with email (no credit card required)
3. Create an API key
4. Set environment variables as shown above

## Supported Providers

### 1. Google Gemini (Default)
- **Model**: `gemini-2.5-flash` (default), `gemini-2.5-pro`
- **Cost**: Free tier available (20 requests/day per model) ⚠️ Limited
- **Best for**: Testing only (quota too low for production)
- **Setup**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

⚠️ **Note**: Gemini free tier has strict daily limits (20 requests/day). Not recommended for production.

### 2. OpenAI
- **Model**: `gpt-4o-mini` (default), `gpt-4o`, `gpt-4-turbo`
- **Cost**: Pay-as-you-go (gpt-4o-mini is very affordable: ~$0.15/$0.60 per 1M tokens)
- **Best for**: Production with consistent quality
- **Setup**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

### 3. OpenRouter
- **Model**: `meta-llama/llama-3.1-8b-instruct:free` (default), many others
- **Cost**: 🆓 Free models available (NO billing required), paid models from $0.06 per 1M tokens
- **Best for**: Production without billing, access to open-source models
- **Setup**: Get API key from [OpenRouter](https://openrouter.ai/keys) - No credit card needed!

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

**Popular Free OpenRouter Models:**
- `meta-llama/llama-3.1-8b-instruct:free` - Best free option, good quality
- `google/gemini-2.0-flash-exp:free` - Gemini without quota limits
- `mistralai/mistral-7b-instruct:free` - Fast alternative
- `qwen/qwen-2-7b-instruct:free` - Another solid option

✅ **Recommended for production without billing setup**

### 4. Anthropic Claude
- **Model**: `claude-sonnet-4-20250514` (default)
- **Cost**: Pay-as-you-go (~$3/$15 per 1M tokens)
- **Best for**: High-quality analysis, complex reasoning
- **Setup**: Get API key from [Anthropic Console](https://console.anthropic.com/)

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

## Recommended Setup by Use Case

### Development & Testing (100% Free)
**Recommended**: OpenRouter with free Llama model
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key  # No credit card required!
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```
- ✅ No billing setup needed
- ✅ No quota limits
- ✅ Good quality
- ✅ Multiple free models to choose from

### Small Production (<100 reports/day) - Free Option
**Recommended**: OpenRouter with free models
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```
- ✅ Completely free
- ✅ No daily limits
- ✅ Production-ready quality

### Small Production (<100 reports/day) - Paid Option
**Recommended**: OpenAI GPT-4o-mini
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```
- Very affordable (~$0.50-2/day for 100 reports)
- Consistent quality
- Reliable uptime

### Medium Production (100-1000 reports/day)
**Recommended**: OpenAI GPT-4o-mini or OpenRouter paid models
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```
- Cost: ~$5-20/day
- Fast responses
- Production-ready

### Large Production (1000+ reports/day)
**Recommended**: OpenAI GPT-4o-mini with rate limiting
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```
- Consider batch processing
- Monitor costs
- Implement caching

## Cost Comparison (per 1M tokens)

| Provider | Model | Input | Output | Total (avg) | Billing Required |
|----------|-------|-------|--------|-------------|------------------|
| OpenRouter | llama-3.1-8b:free | Free | Free | Free | ❌ No |
| OpenRouter | gemini-2.0-flash:free | Free | Free | Free | ❌ No |
| OpenRouter | mistral-7b:free | Free | Free | Free | ❌ No |
| Gemini | gemini-2.5-flash | Free* | Free* | Free* | ❌ No |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 | ~$0.40 | ✅ Yes |
| OpenRouter | llama-3.1-70b | $0.35 | $0.40 | ~$0.38 | ✅ Yes |
| Anthropic | claude-sonnet-4 | $3.00 | $15.00 | ~$9.00 | ✅ Yes |

*Gemini free tier has strict daily limits (20 requests/day for gemini-2.5-flash)

**Best Free Option**: OpenRouter with `meta-llama/llama-3.1-8b-instruct:free` - No limits, no billing!

## Switching Providers

To switch providers, simply update your environment variables and restart the worker:

```bash
# Update .env file
LLM_PROVIDER=openai
OPENAI_API_KEY=your_new_key

# Restart workers
pnpm workers:prod
```

No code changes required!

## Troubleshooting

### Quota Exceeded (Gemini)
```
Error: [429 Too Many Requests] You exceeded your current quota
```
**Solution**: Switch to OpenAI or OpenRouter, or enable billing on Google Cloud

### Rate Limiting
All providers have rate limits. The application will automatically retry failed requests via the job queue.

### Model Not Found
```
Error: models/model-name is not found
```
**Solution**: Check the model name in your environment variables matches the provider's available models

## Testing Different Providers

You can test different providers locally:

```bash
# Test with OpenAI
LLM_PROVIDER=openai pnpm workers

# Test with OpenRouter
LLM_PROVIDER=openrouter pnpm workers

# Test with Gemini
LLM_PROVIDER=gemini pnpm workers
```

## Best Practices

1. **Start with free options** (OpenRouter free models) for development
2. **Use OpenAI gpt-4o-mini** for production (best cost/quality ratio)
3. **Monitor costs** via provider dashboards
4. **Set up billing alerts** to avoid surprises
5. **Cache results** to reduce API calls (already implemented)
6. **Use environment-specific configs** (dev vs production)
