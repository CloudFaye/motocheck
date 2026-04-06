# Notification System Setup

## What Was Fixed

### 1. Core Issue: Reports Stuck Waiting for Unavailable APIs
- **Problem**: NMVTIS and NICB were marked as REQUIRED but not configured/blocked
- **Solution**: Moved them to OPTIONAL sources
- **Impact**: Reports now complete with available data sources

### 2. Deprecated Puppeteer API
- **Problem**: `page.waitForTimeout()` removed in newer Puppeteer versions
- **Solution**: Replaced with standard `setTimeout` wrapped in Promise
- **Files Fixed**: All 4 scrapers (Copart, IAAI, AutoTrader, CarGurus)

### 3. User Notifications Added
- **Progress Updates**: Users get emails/Telegram at 25%, 50%, 75% completion
- **Completion Alerts**: Automatic notification when report is ready
- **Estimated Time**: Shows remaining time based on pending sources

### 4. Admin Monitoring Added
- **Error Alerts**: Instant email when workers fail
- **Timeout Warnings**: Alert if report takes >5 minutes
- **Daily Digests**: Summary of worker performance and errors

## Environment Setup

Add to your `.env` file:

```bash
# Admin Email for Worker Notifications
ADMIN_EMAIL="your-admin-email@domain.com"
```

## How It Works

### User Flow
1. User pays for report → Jobs enqueued
2. As sources complete → Progress notifications sent (25%, 50%, 75%)
3. All required sources done → Report generated
4. Report ready → Completion email/Telegram with attachments

### Admin Flow
1. Worker fails → Instant email with error details
2. Report >5 min → Timeout warning email
3. Daily digest → Performance stats and error summary

## Notification Types

### User Notifications

**Progress Update Email**
- Sent at 25%, 50%, 75% completion
- Shows progress bar and estimated time
- Includes VIN and source count

**Telegram Progress**
- Same milestones as email
- Compact format with progress bar
- Real-time updates

### Admin Notifications

**Error Alert**
```
Subject: [MotoCheck Admin] Worker Error: scrape-copart
Body: Worker encountered error processing VIN XXXXX
Details: Full error stack and context
```

**Timeout Warning**
```
Subject: [MotoCheck Admin] Report Timeout Warning
Body: Report for VIN XXXXX processing >5 minutes
Action: Check worker logs and queue status
```

**Daily Digest**
```
Subject: [MotoCheck] Worker Digest - Last 24 Hours
Stats:
- Total Jobs: 150
- Completed: 142 (95%)
- Failed: 8 (5%)
- Avg Processing Time: 45s
Recent Errors: [List of top errors]
```

## Testing

### Test User Notifications
```bash
# Submit a test VIN
curl -X POST http://localhost:5173/api/vin \
  -H "Content-Type: application/json" \
  -d '{"vin":"1HGBH41JXMN109186","email":"test@example.com"}'

# Watch logs for notification triggers
```

### Test Admin Notifications
```bash
# Set ADMIN_EMAIL in .env
ADMIN_EMAIL="your-email@domain.com"

# Trigger an error (use invalid VIN)
# Check your email for error notification
```

## Files Modified

1. `src/lib/server/queue/job-names.ts` - Moved NMVTIS/NICB to optional
2. `workers/scrapers/*.ts` - Fixed waitForTimeout deprecation
3. `src/lib/server/email-service.ts` - Added notification functions
4. `workers/send-notifications.ts` - New notification worker
5. `workers/normalizers/index.ts` - Trigger progress notifications
6. `workers/index.ts` - Register notification worker
7. `.env.example` - Added ADMIN_EMAIL

## Next Steps

1. **Set ADMIN_EMAIL** in your Railway environment variables
2. **Deploy** the changes
3. **Test** with a real VIN to see notifications in action
4. **Monitor** your admin email for worker status

## Future Enhancements

- SMS notifications via Twilio
- Slack/Discord webhooks for team alerts
- Real-time dashboard for admin monitoring
- Webhook callbacks for API integrations
- Retry notifications for failed deliveries
