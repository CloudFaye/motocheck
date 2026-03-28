import puppeteer, { type Browser } from 'puppeteer';
import crypto from 'crypto';

export interface ReportData {
	vin: string;
	make: string;
	model: string;
	year: string;
	engine: string;
	bodyClass: string;
	plantCountry: string;
	cifUsd: number;
	cifNgn: number;
	confidence: string;
	importDuty: number;
	surcharge: number;
	nacLevy: number;
	ciss: number;
	etls: number;
	vat: number;
	totalDutyNgn: number;
	cbnRate: number;
	rateTimestamp: Date;
}

export interface GeneratedReport {
	pdfBuffer: Buffer;
	hash: string;
}

// Singleton browser instance
let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
	if (browserInstance && browserInstance.connected) {
		return browserInstance;
	}

	if (browserPromise) {
		return browserPromise;
	}

	browserPromise = puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
	}).then(browser => {
		browserInstance = browser;
		browserPromise = null;
		return browser;
	});

	return browserPromise;
}

function buildHTML(data: ReportData): string {
	return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
	color: #1a1a1a;
	line-height: 1.6;
}
.container { padding: 40px; max-width: 800px; }
.header { 
	border-bottom: 3px solid #2563eb; 
	padding-bottom: 20px; 
	margin-bottom: 30px;
}
.logo { 
	font-size: 28px; 
	font-weight: bold; 
	color: #2563eb;
	margin-bottom: 8px;
}
.report-title { 
	font-size: 14px; 
	color: #666;
	text-transform: uppercase;
	letter-spacing: 1px;
}
.vehicle-header {
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	color: white;
	padding: 24px;
	border-radius: 8px;
	margin-bottom: 30px;
}
.vehicle-name { 
	font-size: 24px; 
	font-weight: bold;
	margin-bottom: 8px;
}
.vin-number { 
	font-family: 'Courier New', monospace;
	font-size: 14px;
	opacity: 0.9;
}
.section { 
	margin-bottom: 30px;
	page-break-inside: avoid;
}
.section-title { 
	font-size: 18px; 
	font-weight: 600;
	color: #1a1a1a;
	margin-bottom: 16px;
	padding-bottom: 8px;
	border-bottom: 2px solid #e5e7eb;
}
.info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	margin-bottom: 20px;
}
.info-item {
	padding: 12px;
	background: #f9fafb;
	border-radius: 6px;
}
.info-label {
	font-size: 12px;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 4px;
}
.info-value {
	font-size: 16px;
	font-weight: 600;
	color: #1a1a1a;
}
.duty-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 16px;
}
.duty-table tr {
	border-bottom: 1px solid #e5e7eb;
}
.duty-table td {
	padding: 12px 8px;
}
.duty-table td:first-child {
	color: #4b5563;
}
.duty-table td:last-child {
	text-align: right;
	font-weight: 600;
}
.duty-total {
	background: #f0f9ff;
	font-size: 18px;
}
.duty-total td {
	padding: 16px 8px;
	color: #2563eb;
	font-weight: bold;
}
.badge {
	display: inline-block;
	padding: 4px 12px;
	background: #dcfce7;
	color: #166534;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
}
.footer {
	margin-top: 40px;
	padding-top: 20px;
	border-top: 1px solid #e5e7eb;
	font-size: 11px;
	color: #6b7280;
}
.footer-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
}
</style>
</head>
<body>
<div class="container">
	<div class="header">
		<div class="logo">MotoCheck</div>
		<div class="report-title">Vehicle Import Duty Report</div>
	</div>

	<div class="vehicle-header">
		<div class="vehicle-name">${data.year} ${data.make} ${data.model}</div>
		<div class="vin-number">VIN: ${data.vin}</div>
	</div>

	<div class="section">
		<div class="section-title">Vehicle Specifications</div>
		<div class="info-grid">
			<div class="info-item">
				<div class="info-label">Engine</div>
				<div class="info-value">${data.engine}</div>
			</div>
			<div class="info-item">
				<div class="info-label">Body Class</div>
				<div class="info-value">${data.bodyClass}</div>
			</div>
			<div class="info-item">
				<div class="info-label">Plant Country</div>
				<div class="info-value">${data.plantCountry}</div>
			</div>
			<div class="info-item">
				<div class="info-label">Displacement</div>
				<div class="info-value">${data.engine}</div>
			</div>
		</div>
	</div>

	<div class="section">
		<div class="section-title">NCS Valuation</div>
		<div class="info-grid">
			<div class="info-item">
				<div class="info-label">CIF Value (USD)</div>
				<div class="info-value">$${data.cifUsd.toLocaleString()}</div>
			</div>
			<div class="info-item">
				<div class="info-label">CIF Value (NGN)</div>
				<div class="info-value">₦${data.cifNgn.toLocaleString()}</div>
			</div>
			<div class="info-item">
				<div class="info-label">CBN Exchange Rate</div>
				<div class="info-value">₦${data.cbnRate.toLocaleString()}/USD</div>
			</div>
			<div class="info-item">
				<div class="info-label">Confidence Level</div>
				<div class="info-value"><span class="badge">${data.confidence}</span></div>
			</div>
		</div>
	</div>

	<div class="section">
		<div class="section-title">Import Duty Breakdown</div>
		<table class="duty-table">
			<tr>
				<td>Import Duty (35%)</td>
				<td>₦${data.importDuty.toLocaleString()}</td>
			</tr>
			<tr>
				<td>Surcharge (7%)</td>
				<td>₦${data.surcharge.toLocaleString()}</td>
			</tr>
			<tr>
				<td>NAC Levy (20%)</td>
				<td>₦${data.nacLevy.toLocaleString()}</td>
			</tr>
			<tr>
				<td>CISS (1%)</td>
				<td>₦${data.ciss.toLocaleString()}</td>
			</tr>
			<tr>
				<td>ETLS (0.5%)</td>
				<td>₦${data.etls.toLocaleString()}</td>
			</tr>
			<tr>
				<td>VAT (7.5%)</td>
				<td>₦${data.vat.toLocaleString()}</td>
			</tr>
			<tr class="duty-total">
				<td>TOTAL IMPORT DUTY</td>
				<td>₦${data.totalDutyNgn.toLocaleString()}</td>
			</tr>
		</table>
	</div>

	<div class="footer">
		<div class="footer-grid">
			<div>
				<strong>Generated:</strong> ${new Date().toLocaleString('en-NG')}<br>
				<strong>Report ID:</strong> ${data.vin.slice(-8)}
			</div>
			<div style="text-align: right;">
				<strong>MotoCheck</strong><br>
				Accurate Nigerian Import Duty Estimates
			</div>
		</div>
	</div>
</div>
</body>
</html>
`;
}

export async function generateReport(data: ReportData): Promise<GeneratedReport> {
	const browser = await getBrowser();
	const page = await browser.newPage();

	try {
		await page.setContent(buildHTML(data));
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
		});

		const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

		return { pdfBuffer: Buffer.from(pdfBuffer), hash };
	} finally {
		await page.close();
	}
}
