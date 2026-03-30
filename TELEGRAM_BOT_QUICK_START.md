# Telegram Bot Quick Start

## Summary of Changes

I've fixed the Telegram bot implementation and created the necessary files:

1. ✅ Fixed bot imports (was using wrong decoder)
2. ✅ Created `telegram-bot.ts` at root (export file)
3. ✅ Created `dev-bot.ts` for local testing
4. ✅ Created comprehensive setup guide
5. ✅ Removed security-sensitive console.logs

## What You Need to Do

### 1. Get Your Bot Token from BotFather

```
1. Open Telegram
2. Search for @BotFather
3. Send: /newbot
4. Follow prompts to create your bot
5. Copy the token (looks like: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)
```

### 2. Update Your .env File

```env
# Replace these test values with real ones:
TELEGRAM_BOT_TOKEN="YOUR_REAL_TOKEN_FROM_BOTFATHER"
TELEGRAM_SECRET_TOKEN="$(openssl rand -hex 32)"  # Generate a random secret
PUBLIC_BASE_URL="https://yourdomain.com"  # Your production URL
```

### 3. Test Locally (Development)

```bash
# Run the bot in polling mode for local testing
tsx dev-bot.ts
```

Then open Telegram and message your bot. It should respond!

### 4. Set Up Webhook (Production)

Once deployed to production with HTTPS:

```bash
# Set the webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/webhook/telegram",
    "secret_token": "YOUR_TELEGRAM_SECRET_TOKEN"
  }'

# Verify it worked
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Your Webhook Endpoint

```
POST https://yourdomain.com/api/webhook/telegram
```

This endpoint:
- Validates the secret token
- Processes bot updates
- Handles VIN checks
- Manages payment flows

## Testing the Bot

Send these messages to your bot:

1. `/start` - Should show welcome message
2. `/help` - Should show help text
3. `1HGBH41JXMN109186` - Should decode VIN and show vehicle details
4. `/check 1HGBH41JXMN109186` - Same as above

## Troubleshooting

### Bot doesn't respond locally

- Check `TELEGRAM_BOT_TOKEN` in `.env` is correct
- Make sure `tsx dev-bot.ts` is running
- Check for errors in the console

### Bot doesn't respond in production

- Verify webhook is set: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
- Check `PUBLIC_BASE_URL` is correct in `.env`
- Verify `TELEGRAM_SECRET_TOKEN` matches in both `.env` and webhook config
- Check server logs for incoming requests

### VIN check fails

- Verify database is accessible
- Check NHTSA API is reachable
- Look at server logs for specific errors

## Files Created/Modified

- `telegram-bot.ts` - Export file at root
- `dev-bot.ts` - Local development script
- `src/telegram-bot/index.ts` - Fixed imports and data structure
- `TELEGRAM_BOT_SETUP.md` - Comprehensive setup guide
- `TELEGRAM_BOT_QUICK_START.md` - This file

## Security Improvements

- Removed all console.log statements that could leak sensitive data
- Removed email addresses from logs
- Removed error details from client responses
- Server-side logs only (not exposed to clients)

## Next Steps

1. Get bot token from BotFather
2. Update `.env` with real credentials
3. Test locally with `tsx dev-bot.ts`
4. Deploy to production
5. Set webhook
6. Test end-to-end flow

See `TELEGRAM_BOT_SETUP.md` for detailed instructions!
