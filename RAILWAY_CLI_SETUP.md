# Railway CLI Deployment Guide

This guide shows how to deploy the vehicle history platform using Railway CLI with two services: web app and workers.

## Prerequisites

1. Railway CLI installed: `npm i -g @railway/cli`
2. Railway account and project created
3. Logged in: `railway login`

## Current Setup

You currently have:
- ✅ Web app service (motocheck)
- ✅ PostgreSQL database
- ❌ Worker service (needs to be added)

## Step 1: Link to Your Project

```bash
# In your project directory
railway link

# Select your project (motocheck)
# Select your existing service
```

## Step 2: Add Worker Service

### Option A: Using Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click "New Service" or "+ New"
3. Select "Empty Service"
4. Name it: `motocheck-workers`
5. Connect to your GitHub repository
6. Set the same branch as your web app

### Option B: Using Railway CLI

```bash
# Create new service
railway service create motocheck-workers

# Link to the new service
railway service link motocheck-workers
```

## Step 3: Configure Worker Service

### Set Environment Variables

You need to set the same environment variables for the worker service. Here's how:

#### Using Railway Dashboard:

1. Go to `motocheck-workers` service
2. Click "Variables" tab
3. Add these variables:

```bash
# Required
DATABASE_URL=${{ Postgres.DATABASE_URL }}
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
NMVTIS_API_URL=your_nmvtis_url
NMVTIS_API_KEY=your_nmvtis_key
NODE_ENV=production

# Optional but recommended
NICB_API_KEY=your_nicb_key
GEMINI_MODEL=gemini-1.5-flash
WORKER_CONCURRENCY=5
SCRAPER_CONCURRENCY=2

# Copy from your web app service
NHTSA_API_URL=${{ motocheck.NHTSA_API_URL }}
PAYSTACK_SECRET_KEY=${{ motocheck.PAYSTACK_SECRET_KEY }}
RESEND_API_KEY=${{ motocheck.RESEND_API_KEY }}
FROM_EMAIL=${{ motocheck.FROM_EMAIL }}
R2_ENDPOINT=${{ motocheck.R2_ENDPOINT }}
R2_ACCESS_KEY_ID=${{ motocheck.R2_ACCESS_KEY_ID }}
R2_SECRET_ACCESS_KEY=${{ motocheck.R2_SECRET_ACCESS_KEY }}
R2_BUCKET_NAME=${{ motocheck.R2_BUCKET_NAME }}
TELEGRAM_BOT_TOKEN=${{ motocheck.TELEGRAM_BOT_TOKEN }}
TELEGRAM_SECRET_TOKEN=${{ motocheck.TELEGRAM_SECRET_TOKEN }}
GOOGLE_SEARCH_API_KEY=${{ motocheck.GOOGLE_SEARCH_API_KEY }}
GOOGLE_SEARCH_ENGINE_ID=${{ motocheck.GOOGLE_SEARCH_ENGINE_ID }}
PUBLIC_BASE_URL=${{ motocheck.PUBLIC_BASE_URL }}
NICB_API_URL=${{ motocheck.NICB_API_URL }}
```

#### Using Railway CLI:

```bash
# Switch to worker service
railway service link motocheck-workers

# Set variables
railway variables set DATABASE_URL='${{ Postgres.DATABASE_URL }}'
railway variables set LLM_PROVIDER=gemini
railway variables set GEMINI_API_KEY=your_key_here
railway variables set NMVTIS_API_URL=your_url
railway variables set NMVTIS_API_KEY=your_key
railway variables set NODE_ENV=production

# Copy other variables from web app
railway variables set NHTSA_API_URL='${{ motocheck.NHTSA_API_URL }}'
# ... repeat for all other variables
```

## Step 4: Configure Build and Start Commands

### For Worker Service (motocheck-workers):

#### Using Railway Dashboard:

1. Go to `motocheck-workers` service
2. Click "Settings" tab
3. Scroll to "Build & Deploy"
4. Set:
   - **Build Command**: `pnpm install`
   - **Start Command**: `pnpm workers:prod`
5. Disable health checks (workers don't serve HTTP)

#### Using Railway CLI:

Create a `railway.workers.toml` file:

```toml
[build]
builder = "RAILPACK"
buildCommand = "pnpm install"

[deploy]
startCommand = "pnpm workers:prod"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

Then deploy:

```bash
railway service link motocheck-workers
railway up --config railway.workers.toml
```

## Step 5: Configure Web App Service

Make sure your web app service (motocheck) has:

#### Using Railway Dashboard:

1. Go to `motocheck` service
2. Settings → Build & Deploy:
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `node build/index.js`
3. Settings → Health Check:
   - **Path**: `/api/health`
   - **Timeout**: 300 seconds

## Step 6: Deploy Both Services

### Deploy Web App:

```bash
# Link to web app service
railway service link motocheck

# Deploy
railway up

# Or push to GitHub (if connected)
git push origin main
```

### Deploy Workers:

```bash
# Link to worker service
railway service link motocheck-workers

# Deploy
railway up

# Or it will auto-deploy from GitHub
```

## Step 7: Verify Deployment

### Check Web App:

```bash
# Get web app URL
railway service link motocheck
railway domain

# Test health endpoint
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-05T...",
  "service": "vehicle-history-platform",
  "checks": {
    "database": { "status": "ok" },
    "queue": { "status": "ok" }
  }
}
```

### Check Worker Logs:

```bash
# View worker logs
railway service link motocheck-workers
railway logs

# Or in dashboard: motocheck-workers → Logs
```

Expected logs:
```
[workers] ========================================
[workers] Vehicle History Worker Process
[workers] ========================================
[workers] Starting worker registration...
[workers] pg-boss version: 12.15.0
[workers] Registering fetcher workers...
[workers] ✓ Registered 4 fetcher workers
[workers] Registering scraper workers...
[workers] ✓ Registered 4 scraper workers
[workers] Registering normalizer worker...
[workers] ✓ Registered normalizer worker
[workers] Registering stitcher worker...
[workers] ✓ Registered stitcher worker
[workers] Registering LLM workers...
[workers] ✓ Registered 2 LLM workers
[workers] ✓ Successfully registered 13 workers
[workers] Worker process is ready to process jobs
```

## Step 8: Test End-to-End

### Using the Test Script:

```bash
# Get your Railway app URL
railway service link motocheck
railway domain

# Set in your local environment
export API_BASE_URL=https://your-app.railway.app

# Test with a VIN
pnpm test:vin WBXHT3Z34G4A47548
```

### Using curl:

```bash
# Trigger report generation
curl -X POST https://your-app.railway.app/api/report \
  -H "Content-Type: application/json" \
  -d '{"vin":"WBXHT3Z34G4A47548"}'

# Check status
curl https://your-app.railway.app/api/status/WBXHT3Z34G4A47548

# Get report (when ready)
curl https://your-app.railway.app/api/report?vin=WBXHT3Z34G4A47548
```

## Common Railway CLI Commands

### Service Management:

```bash
# List all services
railway service list

# Switch between services
railway service link motocheck          # Web app
railway service link motocheck-workers  # Workers

# View current service
railway service
```

### Logs:

```bash
# View logs (current service)
railway logs

# Follow logs in real-time
railway logs --follow

# View logs for specific service
railway service link motocheck-workers
railway logs --follow
```

### Variables:

```bash
# List all variables
railway variables

# Set a variable
railway variables set KEY=value

# Delete a variable
railway variables delete KEY

# Copy variables from another service
railway variables set DATABASE_URL='${{ Postgres.DATABASE_URL }}'
```

### Deployment:

```bash
# Deploy current directory
railway up

# Deploy specific service
railway service link motocheck-workers
railway up

# Redeploy without changes
railway redeploy
```

## Troubleshooting

### Workers Not Starting

**Check logs:**
```bash
railway service link motocheck-workers
railway logs
```

**Common issues:**
- DATABASE_URL not set → Set to `${{ Postgres.DATABASE_URL }}`
- GEMINI_API_KEY not set → Add your Gemini API key
- Build failed → Check `pnpm install` runs successfully

### Web App Can't Connect to Queue

**Check:**
1. Both services have same DATABASE_URL
2. Database is running: `railway service link Postgres && railway logs`
3. pg-boss tables exist in database

### Jobs Not Processing

**Check:**
1. Worker service is running: `railway service link motocheck-workers && railway logs`
2. Workers registered successfully (see logs)
3. Queue connection is healthy: `curl https://your-app.railway.app/api/health`

### Environment Variables Not Working

**Check:**
1. Variables are set in correct service
2. Service has been redeployed after setting variables
3. No typos in variable names
4. Reference syntax is correct: `${{ ServiceName.VARIABLE }}`

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Project                          │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   motocheck      │         │ motocheck-workers│         │
│  │   (Web App)      │         │   (Workers)      │         │
│  │                  │         │                  │         │
│  │  Build: pnpm     │         │  Build: pnpm     │         │
│  │         build    │         │         install  │         │
│  │  Start: node     │         │  Start: pnpm     │         │
│  │         build/   │         │         workers: │         │
│  │         index.js │         │         prod     │         │
│  │                  │         │                  │         │
│  │  Health: /api/   │         │  Health: None    │         │
│  │          health  │         │                  │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                   │
│           │         ┌──────────────────┴─────┐             │
│           └─────────┤   Postgres Database    │             │
│                     │   (Shared)             │             │
│                     └────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Deploy Everything:

```bash
# 1. Deploy web app
railway service link motocheck
railway up

# 2. Deploy workers
railway service link motocheck-workers
railway up

# 3. Check both are running
railway service link motocheck && railway logs --tail 50
railway service link motocheck-workers && railway logs --tail 50
```

### Update Environment Variables:

```bash
# Update web app
railway service link motocheck
railway variables set GEMINI_API_KEY=new_key

# Update workers (must match web app)
railway service link motocheck-workers
railway variables set GEMINI_API_KEY=new_key
```

### View Status:

```bash
# Web app status
railway service link motocheck
railway status

# Worker status
railway service link motocheck-workers
railway status

# Database status
railway service link Postgres
railway status
```

## Next Steps

1. ✅ Set up worker service
2. ✅ Configure environment variables
3. ✅ Deploy both services
4. ✅ Verify logs show workers registered
5. ✅ Test with a sample VIN
6. 📊 Monitor usage in Railway dashboard
7. 🔍 Check Gemini usage in Google AI Studio

## Support

- **Railway Docs**: https://docs.railway.app/
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Project Issues**: Check service logs in Railway dashboard
