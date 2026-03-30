# Telegram Bot Setup Guide

## Step 1: Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Choose a name for your bot (e.g., "MotoCheck VIN Bot")
   - Choose a username (must end in 'bot', e.g., "motocheck_vin_bot")
4. BotFather will give you a **bot token** that looks like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. Copy this token - you'll need it for your `.env` file

## Step 2: Configure Your .env File

Update your `.env` file with the real bot token:

```env
# Replace with your actual bot token from BotFather
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"

# Generate a random secret token for webhook security (any random string)
TELEGRAM_SECRET_TOKEN="your_random_secret_here_use_openssl_rand_hex_32"

# Your production URL (update when deployed)
PUBLIC_BASE_URL="https://yourdomain.com"
```

To generate a secure secret token, run:
```bash
openssl rand -hex 32
```

## Step 3: Set Up the Webhook

Once your app is deployed and accessible via HTTPS, you need to tell Telegram where to send updates.

### Option A: Using curl (Recommended)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/webhook/telegram",
    "secret_token": "your_random_secret_here"
  }'
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `https://yourdomain.com` with your actual domain
- `your_random_secret_here` with your TELEGRAM_SECRET_TOKEN

### Option B: Using a browser

Visit this URL in your browser (replace the placeholders):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/webhook/telegram&secret_token=your_random_secret_here
```

### Verify Webhook is Set

Check your webhook status:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/api/webhook/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Step 4: Test Your Bot

1. Open Telegram and search for your bot username (e.g., @motocheck_vin_bot)
2. Start a chat with `/start`
3. Send a test VIN: `1HGBH41JXMN109186`
4. The bot should respond with vehicle details

## Troubleshooting

### Bot doesn't respond

1. **Check webhook is set correctly:**
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

2. **Check your server logs** for incoming webhook requests

3. **Verify your PUBLIC_BASE_URL** is correct and accessible via HTTPS

4. **Test webhook endpoint manually:**
   ```bash
   curl -X POST "https://yourdomain.com/api/webhook/telegram" \
     -H "Content-Type: application/json" \
     -H "x-telegram-bot-api-secret-token: your_secret_token" \
     -d '{"update_id":1,"message":{"message_id":1,"from":{"id":123,"is_bot":false,"first_name":"Test"},"chat":{"id":123,"type":"private"},"date":1234567890,"text":"/start"}}'
   ```

### Webhook returns 401 Unauthorized

- Your `TELEGRAM_SECRET_TOKEN` in `.env` doesn't match the one you set in the webhook
- Update the webhook with the correct secret token

### Bot responds but VIN check fails

- Check your `DATABASE_URL` is correct
- Verify NHTSA API is accessible
- Check server logs for specific errors

## Local Development

For local development, you can't use webhooks (Telegram needs HTTPS). Instead:

1. **Use polling mode** (create a separate script):
   ```typescript
   // dev-bot.ts
   import { bot } from './telegram-bot';
   
   bot.launch();
   console.log('Bot started in polling mode');
   
   process.once('SIGINT', () => bot.stop('SIGINT'));
   process.once('SIGTERM', () => bot.stop('SIGTERM'));
   ```

2. **Run it:**
   ```bash
   tsx dev-bot.ts
   ```

3. **Or use ngrok** to expose your local server:
   ```bash
   ngrok http 5173
   ```
   Then set the webhook to your ngrok URL.

## Production Checklist

- [ ] Real bot token from BotFather in `.env`
- [ ] Secure random TELEGRAM_SECRET_TOKEN generated
- [ ] PUBLIC_BASE_URL set to production domain
- [ ] Webhook configured via Telegram API
- [ ] Webhook verified with getWebhookInfo
- [ ] Test bot responds to /start
- [ ] Test VIN check works
- [ ] Payment flow tested end-to-end

## Webhook URL

Your webhook endpoint is:
```
https://yourdomain.com/api/webhook/telegram
```

This endpoint:
- Accepts POST requests from Telegram
- Validates the secret token
- Processes bot updates
- Returns 200 OK to acknowledge receipt
