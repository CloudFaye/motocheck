# MotoCheck Setup Guide

## 1. Cloudflare R2 Storage Setup

You've already created the bucket "motocheck" and generated an API token. Here's what you need:

### Finding Your R2 Credentials:

1. **R2_BUCKET_NAME**: `motocheck` (you already have this)

2. **R2_ENDPOINT**: 
   - Go to Cloudflare Dashboard → R2
   - Look for your Account ID (usually shown in the URL or sidebar)
   - Format: `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
   - Example: `https://abc123def456.r2.cloudflarestorage.com`

3. **R2_ACCESS_KEY_ID** and **R2_SECRET_ACCESS_KEY**:
   - These were shown when you generated the API token
   - If you didn't save them, you'll need to generate a new token:
     - Go to R2 → Manage R2 API Tokens
     - Click "Create API Token"
     - Select "Admin Read & Write" permissions
     - Copy both the Access Key ID and Secret Access Key immediately (they won't be shown again)

### Where to Find Account ID:
- In Cloudflare Dashboard, go to R2
- Your Account ID is visible in the URL: `dash.cloudflare.com/YOUR_ACCOUNT_ID/r2`
- Or check the R2 overview page - it's usually displayed there

---

## 2. Telegram Bot Setup

### Step 1: Create Your Bot with BotFather

1. Open Telegram on your Android
2. Search for `@BotFather` (official bot with blue checkmark)
3. Start a chat and send: `/newbot`
4. Follow the prompts:
   - **Bot name**: `MotoCheck VIN Bot` (or any name you like)
   - **Bot username**: Must end in "bot", e.g., `motocheck_vin_bot`

5. BotFather will give you a token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - This is your **TELEGRAM_BOT_TOKEN**

### Step 2: Configure Your Bot

Send these commands to @BotFather:

#### Set Description (shown in bot profile):
```
/setdescription
```
Then select your bot and paste:
```
Get instant vehicle import duty estimates for Nigeria. Send any 17-character VIN to receive detailed vehicle information and accurate customs duty calculations. Full PDF reports available for ₦5,000.
```

#### Set About Text (shown when users click "What can this bot do?"):
```
/setabouttext
```
Then select your bot and paste:
```
MotoCheck helps you calculate Nigerian customs import duties for vehicles. Simply send a VIN number to get instant estimates. Perfect for importers, dealers, and car buyers.
```

#### Set Bot Commands:
```
/setcommands
```
Then select your bot and paste:
```
start - Start the bot and see welcome message
check - Check a VIN number (usage: /check <VIN>)
help - Show help and instructions
about - Learn more about MotoCheck
```

#### Set Bot Picture (Optional):
```
/setuserpic
```
Then select your bot and upload a logo/icon for your bot

### Step 3: Get Your Bot Token

The token was provided when you created the bot. If you lost it:
1. Go to @BotFather
2. Send `/mybots`
3. Select your bot
4. Click "API Token"

### Step 4: Generate Secret Token

You already have this: `e7036d6e6e6221942ab75da4a6edeb585c8b080b9018501c164090d2cdf66092`

This is used to verify webhook requests from Telegram.

---

## 3. Railway Environment Variables

Add these to your Railway project:

```bash
# Database (Railway will provide this automatically if you add PostgreSQL)
DATABASE_URL=postgresql://...

# NHTSA API (already set)
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api

# Flutterwave (get from your Flutterwave dashboard)
FLW_PUBLIC_KEY=FLWPUBK-...
FLW_SECRET_KEY=FLWSECK-...
FLW_SECRET_HASH=your_webhook_secret_hash

# Resend Email (get from resend.com)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# Cloudflare R2 (from steps above)
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_from_cloudflare
R2_SECRET_ACCESS_KEY=your_secret_key_from_cloudflare
R2_BUCKET_NAME=motocheck

# Telegram Bot (from steps above)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_SECRET_TOKEN=e7036d6e6e6221942ab75da4a6edeb585c8b080b9018501c164090d2cdf66092

# Application URL (get from Railway after first deployment)
PUBLIC_BASE_URL=https://your-app.up.railway.app
```

---

## 4. Deployment Steps

### Add Environment Variables to Railway:

```bash
# Make sure you're in the right project
railway status

# Add each variable
railway variables set DATABASE_URL="postgresql://..."
railway variables set FLW_PUBLIC_KEY="FLWPUBK-..."
railway variables set FLW_SECRET_KEY="FLWSECK-..."
railway variables set FLW_SECRET_HASH="your_hash"
railway variables set RESEND_API_KEY="re_..."
railway variables set FROM_EMAIL="noreply@yourdomain.com"
railway variables set R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
railway variables set R2_ACCESS_KEY_ID="your_key"
railway variables set R2_SECRET_ACCESS_KEY="your_secret"
railway variables set R2_BUCKET_NAME="motocheck"
railway variables set TELEGRAM_BOT_TOKEN="your_token"
railway variables set TELEGRAM_SECRET_TOKEN="e7036d6e6e6221942ab75da4a6edeb585c8b080b9018501c164090d2cdf66092"
railway variables set NHTSA_API_URL="https://vpic.nhtsa.dot.gov/api"
```

### Get PUBLIC_BASE_URL:
After first deployment, Railway will give you a URL. Then set it:
```bash
railway variables set PUBLIC_BASE_URL="https://your-app.up.railway.app"
```

### Deploy:
```bash
railway up
```

---

## 5. Post-Deployment: Set Telegram Webhook

Once your app is deployed, you need to tell Telegram where to send updates:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.up.railway.app/api/webhook/telegram",
    "secret_token": "e7036d6e6e6221942ab75da4a6edeb585c8b080b9018501c164090d2cdf66092"
  }'
```

Replace `<YOUR_BOT_TOKEN>` and `your-app.up.railway.app` with your actual values.

---

## Troubleshooting

### If deployment fails with "Missing environment variables":
- Check all variables are set: `railway variables`
- Make sure there are no typos in variable names
- Ensure no variables have empty values

### If R2 storage fails:
- Verify your Account ID is correct in R2_ENDPOINT
- Check that API token has Read & Write permissions
- Confirm bucket name is exactly "motocheck"

### If Telegram bot doesn't respond:
- Verify webhook is set correctly
- Check bot token is valid
- Ensure PUBLIC_BASE_URL matches your Railway deployment URL
- Check Railway logs: `railway logs`

---

## Quick Checklist

- [ ] R2 bucket created: "motocheck"
- [ ] R2 API token generated with Admin Read & Write
- [ ] R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY saved
- [ ] Telegram bot created via @BotFather
- [ ] Bot description, about text, and commands configured
- [ ] TELEGRAM_BOT_TOKEN saved
- [ ] All environment variables added to Railway
- [ ] App deployed successfully
- [ ] PUBLIC_BASE_URL updated with Railway URL
- [ ] Telegram webhook configured
- [ ] Test bot by sending a VIN
