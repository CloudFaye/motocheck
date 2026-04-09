# Quick Start: Testing Your First VIN

Get started testing the vehicle history platform in 3 simple steps.

## Step 1: Start the System

Open a terminal and start both the web app and workers:

```bash
pnpm dev
```

You should see output indicating:

- ✅ Vite dev server running on http://localhost:5173
- ✅ Worker process started
- ✅ 13 workers registered successfully

## Step 2: Run Your First Test

Open a second terminal and test with a sample VIN:

```bash
pnpm test:vin 1HGBH41JXMN109186
```

This will:

1. Trigger report generation
2. Show real-time progress updates
3. Display the final report with AI assessment

## Step 3: View the Results

The test script will display:

- **Vehicle Identity**: Year, make, model, trim
- **AI Assessment**: Risk score and verdict
- **Timeline Summary**: Events, odometer readings, gaps, recalls
- **Completion Status**: Success or failure

## What to Expect

### Normal Flow (2-4 minutes)

```
✅ Report generation started: processing
⏳ Polling for status updates...

Status: FETCHING
  ✅ Completed: 4
     • fetch-nhtsa-decode
     • fetch-nhtsa-recalls
     • fetch-nmvtis
     • fetch-nicb

Status: NORMALIZING
  ✅ Completed: 6

Status: STITCHING
  ✅ Completed: 1

Status: ANALYZING
  ✅ Completed: 1

Status: READY
✅ Report generation completed!

FINAL REPORT
================================================================================
Vehicle Identity:
  2021 Honda Accord EX

AI Assessment:
  Risk Score: 2/10
  Verdict: buy - Clean history with no major concerns

Timeline Summary:
  Total Events: 12
  Odometer Readings: 5
  Data Sources: nhtsa_decode, nhtsa_recalls, nmvtis, nicb, copart, iaai

✅ Report completed at: 4/5/2026, 10:30:45 AM
================================================================================
```

## Troubleshooting

### "Failed to trigger report generation"

- Check that the dev server is running on http://localhost:5173
- Verify DATABASE_URL is set in .env
- Check for errors in the web app terminal

### "Report stuck in fetching status"

- Check that workers are running (should see in first terminal)
- Verify all required environment variables are set
- Check worker logs for specific errors

### "Network error"

- Ensure API_BASE_URL in .env matches your dev server
- Default is http://localhost:5173
- Check firewall settings

## Next Steps

1. **Try Different VINs**: See `TESTING_GUIDE.md` for sample VINs
2. **Check the Database**: Use `pnpm db:studio` to view records
3. **Test API Endpoints**: Use curl or Postman to test individual endpoints
4. **Review Logs**: Check `pipeline_log` table for detailed progress

## Need Help?

- Read `TESTING_GUIDE.md` for detailed testing scenarios
- Check `README.md` for script documentation
- Review worker logs in the first terminal
- Use `pnpm db:studio` to inspect database records

Happy testing! 🚗
