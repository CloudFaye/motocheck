/**
 * Report Generator - Format Router
 * Routes report generation to appropriate generator based on format selection
 * Supports both PDF (legacy) and DOCX (default) formats
 */

import crypto from 'crypto';
import type { ComprehensiveVehicleData } from '../vehicle/types';
import { generatePDFReport } from './pdf-generator';
import { generateDOCXReport } from './docx-generator';

export interface ReportGenerationOptions {
	format?: 'pdf' | 'docx';
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
	buffer: Buffer;
	hash: string;
	format: 'pdf' | 'docx';
	fileSize: number;
	generationTime: number;
}

/**
 * Generate vehicle report in specified format
 * Routes to appropriate generator based on format parameter
 * 
 * @param vehicleData - Complete vehicle information
 * @param options - Report generation options including format selection
 * @returns Promise<GeneratedReport> - Generated report with metadata
 */
export async function generateVehicleReport(
	vehicleData: ComprehensiveVehicleData,
	options: ReportGenerationOptions = {}
): Promise<GeneratedReport> {
	const startTime = Date.now();
	const format = options.format || 'docx'; // Default to DOCX

	try {
		let buffer: Buffer;
		let hash: string;

		if (format === 'docx') {
			// Generate DOCX
			buffer = await generateDOCXReport(vehicleData, options);
			hash = crypto.createHash('sha256').update(buffer).digest('hex');
		} else {
			// Generate PDF
			const pdfResult = await generatePDFReport(vehicleData, options);
			buffer = pdfResult.pdfBuffer;
			hash = pdfResult.hash;
		}

		const generationTime = Date.now() - startTime;
		const fileSize = buffer.length;

		console.log(
			`${format.toUpperCase()} report generated in ${generationTime}ms, size: ${fileSize} bytes`
		);

		return {
			buffer,
			hash,
			format,
			fileSize,
			generationTime
		};
	} catch (error) {
		console.error(`${format.toUpperCase()} generation failed:`, error);
		throw new Error(
			`Failed to generate ${format.toUpperCase()} report: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
			{ cause: error }
		);
	}
}

/**
 * Close browser instance (call on app shutdown)
 * Delegates to PDF generator's browser management
 */
export { closeBrowser } from './pdf-generator';

/**
 * Order interface for format detection
 */
export interface Order {
	id: string;
	lookupId: string;
	email: string;
	amountNgn: number;
	paymentRef: string;
	paymentId?: string;
	status: string;
	source: string;
	telegramChatId?: string;
	reportFormat?: string;
	createdAt: Date;
	paidAt?: Date;
}

/**
 * Determine report format for order (handles legacy orders)
 * 
 * @param order - Order object with optional reportFormat field
 * @returns 'pdf' | 'docx' - Format to use for report generation
 */
export function determineReportFormat(order: Order): 'pdf' | 'docx' {
	// Explicit format specified
	if (order.reportFormat) {
		return order.reportFormat as 'pdf' | 'docx';
	}

	// Legacy orders (created before DOCX support) default to PDF
	// DOCX launch date: April 1, 2026
	const docxLaunchDate = new Date('2026-04-01');
	if (order.createdAt < docxLaunchDate) {
		return 'pdf';
	}

	// New orders without explicit format default to DOCX
	return 'docx';
}
