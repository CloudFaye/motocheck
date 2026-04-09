# Manual Testing Guide

This guide provides sample VINs and testing scenarios for validating the vehicle history platform.

## Prerequisites

1. Ensure the development environment is running:

   ```bash
   pnpm dev
   ```

2. Verify the database is accessible and migrations are applied:

   ```bash
   pnpm db:migrate
   ```

3. Ensure all required environment variables are set in `.env`

## Testing Scenarios

### Scenario 1: Clean History VIN

**Objective**: Test a vehicle with no accidents, no title brands, and normal mileage progression.

**Sample VINs**:

- `1HGBH41JXMN109186` - 2021 Honda Accord
- `5YJSA1E14HF000001` - Tesla Model S
- `1G1ZD5ST0LF000001` - Chevrolet Malibu

**Expected Results**:

- ✅ All data sources complete successfully
- ✅ No title brands detected
- ✅ No odometer anomalies
- ✅ No significant history gaps
- ✅ Risk score: 1-3 (low risk)
- ✅ LLM verdict: "buy" or "caution" with positive reasoning
- ✅ All 9 report sections generated

**Test Command**:

```bash
pnpm test:vin 1HGBH41JXMN109186
```

**Validation Checklist**:

- [ ] Report status transitions: pending → fetching → normalizing → stitching → analyzing → ready
- [ ] Vehicle identity populated (year, make, model)
- [ ] Timeline contains events from all required sources
- [ ] Odometer readings show normal progression
- [ ] No anomaly flags on odometer readings
- [ ] LLM analysis includes risk score and verdict
- [ ] All 9 sections present in report_sections table

---

### Scenario 2: Salvage Title VIN

**Objective**: Test a vehicle with auction history, damage records, and title brands.

**Sample VINs**:

- Look for VINs on Copart.com with "salvage" or "rebuilt" titles
- Search IAAI.com for vehicles with damage history
- Use VINs from vehicles with known accident history

**Expected Results**:

- ✅ Copart and/or IAAI data successfully scraped
- ✅ Title brands detected (salvage, rebuilt, flood, etc.)
- ✅ Damage records included in timeline
- ✅ Photos from auction sites stored
- ✅ Risk score: 6-9 (medium to high risk)
- ✅ LLM verdict: "caution" or "avoid" with detailed reasoning
- ✅ Accident analysis section highlights damage severity

**Test Command**:

```bash
pnpm test:vin <SALVAGE_VIN>
```

**Validation Checklist**:

- [ ] Copart/IAAI scraper completes successfully
- [ ] Title brands array populated in timeline
- [ ] Damage records array populated in timeline
- [ ] Vehicle photos stored in vehicle_photos table
- [ ] LLM flags include title brand warnings
- [ ] Accident analysis section describes damage
- [ ] Risk score reflects salvage history

---

### Scenario 3: High Mileage VIN

**Objective**: Test odometer anomaly detection with high mileage or unusual mileage rates.

**Sample VINs**:

- Look for vehicles with 200,000+ miles
- Search for commercial vehicles (taxis, fleet vehicles)
- Use VINs with known mileage rollback history

**Expected Results**:

- ✅ Multiple odometer readings from various sources
- ✅ Anomaly detection flags unusual mileage rates (>50k miles/year)
- ✅ Expected mileage calculation based on vehicle age
- ✅ Odometer analysis section highlights discrepancies
- ✅ Risk score adjusted for mileage concerns
- ✅ LLM verdict mentions mileage as a factor

**Test Command**:

```bash
pnpm test:vin <HIGH_MILEAGE_VIN>
```

**Validation Checklist**:

- [ ] Odometer readings table populated with multiple entries
- [ ] isAnomaly flag set to true for unusual readings
- [ ] anomalyNote describes the issue (e.g., "unusual rate")
- [ ] Expected mileage calculated correctly
- [ ] Odometer analysis section explains mileage concerns
- [ ] LLM flags include odometer warnings
- [ ] GET /api/report/:vin/odometer returns anomaly data

---

### Scenario 4: Gap History VIN

**Objective**: Test gap detection for vehicles with 18+ month periods without recorded events.

**Sample VINs**:

- Look for older vehicles (15+ years old)
- Search for vehicles with sparse title transfer history
- Use VINs from states with infrequent inspections

**Expected Results**:

- ✅ Gaps array populated with detected periods
- ✅ Gap severity classified (medium: 18-36 months, high: 36+ months)
- ✅ Gap analysis section explains each period
- ✅ LLM provides likely explanations for gaps
- ✅ Risk score considers gap severity
- ✅ Buyers checklist includes gap-related inspection items

**Test Command**:

```bash
pnpm test:vin <GAP_HISTORY_VIN>
```

**Validation Checklist**:

- [ ] Gaps array populated in timeline
- [ ] Each gap includes startDate, endDate, durationMonths, severity
- [ ] Gaps exceeding 36 months marked as "high" severity
- [ ] Gap analysis section addresses each gap
- [ ] LLM flags include gap warnings
- [ ] Buyers checklist mentions verifying gap periods

---

### Scenario 5: Recall VIN

**Objective**: Test recall detection and reporting.

**Sample VINs**:

- Check NHTSA recall database: https://www.nhtsa.gov/recalls
- Look for VINs with open safety recalls
- Use VINs from manufacturers with recent recall campaigns

**Expected Results**:

- ✅ NHTSA recalls data fetched successfully
- ✅ Recalls array populated in timeline
- ✅ Each recall includes campaign number, component, summary, remedy
- ✅ Recall status section lists all recalls
- ✅ LLM verdict mentions recall status
- ✅ Buyers checklist includes recall verification

**Test Command**:

```bash
pnpm test:vin <RECALL_VIN>
```

**Validation Checklist**:

- [ ] NHTSA recalls fetcher completes successfully
- [ ] Recalls array populated in timeline
- [ ] Each recall includes nhtsaCampaignNumber
- [ ] Recall status section lists all recalls
- [ ] LLM flags include recall warnings if open
- [ ] Buyers checklist mentions checking recall completion

---

## Testing Workflow

### 1. Start Development Environment

```bash
# Terminal 1: Start web app and workers
pnpm dev

# Terminal 2: Monitor worker logs
# (workers output will show in Terminal 1)
```

### 2. Run Test Script

```bash
# Terminal 3: Run test script
pnpm test:vin <VIN>
```

### 3. Monitor Progress

The test script will display:

- Initial trigger confirmation
- Real-time status updates
- Pipeline stage progress
- Recent activity logs
- Final report summary

### 4. Verify Results

After completion, verify:

- Database records in `pipelineReports` table
- Raw data in `raw_data` table
- Normalized data in `normalized_data` table
- Odometer readings in `odometer_readings` table
- Photos in `vehicle_photos` table
- Sections in `report_sections` table
- Logs in `pipeline_log` table

### 5. Check API Endpoints

Manually test additional endpoints:

```bash
# Get report
curl "http://localhost:5173/api/report?vin=<VIN>"

# Get status
curl "http://localhost:5173/api/status/<VIN>"

# Get odometer data
curl "http://localhost:5173/api/report/<VIN>/odometer"

# Get photos
curl "http://localhost:5173/api/report/<VIN>/photos"

# Get sections
curl "http://localhost:5173/api/report/<VIN>/sections"

# Export DOCX
curl "http://localhost:5173/api/export/<VIN>" -o report.docx
```

---

## Troubleshooting

### Issue: Report stuck in "fetching" status

**Possible Causes**:

- Worker process not running
- Queue not processing jobs
- External API timeout or rate limiting

**Solutions**:

1. Check worker process is running: `ps aux | grep tsx`
2. Check worker logs for errors
3. Verify environment variables are set
4. Check external API connectivity

### Issue: Scraper workers failing

**Possible Causes**:

- Bot detection by auction sites
- Missing Puppeteer dependencies
- Network connectivity issues

**Solutions**:

1. Verify stealth plugin is enabled
2. Check User-Agent headers
3. Reduce scraper concurrency
4. Test with different VINs

### Issue: LLM workers timing out

**Possible Causes**:

- Anthropic API rate limiting
- Invalid API key
- Network latency

**Solutions**:

1. Verify ANTHROPIC_API_KEY is set correctly
2. Check Anthropic API status
3. Increase timeout in worker configuration
4. Reduce concurrent LLM jobs

### Issue: Missing data sources

**Possible Causes**:

- Optional sources failed (AutoTrader, CarGurus)
- Required sources failed (blocks stitching)
- VIN not found in data source

**Solutions**:

1. Check pipeline_log for specific errors
2. Verify VIN exists in external databases
3. Test with known-good VINs
4. Review normalizer logic for parsing errors

---

## Performance Benchmarks

Expected completion times (approximate):

- **Clean History VIN**: 2-4 minutes
- **Salvage Title VIN**: 3-5 minutes (scraping takes longer)
- **High Mileage VIN**: 2-4 minutes
- **Gap History VIN**: 2-4 minutes
- **Recall VIN**: 2-4 minutes

Factors affecting completion time:

- Number of data sources with results
- External API response times
- Scraper complexity (auction sites slower)
- LLM processing time (depends on timeline size)
- Database query performance

---

## Continuous Testing

For ongoing validation, create a test suite:

```bash
# Create test-suite.sh
#!/bin/bash

echo "Running vehicle history platform test suite..."

# Test 1: Clean history
echo "Test 1: Clean history VIN"
pnpm test:vin 1HGBH41JXMN109186

# Test 2: Salvage title
echo "Test 2: Salvage title VIN"
pnpm test:vin <SALVAGE_VIN>

# Test 3: High mileage
echo "Test 3: High mileage VIN"
pnpm test:vin <HIGH_MILEAGE_VIN>

# Test 4: Gap history
echo "Test 4: Gap history VIN"
pnpm test:vin <GAP_HISTORY_VIN>

# Test 5: Recall
echo "Test 5: Recall VIN"
pnpm test:vin <RECALL_VIN>

echo "Test suite completed!"
```

Make executable and run:

```bash
chmod +x test-suite.sh
./test-suite.sh
```

---

## Next Steps

After manual testing is complete:

1. **Document Results**: Record which VINs work best for each scenario
2. **Create Test Data**: Save sample reports for regression testing
3. **Automate Tests**: Convert manual tests to automated property-based tests
4. **Performance Tuning**: Optimize slow stages based on test results
5. **Production Testing**: Test with production API endpoints before deployment

---

## Additional Resources

- [NHTSA VIN Decoder](https://vpic.nhtsa.dot.gov/decoder/)
- [NHTSA Recalls Search](https://www.nhtsa.gov/recalls)
- [Copart Auction Search](https://www.copart.com/)
- [IAAI Auction Search](https://www.iaai.com/)
- [NICB VINCheck](https://www.nicb.org/vincheck)
