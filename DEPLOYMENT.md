# Railway Deployment Guide

This application requires **two separate Railway services** to run properly:
1. **Web App Service** - Serves HTTP requests
2. **Worker Service** - Processes background jobs

Both services share the same PostgreSQL database.

## Prerequisites

1. Railway account with a project created
2. PostgreSQL database provisioned in Railway
3. All required environment variables configured

## Required Environment Variables

Set these in **both services** on Railway:

### Required
- `DATABASE_URL` - PostgreSQL connection string (use Railway's `${{ Postgres.DATABASE_URL }}` reference)
- `LLM_PROVIDER` - LLM provider to use: `gemini` (default, free) or `anthropic` (premium)
- `GEMINI_API_KEY` - Google Gemini API key (required if LLM_PROVIDER=gemini)
- `NMVTIS_API_URL` - NMVTIS provider API endpoint
- `NMVTIS_API_KEY` - NMVTIS provider API key
- `NODE_ENV` - Set to `production`

### Optional
- `ANTHROPIC_API_KEY` - Anthropic Claude API key (only required if LLM_PROVIDER=anthropic)
- `NICB_API_KEY` - NICB VINCheck API key
- `GEMINI_MODEL` - Gemini model to use (defaults to `gemini-1.5-flash`)
- `ANTHROPIC_MODEL` - Claude model to use (defaults to `claude-sonnet-4-20250514`)
- `WORKER_CONCURRENCY` - Number of concurrent jobs per worker (defaults to 5)
- `SCRAPER_CONCURRENCY` - Number of concurrent browser instances (defaults to 2)

### Existing Services (if applicable)
- `NHTSA_API_URL` - NHTSA API endpoint
- `PAYSTACK_SECRET_KEY` - Payment gateway key
- `RESEND_API_KEY` - Email service key
- `FROM_EMAIL` - Email sender address
- `R2_ENDPOINT` - Cloudflare R2 storage endpoint
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_SECRET_TOKEN` - Telegram webhook secret
- `GOOGLE_SEARCH_API_KEY` - Google Custom Search API key
- `GOOGLE_SEARCH_ENGINE_ID` - Google Search Engine ID
- `PUBLIC_BASE_URL` - Public URL of the web app
- `NICB_API_URL` - NICB API endpoint

## Service 1: Web App

### Configuration

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
node build/index.js
```

**Health Check:**
- Path: `/api/health`
- Timeout: 300 seconds

**Restart Policy:**
- Type: `ON_FAILURE`
- Max Retries: 10

### Railway Settings

1. Create a new service in your Railway project
2. Connect to your GitHub repository
3. Set the root directory to `/` (project root)
4. Configure environment variables (see above)
5. Set build and start commands
6. Enable health checks at `/api/health`

## Service 2: Worker Process

### Configuration

**Build Command:**
```bash
pnpm install
```

**Start Command:**
```bash
pnpm workers:prod
```

**Health Check:**
- Disable health checks (workers don't serve HTTP)

**Restart Policy:**
- Type: `ON_FAILURE`
- Max Retries: 10

### Railway Settings

1. Create a second service in the same Railway project
2. Connect to the same GitHub repository
3. Set the root directory to `/` (project root)
4. Configure the **same environment variables** as the web app
5. Set build and start commands
6. Disable health checks

## Database Setup

1. Provision a PostgreSQL database in Railway
2. Railway will automatically create a `DATABASE_URL` variable
3. Reference it in both services using: `${{ Postgres.DATABASE_URL }}`

### Run Migrations

Migrations should run automatically on first deployment. If needed, run manually:

```bash
pnpm db:migrate
```

## Deployment Steps

### Step 1: Deploy Database
1. Create PostgreSQL database in Railway
2. Note the database name (e.g., `Postgres`)

### Step 2: Deploy Web App Service
1. Create new service
2. Connect to repository
3. Set environment variables (use `${{ Postgres.DATABASE_URL }}` for database)
4. Configure build/start commands
5. Deploy

### Step 3: Deploy Worker Service
1. Create second service in same project
2. Connect to same repository
3. Set same environment variables
4. Configure build/start commands for workers
5. Deploy

### Step 4: Verify Deployment
1. Check web app health: `https://your-app.railway.app/api/health`
2. Check worker logs for successful registration
3. Test report generation with a sample VIN

## Monitoring

### Web App Logs
- HTTP request logs
- API endpoint responses
- Database connection status
- Queue connection status

### Worker Logs
- Worker registration messages
- Job processing logs
- Pipeline progress logs
- Error messages and retries

### Expected Worker Startup Logs
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
[workers] Heartbeat logging started (60 second interval)
[workers] Worker process is running. Press Ctrl+C to stop.
```

## Troubleshooting

### Web App Won't Start
- Check DATABASE_URL is set correctly
- Verify all required environment variables are present
- Check build logs for errors
- Ensure migrations have run

### Workers Won't Start
- Check DATABASE_URL is set correctly
- Verify ANTHROPIC_API_KEY is set
- Check worker logs for specific errors
- Ensure pg-boss tables exist in database

### Jobs Not Processing
- Verify both services are running
- Check worker logs for errors
- Verify queue connection in web app health check
- Check database connectivity

### Database Connection Errors
- Verify DATABASE_URL format is correct
- Check database is running and accessible
- Verify connection pool settings
- Check for connection limit issues

## Scaling

### Web App
- Scale horizontally by adding more instances
- Railway handles load balancing automatically
- Each instance shares the same database and queue

### Workers
- Scale horizontally by adding more worker instances
- pg-boss handles job distribution automatically
- Each worker instance processes jobs independently
- Recommended: Start with 1-2 worker instances

## Cost Optimization

### Development
- Use Railway's free tier
- Single worker instance
- Minimal database resources

### Production
- Scale web app based on traffic
- Scale workers based on job volume
- Monitor database connection pool usage
- Use Railway's usage-based pricing

## Security

### Environment Variables
- Never commit .env files to git
- Use Railway's environment variable management
- Rotate API keys regularly
- Use Railway's secret references for sensitive data

### Database
- Use Railway's private networking
- Enable SSL connections
- Regular backups (Railway handles this)
- Monitor for unusual activity

## Maintenance

### Updates
- Push to main branch to trigger deployment
- Railway automatically rebuilds and redeploys
- Zero-downtime deployments for web app
- Workers gracefully shutdown and restart

### Database Migrations
- Run migrations before deploying code changes
- Test migrations in staging environment first
- Keep migrations reversible when possible
- Monitor migration execution time

### Monitoring
- Check Railway dashboard regularly
- Monitor error rates in logs
- Track job completion rates
- Monitor database performance

## Support

For issues specific to:
- **Railway Platform**: Check Railway documentation or support
- **Application Code**: Check application logs and error messages
- **Database Issues**: Check PostgreSQL logs in Railway
- **Worker Issues**: Check worker process logs

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [pg-boss Documentation](https://github.com/timgit/pg-boss)
- [SvelteKit Deployment](https://kit.svelte.dev/docs/adapter-node)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/index.html)
