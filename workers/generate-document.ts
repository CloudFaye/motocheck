/**
 * Document Generation Worker
 *
 * Generates DOCX report documents and sends them to users via email/Telegram
 * Triggered after LLM section writing completes
 */

import type { Job } from 'pg-boss';
import { db } from '../src/lib/server/db/index.js';
import {
	pipelineReports,
	reportSections,
	odometerReadings,
	vehiclePhotos,
	orders,
	lookups
} from '../src/lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { Jobs } from '../src/lib/server/queue/job-names.js';
import {
	Document,
	Paragraph,
	Table,
	TableRow,
	TableCell,
	TextRun,
	HeadingLevel,
	AlignmentType,
	WidthType,
	BorderStyle,
	Packer,
	Header,
	Footer
} from 'docx';

interface JobData {
	vin: string;
}

/**
 * Section display order for consistent presentation
 */
const SECTION_ORDER = [
	'summary',
	'ownership_history',
	'accident_analysis',
	'odometer_analysis',
	'title_history',
	'recall_status',
	'market_value',
	'gap_analysis',
	'buyers_checklist'
];

/**
 * Get email service dynamically
 */
async function getEmailService() {
	try {
		return await import('../src/lib/server/email-service.js');
	} catch (error) {
		console.warn('[generate-document] Email service unavailable:', error);
		return null;
	}
}

/**
 * Get Telegram bot dynamically
 */
async function getTelegramBot() {
	try {
		return await import('../src/telegram-bot/index.js');
	} catch (error) {
		console.warn('[generate-document] Telegram bot unavailable:', error);
		return null;
	}
}

/**
 * Create document header
 */
function createHeader(): Paragraph {
	const reportDate = new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return new Paragraph({
		children: [
			new TextRun({
				text: 'Vehicle History Report',
				bold: true,
				size: 24
			}),
			new TextRun({
				text: ` | ${reportDate}`,
				size: 20
			})
		],
		spacing: { after: 200 },
		border: {
			bottom: {
				color: '1e40af',
				space: 1,
				style: BorderStyle.SINGLE,
				size: 12
			}
		}
	});
}

/**
 * Create document footer
 */
function createFooter(): Paragraph {
	return new Paragraph({
		children: [
			new TextRun({
				text: 'This report is for informational purposes only. Always verify critical details independently.',
				size: 16,
				italics: true
			})
		],
		spacing: { before: 200 },
		alignment: AlignmentType.CENTER,
		border: {
			top: {
				color: 'e5e7eb',
				space: 1,
				style: BorderStyle.SINGLE,
				size: 6
			}
		}
	});
}

/**
 * Create title section
 */
function createTitle(report: typeof pipelineReports.$inferSelect): Paragraph[] {
	const vehicleName = `${report.year || ''} ${report.make || ''} ${report.model || ''}`.trim();

	return [
		new Paragraph({
			children: [
				new TextRun({
					text: vehicleName || 'Vehicle History Report',
					bold: true,
					size: 36
				})
			],
			spacing: { before: 400, after: 200 },
			alignment: AlignmentType.CENTER
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `VIN: ${report.vin}`,
					size: 24
				})
			],
			spacing: { after: 400 },
			alignment: AlignmentType.CENTER
		})
	];
}

/**
 * Create vehicle identity section
 */
function createVehicleIdentity(report: typeof pipelineReports.$inferSelect): (Paragraph | Table)[] {
	const rows: string[][] = [];

	if (report.year) rows.push(['Year', report.year.toString()]);
	if (report.make) rows.push(['Make', report.make]);
	if (report.model) rows.push(['Model', report.model]);
	if (report.trim) rows.push(['Trim', report.trim]);
	if (report.bodyStyle) rows.push(['Body Style', report.bodyStyle]);
	if (report.engineDescription) rows.push(['Engine', report.engineDescription]);
	if (report.driveType) rows.push(['Drive Type', report.driveType]);
	if (report.fuelType) rows.push(['Fuel Type', report.fuelType]);

	if (rows.length === 0) return [];

	return [
		new Paragraph({
			text: 'Vehicle Specifications',
			heading: HeadingLevel.HEADING_1,
			spacing: { before: 400, after: 200 }
		}),
		createTable(['Specification', 'Value'], rows),
		new Paragraph({ text: '', spacing: { after: 200 } })
	];
}

/**
 * Create verdict section
 */
function createVerdict(report: typeof pipelineReports.$inferSelect): Paragraph[] {
	if (!report.llmVerdict) return [];

	return [
		new Paragraph({
			text: 'AI Analysis',
			heading: HeadingLevel.HEADING_1,
			spacing: { before: 400, after: 200 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: report.llmVerdict,
					size: 24
				})
			],
			spacing: { after: 400 }
		})
	];
}

/**
 * Create sections from LLM-written content
 */
function createSections(sections: Array<typeof reportSections.$inferSelect>): Paragraph[] {
	const elements: Paragraph[] = [];

	for (const section of sections) {
		// Section title
		const title = section.sectionKey
			.split('_')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		elements.push(
			new Paragraph({
				text: title,
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 }
			})
		);

		// Section content (split by paragraphs)
		const paragraphs = section.content.split('\n\n');
		for (const para of paragraphs) {
			if (para.trim()) {
				elements.push(
					new Paragraph({
						children: [
							new TextRun({
								text: para.trim(),
								size: 24
							})
						],
						spacing: { after: 200 }
					})
				);
			}
		}

		elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
	}

	return elements;
}

/**
 * Create odometer section
 */
function createOdometerSection(
	readings: Array<typeof odometerReadings.$inferSelect>
): (Paragraph | Table)[] {
	if (readings.length === 0) return [];

	const rows = readings.map((reading) => [
		new Date(reading.readingDate).toLocaleDateString(),
		reading.mileage.toLocaleString(),
		reading.source,
		reading.isAnomaly ? '⚠️ Anomaly' : '✓ Normal'
	]);

	return [
		new Paragraph({
			text: 'Odometer History',
			heading: HeadingLevel.HEADING_1,
			spacing: { before: 400, after: 200 }
		}),
		createTable(['Date', 'Mileage', 'Source', 'Status'], rows),
		new Paragraph({ text: '', spacing: { after: 200 } })
	];
}

/**
 * Create photos section
 */
function createPhotosSection(
	photos: Array<typeof vehiclePhotos.$inferSelect>
): (Paragraph | Table)[] {
	if (photos.length === 0) return [];

	const rows = photos.map((photo) => [
		photo.source,
		photo.capturedAt ? new Date(photo.capturedAt).toLocaleDateString() : 'N/A',
		photo.photoType || 'N/A'
	]);

	return [
		new Paragraph({
			text: 'Vehicle Photos',
			heading: HeadingLevel.HEADING_1,
			spacing: { before: 400, after: 200 }
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `${photos.length} photo(s) available. Visit the online report to view images.`,
					size: 24,
					italics: true
				})
			],
			spacing: { after: 200 }
		}),
		createTable(['Source', 'Date', 'Type'], rows),
		new Paragraph({ text: '', spacing: { after: 200 } })
	];
}

/**
 * Create a simple table
 */
function createTable(headers: string[], rows: string[][]): Table {
	return new Table({
		width: {
			size: 100,
			type: WidthType.PERCENTAGE
		},
		rows: [
			// Header row
			new TableRow({
				children: headers.map(
					(header) =>
						new TableCell({
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: header,
											bold: true,
											size: 22,
											color: 'FFFFFF'
										})
									]
								})
							],
							shading: {
								fill: '1e40af'
							},
							margins: {
								top: 100,
								bottom: 100,
								left: 100,
								right: 100
							}
						})
				),
				tableHeader: true
			}),
			// Data rows
			...rows.map(
				(row, index) =>
					new TableRow({
						children: row.map(
							(cell) =>
								new TableCell({
									children: [
										new Paragraph({
											children: [
												new TextRun({
													text: cell || 'N/A',
													size: 22
												})
											]
										})
									],
									shading: {
										fill: index % 2 === 0 ? 'f3f4f6' : 'FFFFFF'
									},
									margins: {
										top: 100,
										bottom: 100,
										left: 100,
										right: 100
									}
								})
						)
					})
			)
		],
		borders: {
			top: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
			left: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
			right: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'e5e7eb' },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'e5e7eb' }
		}
	});
}

/**
 * Generate DOCX document for a report
 */
async function generateDocument(vin: string): Promise<Buffer> {
	// Query report
	const report = await db.query.pipelineReports.findFirst({
		where: eq(pipelineReports.vin, vin)
	});

	if (!report) {
		throw new Error(`Report not found for VIN: ${vin}`);
	}

	if (report.status !== 'ready') {
		throw new Error(`Report is not ready yet. Current status: ${report.status}`);
	}

	// Query all sections
	const sections = await db.query.reportSections.findMany({
		where: eq(reportSections.vin, vin)
	});

	// Sort sections by predefined order
	sections.sort((a, b) => {
		const indexA = SECTION_ORDER.indexOf(a.sectionKey);
		const indexB = SECTION_ORDER.indexOf(b.sectionKey);

		if (indexA !== -1 && indexB !== -1) {
			return indexA - indexB;
		}
		if (indexA !== -1) return -1;
		if (indexB !== -1) return 1;
		return a.sectionKey.localeCompare(b.sectionKey);
	});

	// Query odometer readings
	const readings = await db.query.odometerReadings.findMany({
		where: eq(odometerReadings.vin, vin),
		orderBy: [asc(odometerReadings.readingDate)]
	});

	// Query photos
	const photos = await db.query.vehiclePhotos.findMany({
		where: eq(vehiclePhotos.vin, vin),
		limit: 10
	});

	// Generate DOCX document
	const doc = new Document({
		sections: [
			{
				headers: {
					default: new Header({
						children: [createHeader()]
					})
				},
				footers: {
					default: new Footer({
						children: [createFooter()]
					})
				},
				children: [
					// Title
					...createTitle(report),

					// Vehicle identity
					...createVehicleIdentity(report),

					// LLM verdict
					...createVerdict(report),

					// Report sections
					...createSections(sections),

					// Odometer data
					...createOdometerSection(readings),

					// Photos section
					...createPhotosSection(photos)
				]
			}
		]
	});

	// Convert to buffer
	const buffer = await Packer.toBuffer(doc);
	return buffer;
}

/**
 * Send document to user via email or Telegram
 */
async function sendDocument(vin: string, docxBuffer: Buffer): Promise<void> {
	// Get order info by joining lookups and orders tables
	const result = await db
		.select({
			id: orders.id,
			email: orders.email,
			telegramChatId: orders.telegramChatId,
			lookupId: orders.lookupId
		})
		.from(orders)
		.innerJoin(lookups, eq(orders.lookupId, lookups.id))
		.where(eq(lookups.vin, vin))
		.limit(1);

	if (!result || result.length === 0) {
		console.log(`[generate-document] No order found for VIN ${vin}`);
		return;
	}

	const orderData = result[0];

	console.log(`[generate-document] Sending document to ${orderData.email} for VIN ${vin}`);

	// Send via email
	if (orderData.email && !orderData.email.startsWith('telegram')) {
		try {
			const emailService = await getEmailService();
			if (emailService) {
				await emailService.sendReport(orderData.email, orderData.id, vin, docxBuffer);
				console.log(`[generate-document] Sent email to ${orderData.email}`);
			}
		} catch (error) {
			console.error(`[generate-document] Failed to send email to ${orderData.email}:`, error);
		}
	}

	// Send via Telegram
	if (orderData.telegramChatId) {
		try {
			const telegramBot = await getTelegramBot();
			if (telegramBot?.bot) {
				await telegramBot.bot.telegram.sendDocument(
					orderData.telegramChatId,
					{
						source: docxBuffer,
						filename: `vehicle-history-${vin}.docx`
					},
					{
						caption:
							`✅ *Your Vehicle History Report is Ready!*\n\n` +
							`VIN: \`${vin}\`\n\n` +
							`Your comprehensive vehicle history report is attached above.`,
						parse_mode: 'Markdown'
					}
				);

				console.log(`[generate-document] Sent Telegram document for VIN ${vin}`);
			}
		} catch (error) {
			console.error(`[generate-document] Failed to send Telegram document:`, error);
		}
	}
}

/**
 * Worker handler for document generation
 */
export async function handleGenerateDocument(jobs: Job<JobData>[]): Promise<void> {
	for (const job of jobs) {
		await processGenerateDocument(job);
	}
}

async function processGenerateDocument(job: Job<JobData>): Promise<void> {
	const { vin } = job.data;

	console.log(`[generate-document] Starting document generation for VIN: ${vin}`);

	try {
		// Generate DOCX document
		const docxBuffer = await generateDocument(vin);

		console.log(`[generate-document] Document generated for VIN: ${vin} (${docxBuffer.length} bytes)`);

		// Send document to user
		await sendDocument(vin, docxBuffer);

		console.log(`[generate-document] Successfully sent document for VIN: ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`[generate-document] Failed for VIN ${vin}:`, errorMessage);
		throw error;
	}
}

/**
 * Register the document generation worker
 */
export async function registerGenerateDocumentWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.GENERATE_DOCUMENT, handleGenerateDocument);
	console.log('[generate-document] Worker registered');
}

