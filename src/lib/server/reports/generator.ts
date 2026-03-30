/**
 * Report Generator
 * Generates PDF reports from comprehensive vehicle data
 */

import puppeteer, { type Browser } from 'puppeteer';
import crypto from 'crypto';
import type { ComprehensiveVehicleData } from '../vehicle/types';
import { buildReportHTML } from './template-builder';

export interface ReportGenerationOptions {
	includeNCSValuation?: boolean;
	includeDutyBreakdown?: boolean;
	cifUsd?: number;
	cifNgn?: number;
	confidence?: string;
	dutyBreakdown?: {
		importDuty: number;
		surcharge: number;
		nacLevy: number;
		ciss: number;
		etls: number;
		vat: number;
		totalDutyNgn: number;
	};
	cbnRate?: number;
}

export interface GeneratedReport {
	pdfBuffer: Buffer;
	hash: string;
}

// Singleton browser instance for performance
let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
	if (browserInstance && browserInstance.connected) {
		return browserInstance;
	}

	if (browserPromise) {
		return browserPromise;
	}

	browserPromise = puppeteer
		.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
		})
		.then((browser) => {
			browserInstance = browser;
			browserPromise = null;
			return browser;
		});

	return browserPromise;
}

/**
 * Generate PDF report from comprehensive vehicle data
 */
export async function generateVehicleReport(
	vehicleData: ComprehensiveVehicleData,
	options: ReportGenerationOptions = {}
): Promise<GeneratedReport> {
	const browser = await getBrowser();
	const page = await browser.newPage();

	try {
		// Build HTML from vehicle data
		const html = buildReportHTML(vehicleData, options);

		// Set content and generate PDF
		await page.setContent(html, { waitUntil: 'networkidle0' });
		
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
			preferCSSPageSize: true
		});

		// Generate hash for integrity verification
		const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

		return { 
			pdfBuffer: Buffer.from(pdfBuffer), 
			hash 
		};
	} finally {
		await page.close();
	}
}

/**
 * Close browser instance (call on app shutdown)
 */
export async function closeBrowser(): Promise<void> {
	if (browserInstance) {
		await browserInstance.close();
		browserInstance = null;
	}
}
