import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
	pipelineReports,
	reportSections,
	odometerReadings,
	vehiclePhotos
} from '$lib/server/db/schema';
import { normalizeVIN } from '$lib/shared/vin-utils';
import { eq, asc } from 'drizzle-orm';
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
	Footer,
	VerticalAlign
} from 'docx';

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
 * GET /api/export/:vin
 * Export report as DOCX file
 *
 * Generates a Microsoft Word document with all report sections,
 * odometer graph data, and vehicle photos
 *
 * Requirements: 52.1-52.6, 33.4
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const rawVin = params.vin;

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Query report
		const report = await db.query.pipelineReports.findFirst({
			where: eq(pipelineReports.vin, vin)
		});

		// Return 404 if report doesn't exist
		if (!report) {
			return json({ error: 'Report not found' }, { status: 404 });
		}

		// Return 400 if report is not ready
		if (report.status !== 'ready') {
			return json(
				{ error: `Report is not ready yet. Current status: ${report.status}` },
				{ status: 400 }
			);
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
			limit: 10 // Include up to 10 photos
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

		// Return DOCX file
		return new Response(buffer as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'Content-Disposition': `attachment; filename="vehicle-history-${vin}.docx"`,
				'Content-Length': buffer.length.toString()
			}
		});
	} catch (error) {
		console.error('[GET /api/export/:vin] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

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
	// Calculate column widths evenly
	const columnWidth = Math.floor(10000 / headers.length);
	
	return new Table({
		width: {
			size: 100,
			type: WidthType.PERCENTAGE
		},
		columnWidths: headers.map(() => columnWidth),
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
									],
									alignment: AlignmentType.LEFT
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
							},
							verticalAlign: VerticalAlign.CENTER,
							width: {
								size: columnWidth,
								type: WidthType.DXA
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
											],
											alignment: AlignmentType.LEFT
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
									},
									verticalAlign: VerticalAlign.CENTER,
									width: {
										size: columnWidth,
										type: WidthType.DXA
									}
								})
						)
					})
			)
		],
		borders: {
			top: { style: BorderStyle.SINGLE, size: 6, color: 'd1d5db' },
			bottom: { style: BorderStyle.SINGLE, size: 6, color: 'd1d5db' },
			left: { style: BorderStyle.SINGLE, size: 6, color: 'd1d5db' },
			right: { style: BorderStyle.SINGLE, size: 6, color: 'd1d5db' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: 'e5e7eb' },
			insideVertical: { style: BorderStyle.SINGLE, size: 3, color: 'e5e7eb' }
		}
	});
}
