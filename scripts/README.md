# Testing Scripts

This directory contains manual testing utilities for the vehicle history platform.

## test-vin.ts

Manual VIN testing script that triggers report generation and monitors progress in real-time.

### Usage

```bash
pnpm test:vin <VIN>
```

### Example

```bash
pnpm test:vin 1HGBH41JXMN109186
```

### What it does

1. **Validates VIN** - Checks VIN format before submission
2. **Triggers Report** - Calls POST /api/report to start generation
3. **Polls Status** - Monitors GET /api/status/:vin every 2 seconds
4. **Displays Progress** - Shows real-time pipeline stage updates
5. **Shows Final Report** - Displays complete report with AI assessment

### Output

The script provides color-coded output:
- 🟢 Green: Completed stages and success messages
- 🟡 Yellow: In-progress stages and warnings
- 🔴 Red: Failed stages and errors
- 🔵 Blue: Informational messages
- 🟦 Cyan: Progress updates

### Configuration

Set the API base URL in your `.env` file:

```bash
API_BASE_URL="http://localhost:5173"
```

For production testing:

```bash
API_BASE_URL="https://your-production-url.com"
```

### Timeout

The script will wait up to 10 minutes for report completion. If generation takes longer, it will exit with a timeout error.

## Sample VINs for Testing

### Clean History VIN
- No accidents, no title brands, normal mileage
- Example: `1HGBH41JXMN109186` (Honda Accord)

### Salvage Title VIN
- Auction history, damage records, title brands
- Look for VINs with Copart/IAAI auction history

### High Mileage VIN
- Tests odometer anomaly detection
- Look for vehicles with 200,000+ miles

### Gap History VIN
- Tests gap detection (18+ month periods with no events)
- Look for older vehicles with sparse title transfer history

### Recall VIN
- Tests recall detection and reporting
- Check NHTSA recall database for affected VINs

## Development

The script is written in TypeScript and uses:
- `tsx` for TypeScript execution
- `dotenv` for environment variable loading
- Native `fetch` for API calls
- ANSI color codes for terminal output

To modify the script, edit `scripts/test-vin.ts` and run:

```bash
pnpm test:vin <VIN>
```

No build step is required - `tsx` executes TypeScript directly.
