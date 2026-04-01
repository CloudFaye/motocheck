/**
 * PDFKit-based PDF Generator
 * Professional PDF generation without browser automation
 */

import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import type { ComprehensiveVehicleData } from '../vehicle/types';
import type { ReportGenerationOptions } from './generator';

export interface PDFGenerationResult {
	pdfBuffer: Buffer;
	hash: string;
}

// Professional color palette - strictly black text for readability
const COLORS = {
	primary: '#000000',        // Black for all text
	text: '#000000',           // Black
	textLight: '#000000',      // Black
	textFaint: '#000000',      // Black
	border: '#cccccc',         // Light gray borders
	background: '#f5f5f5',     // Very light gray background
	white: '#ffffff',
	headerBg: '#e8e8e8',       // Light gray for headers
	success: '#000000',
	error: '#000000'
};

// PDFKit built-in fonts don't support Unicode - use NGN prefix for currency

/**
 * Generate PDF report using PDFKit
 */
export async function generatePDFReport(
	vehicleData: ComprehensiveVehicleData,
	options: ReportGenerationOptions = {}
): Promise<PDFGenerationResult> {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: 'A4',
				margins: { top: 50, bottom: 50, left: 50, right: 50 },
				info: {
					Title: `Vehicle Report - ${vehicleData.identification.vin}`,
					Author: 'MotoCheck',
					Subject: 'Comprehensive Vehicle History Report',
					Creator: 'MotoCheck Report Generator'
				}
			});

			const chunks: Buffer[] = [];
			doc.on('data', (chunk) => chunks.push(chunk));
			doc.on('end', () => {
				const pdfBuffer = Buffer.concat(chunks);
				const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
				resolve({ pdfBuffer, hash });
			});
			doc.on('error', reject);

			// Build the PDF content (async for image fetching)
			buildPDFContent(doc, vehicleData, options).then(() => {
				// Finalize the PDF
				doc.end();
			}).catch(reject);
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Build PDF content
 */
async function buildPDFContent(
	doc: PDFKit.PDFDocument,
	vehicleData: ComprehensiveVehicleData,
	options: ReportGenerationOptions
): Promise<void> {
	const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

	// Header
	addHeader(doc, vehicleData);

	// Vehicle Title
	doc.moveDown(1.5);
	doc.fontSize(20)
		.fillColor(COLORS.text)
		.font('Helvetica-Bold')
		.text(
			`${vehicleData.identification.modelYear} ${vehicleData.identification.make} ${vehicleData.identification.model}`,
			{ align: 'left' }
		);

	if (vehicleData.identification.trim) {
		doc.moveDown(0.3);
		doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
			.text(vehicleData.identification.trim, { align: 'left' });
	}

	doc.moveDown(0.5);
	doc.fontSize(10)
		.fillColor(COLORS.text)
		.font('Courier')
		.text(`VIN: ${vehicleData.identification.vin}`, { align: 'left' });

	doc.moveDown(2);
	addDivider(doc);

	// Vehicle Images (if available) - moved to END
	// (rendered after all data sections)

	// Vehicle Specifications
	addSection(doc, 'Vehicle Specifications', [
		['Make', vehicleData.identification.make],
		['Model', vehicleData.identification.model],
		['Year', vehicleData.identification.modelYear],
		['Body Class', vehicleData.body.bodyClass],
		['Vehicle Type', vehicleData.identification.vehicleType]
	]);

	// Engine & Performance
	addSection(doc, 'Engine & Performance', [
		['Engine', vehicleData.engine.model || 'N/A'],
		['Configuration', vehicleData.engine.configuration || 'N/A'],
		['Cylinders', vehicleData.engine.cylinders || 'N/A'],
		['Displacement', vehicleData.engine.displacementL ? `${vehicleData.engine.displacementL}L` : 'N/A'],
		['Fuel Type', vehicleData.engine.fuelTypePrimary || 'N/A']
	]);

	// Transmission & Drivetrain
	addSection(doc, 'Transmission & Drivetrain', [
		['Transmission', vehicleData.transmission.transmissionStyle || 'N/A'],
		['Speeds', vehicleData.transmission.transmissionSpeeds || 'N/A'],
		['Drive Type', vehicleData.transmission.driveType || 'N/A']
	]);

	// NCS Valuation (if included)
	if (options.includeNCSValuation && options.cifUsd) {
		doc.addPage();
		addSection(doc, 'NCS Valuation', [
			['CIF Value (USD)', `$${options.cifUsd.toLocaleString()}`],
			['CIF Value (NGN)', `NGN ${options.cifNgn?.toLocaleString() || 'N/A'}`],
			['CBN Exchange Rate', options.cbnRate ? `NGN ${options.cbnRate.toLocaleString()}/USD` : 'N/A'],
			['Confidence Level', options.confidence || 'N/A']
		]);
	}

	// Import Duty Breakdown (if included)
	if (options.includeDutyBreakdown && options.dutyBreakdown) {
		const duty = options.dutyBreakdown;
		addSection(doc, 'Nigerian Import Duty Breakdown', [
			['Import Duty (35%)', `NGN ${duty.importDuty.toLocaleString()}`],
			['Surcharge (7%)', `NGN ${duty.surcharge.toLocaleString()}`],
			['NAC Levy (20%)', `NGN ${duty.nacLevy.toLocaleString()}`],
			['CISS (1%)', `NGN ${duty.ciss.toLocaleString()}`],
			['ETLS (0.5%)', `NGN ${duty.etls.toLocaleString()}`],
			['VAT (7.5%)', `NGN ${duty.vat.toLocaleString()}`]
		]);

		// Total in highlighted box
		doc.moveDown(1);
		const totalY = doc.y;
		const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
		
		// Just use underline, no background
		doc.fontSize(12)
			.fillColor(COLORS.text)
			.font('Helvetica-Bold')
			.text('TOTAL IMPORT DUTY', doc.page.margins.left, totalY);

		doc.fontSize(14)
			.fillColor(COLORS.text)
			.text(
				`NGN ${duty.totalDutyNgn.toLocaleString()}`,
				doc.page.margins.left,
				totalY,
				{ align: 'right', width: pageWidth }
			);

		const underlineY = doc.y + 3;
		doc.moveTo(doc.page.margins.left, underlineY)
			.lineTo(doc.page.width - doc.page.margins.right, underlineY)
			.strokeColor(COLORS.text)
			.lineWidth(2)
			.stroke();

		doc.moveDown(2.5);
	}

	// Safety Recalls
	if (vehicleData.recalls && vehicleData.recalls.length > 0) {
		doc.addPage();
		addSectionHeader(doc, 'Safety Recalls');
		doc.moveDown(0.5);

		vehicleData.recalls.forEach((recall, index) => {
			if (index > 0) doc.moveDown(1);

			doc.fontSize(11)
				.fillColor(COLORS.text)
				.font('Helvetica-Bold')
				.text(`Campaign: ${recall.nhtsaCampaignNumber || 'N/A'}`);

			doc.fontSize(10)
				.fillColor(COLORS.text)
				.font('Helvetica')
				.text(`Component: ${recall.component || 'N/A'}`)
				.text(`Summary: ${recall.summary || 'No details available'}`)
				.text(`Consequence: ${recall.consequence || 'N/A'}`)
				.text(`Remedy: ${recall.remedy || 'N/A'}`);
		});
	} else {
		addSection(doc, 'Safety Recalls', [['Status', '✓ No active safety recalls']]);
	}

	// Manufacturing Information
	doc.addPage();
	addSection(doc, 'Manufacturing Information', [
		['Plant Country', vehicleData.manufacturing.plantCountry || 'N/A'],
		['Plant City', vehicleData.manufacturing.plantCity || 'N/A'],
		['Plant Company', vehicleData.manufacturing.plantCompanyName || 'N/A'],
		['Manufacturer', vehicleData.identification.manufacturer || 'N/A']
	]);

	// Vehicle Images - LAST section
	if (vehicleData.images && vehicleData.images.length > 0) {
		doc.addPage();
		await addVehicleImages(doc, vehicleData.images);
	}

	// Footer on last page
	addFooter(doc);
}

/**
 * Add header to document
 */
function addHeader(doc: PDFKit.PDFDocument, vehicleData: ComprehensiveVehicleData): void {
	doc.fontSize(16)
		.fillColor(COLORS.text)
		.font('Helvetica-Bold')
		.text('MotoCheck | Comprehensive Vehicle History Report');

	const reportDate = new Date().toLocaleDateString('en-NG', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	const reportId = vehicleData.identification.vin.slice(-8).toUpperCase();

	doc.moveDown(0.3);
	doc.fontSize(9)
		.fillColor(COLORS.text)
		.font('Helvetica')
		.text(`Report Date: ${reportDate} | Report ID: ${reportId}`);

	doc.moveDown(0.8);
	addDivider(doc);
}

/**
 * Add section with title and data rows
 */
function addSection(doc: PDFKit.PDFDocument, title: string, rows: string[][]): void {
	addSectionHeader(doc, title);
	doc.moveDown(0.8);

	const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
	const labelWidth = pageWidth * 0.45;

	rows.forEach((row) => {
		const [label, value] = row;
		if (!value || value === 'N/A') return;

		const y = doc.y;

		// Label (left-aligned, black)
		doc.fontSize(10)
			.fillColor(COLORS.text)
			.font('Helvetica')
			.text(label, doc.page.margins.left, y, {
				width: labelWidth,
				continued: false
			});

		// Value (right-aligned, black, bold)
		doc.fontSize(10)
			.fillColor(COLORS.text)
			.font('Helvetica-Bold')
			.text(value, doc.page.margins.left + labelWidth + 10, y, {
				width: pageWidth - labelWidth - 10,
				align: 'right'
			});

		doc.moveDown(0.6);
	});

	doc.moveDown(1.5);
}

/**
 * Add section header
 */
function addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
	doc.fontSize(13)
		.fillColor(COLORS.text)
		.font('Helvetica-Bold')
		.text(title);

	const y = doc.y;
	doc.moveTo(doc.page.margins.left, y + 3)
		.lineTo(doc.page.width - doc.page.margins.right, y + 3)
		.strokeColor(COLORS.text)
		.lineWidth(1)
		.stroke();

	doc.moveDown(0.3);
}

/**
 * Add horizontal divider
 */
function addDivider(doc: PDFKit.PDFDocument): void {
	const y = doc.y;
	doc.moveTo(doc.page.margins.left, y)
		.lineTo(doc.page.width - doc.page.margins.right, y)
		.strokeColor(COLORS.border)
		.lineWidth(1)
		.stroke();
	doc.moveDown(0.5);
}

/**
 * Add vehicle images to PDF
 */
async function addVehicleImages(doc: PDFKit.PDFDocument, images: import('../vehicle/types').ImageResult[]): Promise<void> {
	addSectionHeader(doc, 'Vehicle Images');
	doc.moveDown(0.5);

	const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
	const imageWidth = Math.min(pageWidth * 0.8, 400);
	
	// Limit to first 3 images to avoid excessive page length
	// Filter out placeholder images (SVG data URIs) as PDFKit doesn't support them
	const displayImages = images.filter(img => img.source !== 'placeholder').slice(0, 3);
	
	if (displayImages.length === 0) {
		doc.fontSize(10)
			.fillColor(COLORS.text)
			.font('Helvetica')
			.text('No vehicle images available', { align: 'center' });
		doc.moveDown(1);
		return;
	}
	
	for (const img of displayImages) {
		try {
			// Fetch image with timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);
			
			const response = await fetch(img.url, {
				signal: controller.signal,
				headers: { 'User-Agent': 'MotoCheck-Report-Generator/1.0' }
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) continue;
			
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			
			// Validate size (max 5MB)
			if (buffer.length > 5 * 1024 * 1024) continue;
			
			// Add image to PDF
			const x = doc.page.margins.left + (pageWidth - imageWidth) / 2;
			doc.image(buffer, x, doc.y, {
				width: imageWidth,
				align: 'center'
			});
			
			doc.moveDown(0.5);
			
			// Add caption
			const caption = `Source: ${img.source} | Match: ${img.matchType}${img.metadata?.date ? ` | Date: ${img.metadata.date}` : ''}`;
			doc.fontSize(9)
				.fillColor(COLORS.text)
				.font('Helvetica')
				.text(caption, { align: 'center' });
			
			doc.moveDown(1);
		} catch (error) {
			console.warn(`Failed to embed image from ${img.source}:`, error);
			// Continue with next image
		}
	}
	
	doc.moveDown(0.5);
}

/**
 * Add footer to document
 */
function addFooter(doc: PDFKit.PDFDocument): void {
	const bottomY = doc.page.height - doc.page.margins.bottom - 60;
	doc.y = bottomY;

	addDivider(doc);

	doc.fontSize(8)
		.fillColor(COLORS.text)
		.font('Helvetica')
		.text(
			'Disclaimer: Information accuracy depends on source data quality. This report should be used as a reference guide. Always verify critical details independently before making purchase decisions.',
			{ align: 'left' }
		);

	doc.moveDown(0.5);
	doc.fontSize(8)
		.fillColor(COLORS.text)
		.font('Helvetica-Bold')
		.text('MotoCheck - Professional Vehicle Reports for Nigeria | www.motocheck.ng', {
			align: 'center'
		});
}

/**
 * No browser to close with PDFKit
 */
export async function closeBrowser(): Promise<void> {
	// No-op for PDFKit
}
