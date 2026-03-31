/**
 * DOCX Section Builders
 * 
 * This module contains all section builder functions for DOCX report generation.
 * Each function builds a specific section of the vehicle history report.
 */

import {
	Paragraph,
	Table,
	TextRun,
	HeadingLevel,
	AlignmentType
} from 'docx';
import type {
	ComprehensiveVehicleData,
	ImageResult,
	OwnershipHistory,
	SaleHistory,
	OdometerHistory,
	TitleHistory,
	InspectionHistory,
	InsuranceHistory,
	JunkSalvageInfo,
	AccidentHistory,
	LienImpoundHistory,
	TheftHistory,
	TitleBrands,
	MarketValue,
	WarrantyInfo
} from '../vehicle/types';
import {
	buildDOCXSection,
	createDOCXTable,
	buildEmptySectionDOCX,
	embedImageSafely,
	type ReportGenerationOptions
} from './docx-generator';
import { DOCX_STYLES } from './docx-styles';

// ===== Vehicle Images Section =====

/**
 * Build vehicle images section with embedded images
 * 
 * Embeds up to 4 vehicle images with metadata captions.
 * Handles empty images array with placeholder.
 * 
 * @param images - Array of image results
 * @returns Array of paragraphs with embedded images
 */
export async function buildVehicleImagesSection(images: ImageResult[]): Promise<(Paragraph | Table)[]> {
	// Handle empty images array
	if (!images || images.length === 0) {
		return buildEmptySectionDOCX('Vehicle Images');
	}

	// Limit to first 4 images
	const displayImages = images.slice(0, 4);
	const content: Paragraph[] = [];

	// Embed each image with metadata caption
	for (const img of displayImages) {
		try {
			const imageRun = await embedImageSafely(img.url, 576); // 6 inches = 576 pixels

			if (imageRun) {
				// Add image paragraph
				content.push(
					new Paragraph({
						children: [imageRun],
						alignment: AlignmentType.CENTER,
						spacing: { before: 200, after: 100 }
					})
				);

				// Add metadata caption
				const captionParts: string[] = [];
				captionParts.push(`Source: ${img.source}`);
				captionParts.push(`Match: ${img.matchType}`);
				if (img.metadata.date) {
					captionParts.push(`Date: ${img.metadata.date}`);
				}

				content.push(
					new Paragraph({
						children: [
							new TextRun({
								text: captionParts.join(' | '),
								font: DOCX_STYLES.fonts.body,
								size: 18,
								color: DOCX_STYLES.colors.textLight,
								italics: true
							})
						],
						alignment: AlignmentType.CENTER,
						spacing: { after: 300 }
					})
				);
			}
		} catch (error) {
			console.warn(`Failed to process image from ${img.source}:`, error);
			// Continue with next image
		}
	}

	// If no images were successfully embedded, return empty section
	if (content.length === 0) {
		return buildEmptySectionDOCX('Vehicle Images');
	}

	return buildDOCXSection('Vehicle Images', content);
}

// ===== Vehicle Specifications Section =====

export function buildSpecificationsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const specs = [
		['Make', data.identification.make],
		['Model', data.identification.model],
		['Year', data.identification.modelYear],
		['Series', data.identification.series],
		['Trim', data.identification.trim],
		['Body Class', data.body.bodyClass],
		['Vehicle Type', data.identification.vehicleType],
		['Doors', data.dimensions.doors],
		['Seats', data.body.numberOfSeats]
	].filter(([, value]) => value);

	if (specs.length === 0) {
		return buildEmptySectionDOCX('Vehicle Specifications');
	}

	return buildDOCXSection('Vehicle Specifications', [
		createDOCXTable(['Specification', 'Value'], specs)
	]);
}

// ===== Engine & Performance Section =====

export function buildEngineSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const engine = data.engine;
	const specs = [
		['Engine Model', engine.model],
		['Configuration', engine.configuration],
		['Cylinders', engine.cylinders],
		['Displacement', engine.displacementL ? `${engine.displacementL}L` : engine.displacementCC ? `${engine.displacementCC}cc` : ''],
		['Power Output', engine.power ? `${engine.power} kW` : ''],
		['Fuel Type (Primary)', engine.fuelTypePrimary],
		['Fuel Type (Secondary)', engine.fuelTypeSecondary],
		['Turbo', engine.turbo],
		['Manufacturer', engine.manufacturer]
	].filter(([, value]) => value);

	if (specs.length === 0) {
		return buildEmptySectionDOCX('Engine & Performance');
	}

	return buildDOCXSection('Engine & Performance', [
		createDOCXTable(['Specification', 'Value'], specs)
	]);
}

// ===== Transmission & Drivetrain Section =====

export function buildTransmissionSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const trans = data.transmission;
	const specs = [
		['Transmission Style', trans.transmissionStyle],
		['Number of Speeds', trans.transmissionSpeeds],
		['Drive Type', trans.driveType]
	].filter(([, value]) => value);

	if (specs.length === 0) {
		return buildEmptySectionDOCX('Transmission & Drivetrain');
	}

	return buildDOCXSection('Transmission & Drivetrain', [
		createDOCXTable(['Specification', 'Value'], specs)
	]);
}

// ===== Dimensions & Capacity Section =====

export function buildDimensionsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const dims = data.dimensions;
	const specs = [
		['Wheelbase', dims.wheelBaseShort || dims.wheelBaseLong ? `${dims.wheelBaseShort || dims.wheelBaseLong}"` : ''],
		['GVWR', dims.gvwr || dims.gvwrRange],
		['Curb Weight', dims.curbWeight ? `${dims.curbWeight} lbs` : ''],
		['Bed Length', dims.bedLength ? `${dims.bedLength}"` : ''],
		['Cab Type', dims.cabType]
	].filter(([, value]) => value);

	if (specs.length === 0) {
		return buildEmptySectionDOCX('Dimensions & Capacity');
	}

	return buildDOCXSection('Dimensions & Capacity', [
		createDOCXTable(['Specification', 'Value'], specs)
	]);
}

// ===== Safety Features Section =====

export function buildSafetySection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const safety = data.safety;
	const features = [
		['Front Airbags', safety.airBagLocFront],
		['Side Airbags', safety.airBagLocSide],
		['Curtain Airbags', safety.airBagLocCurtain],
		['Knee Airbags', safety.airBagLocKnee],
		['Seat Belts', safety.seatBeltsAll],
		['Pretensioner', safety.pretensioner],
		['ABS', safety.abs],
		['ESC', safety.esc],
		['Traction Control', safety.tractionControl],
		['Brake System', safety.brakeSystemType]
	].filter(([, value]) => value);

	if (features.length === 0) {
		return buildEmptySectionDOCX('Safety Features');
	}

	return buildDOCXSection('Safety Features', [
		createDOCXTable(['Feature', 'Value'], features)
	]);
}

// ===== Manufacturing Information Section =====

export function buildManufacturingSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	const mfg = data.manufacturing;
	const specs = [
		['Manufacturer', data.identification.manufacturer],
		['Plant City', mfg.plantCity],
		['Plant State', mfg.plantState],
		['Plant Country', mfg.plantCountry],
		['Plant Company', mfg.plantCompanyName],
		['Destination Market', data.market.destinationMarket]
	].filter(([, value]) => value);

	if (specs.length === 0) {
		return buildEmptySectionDOCX('Manufacturing Information');
	}

	return buildDOCXSection('Manufacturing Information', [
		createDOCXTable(['Information', 'Value'], specs)
	]);
}

// ===== Safety Recalls Section =====

export function buildRecallsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
	if (data.recalls.length === 0) {
		return [
			...buildDOCXSection('Safety Recalls', []),
			new Paragraph({
				children: [
					new TextRun({
						text: 'No open safety recalls found for this vehicle',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						color: DOCX_STYLES.colors.success,
						bold: true
					})
				],
				spacing: { before: 200, after: 200 }
			})
		];
	}

	const content: (Paragraph | Table)[] = [];
	
	data.recalls.forEach((recall, index) => {
		if (index > 0) {
			content.push(new Paragraph({ text: '', spacing: { before: 200 } }));
		}
		
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: recall.component,
						font: DOCX_STYLES.fonts.heading,
						size: 24,
						bold: true,
						color: DOCX_STYLES.colors.text
					})
				],
				spacing: { before: 200, after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'Issue: ',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						bold: true
					}),
					new TextRun({
						text: recall.summary,
						font: DOCX_STYLES.fonts.body,
						size: 22
					})
				],
				spacing: { after: 60 }
			})
		);
		
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'Consequence: ',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						bold: true
					}),
					new TextRun({
						text: recall.consequence,
						font: DOCX_STYLES.fonts.body,
						size: 22
					})
				],
				spacing: { after: 60 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'Remedy: ',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						bold: true
					}),
					new TextRun({
						text: recall.remedy,
						font: DOCX_STYLES.fonts.body,
						size: 22
					})
				],
				spacing: { after: 60 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: `Campaign #${recall.nhtsaCampaignNumber} | Reported: ${recall.reportReceivedDate}`,
						font: DOCX_STYLES.fonts.body,
						size: 20,
						color: DOCX_STYLES.colors.textLight,
						italics: true
					})
				],
				spacing: { after: 100 }
			})
		);
	});

	return buildDOCXSection(`Safety Recalls (${data.recalls.length} Found)`, content);
}

// ===== Ownership History Section =====

export function buildOwnershipHistorySection(ownership: OwnershipHistory): (Paragraph | Table)[] {
	if (!ownership.owners || ownership.owners.length === 0) {
		return buildEmptySectionDOCX('Ownership History');
	}

	const rows = ownership.owners.map(owner => [
		owner.ownerNumber.toString(),
		owner.startDate || 'N/A',
		owner.endDate || 'Current',
		owner.state || 'N/A',
		owner.durationMonths?.toString() || 'N/A'
	]);

	const content: (Paragraph | Table)[] = [];
	
	if (ownership.numberOfOwners) {
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: `Total Owners: ${ownership.numberOfOwners}`,
						font: DOCX_STYLES.fonts.body,
						size: 22,
						bold: true
					})
				],
				spacing: { before: 200, after: 200 }
			})
		);
	}

	content.push(
		createDOCXTable(
			['Owner #', 'Start Date', 'End Date', 'State', 'Duration (months)'],
			rows
		)
	);

	return buildDOCXSection('Ownership History', content);
}

// ===== Sale History Section =====

export function buildSaleHistorySection(sales: SaleHistory): (Paragraph | Table)[] {
	if (!sales.sales || sales.sales.length === 0) {
		return buildEmptySectionDOCX('Sale History');
	}

	const rows = sales.sales.map(sale => [
		sale.date,
		sale.price && sale.currency ? `${sale.currency} ${sale.price.toLocaleString()}` : 'N/A',
		sale.location || 'N/A',
		sale.saleType
	]);

	return buildDOCXSection('Sale History', [
		createDOCXTable(['Date', 'Price', 'Location', 'Type'], rows)
	]);
}

// ===== Odometer History Section =====

export function buildOdometerHistorySection(odometer: OdometerHistory): (Paragraph | Table)[] {
	if (!odometer.readings || odometer.readings.length === 0) {
		return buildEmptySectionDOCX('Odometer History');
	}

	const content: (Paragraph | Table)[] = [];

	if (odometer.rollbackDetected) {
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'WARNING: Rollback Detected',
						font: DOCX_STYLES.fonts.body,
						size: 24,
						color: DOCX_STYLES.colors.warning,
						bold: true
					})
				],
				spacing: { before: 200, after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'This vehicle has a detected odometer rollback. Exercise caution.',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						color: DOCX_STYLES.colors.warning
					})
				],
				spacing: { after: 200 }
			})
		);
	}

	const rows = odometer.readings.map(reading => [
		reading.date,
		reading.mileage.toLocaleString(),
		reading.source,
		reading.verified ? 'Yes' : 'No'
	]);

	content.push(
		createDOCXTable(['Date', 'Mileage', 'Source', 'Verified'], rows)
	);

	return buildDOCXSection('Odometer History', content);
}

// ===== Title History Section =====

export function buildTitleHistorySection(titleHistory: TitleHistory): (Paragraph | Table)[] {
	if (!titleHistory.records || titleHistory.records.length === 0) {
		return buildEmptySectionDOCX('Title History');
	}

	const rows = titleHistory.records.map(record => [
		record.date,
		record.state,
		record.titleNumber || 'N/A',
		record.transferType
	]);

	return buildDOCXSection('Title History', [
		createDOCXTable(['Date', 'State', 'Title Number', 'Transfer Type'], rows)
	]);
}

// ===== Inspection History Section =====

export function buildInspectionHistorySection(inspections: InspectionHistory): (Paragraph | Table)[] {
	const hasEmissions = inspections.emissions && inspections.emissions.length > 0;
	const hasSafety = inspections.safety && inspections.safety.length > 0;

	if (!hasEmissions && !hasSafety) {
		return buildEmptySectionDOCX('Inspection History');
	}

	const content: (Paragraph | Table)[] = [];

	if (hasEmissions) {
		content.push(
			new Paragraph({
				text: 'Emissions Inspections',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 200, after: 120 }
			})
		);

		const emissionsRows = inspections.emissions.map(inspection => [
			inspection.date,
			inspection.location,
			inspection.result.toUpperCase(),
			inspection.notes || 'N/A'
		]);

		content.push(
			createDOCXTable(['Date', 'Location', 'Result', 'Notes'], emissionsRows)
		);
	}

	if (hasSafety) {
		content.push(
			new Paragraph({
				text: 'Safety Inspections',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 240, after: 120 }
			})
		);

		const safetyRows = inspections.safety.map(inspection => [
			inspection.date,
			inspection.location,
			inspection.result.toUpperCase(),
			inspection.notes || 'N/A'
		]);

		content.push(
			createDOCXTable(['Date', 'Location', 'Result', 'Notes'], safetyRows)
		);
	}

	return buildDOCXSection('Inspection History', content);
}

// ===== Insurance History Section =====

export function buildInsuranceHistorySection(insurance: InsuranceHistory): (Paragraph | Table)[] {
	if (!insurance.records || insurance.records.length === 0) {
		return buildEmptySectionDOCX('Insurance History');
	}

	const rows = insurance.records.map(record => [
		record.claimDate,
		record.claimType,
		record.amount ? record.amount.toLocaleString() : 'N/A',
		record.status.toUpperCase()
	]);

	return buildDOCXSection('Insurance History', [
		createDOCXTable(['Claim Date', 'Type', 'Amount', 'Status'], rows)
	]);
}

// ===== Junk & Salvage Information Section =====

export function buildJunkSalvageSection(junkSalvage: JunkSalvageInfo): (Paragraph | Table)[] {
	if (!junkSalvage.records || junkSalvage.records.length === 0) {
		return buildEmptySectionDOCX('Junk & Salvage Information');
	}

	const content: (Paragraph | Table)[] = [];
	const hasWarning = junkSalvage.isSalvage || junkSalvage.isJunk;

	if (hasWarning) {
		const warningText = [];
		if (junkSalvage.isSalvage) warningText.push('This vehicle has a salvage title.');
		if (junkSalvage.isJunk) warningText.push('This vehicle has been designated as junk.');

		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'WARNING',
						font: DOCX_STYLES.fonts.body,
						size: 24,
						color: DOCX_STYLES.colors.warning,
						bold: true
					})
				],
				spacing: { before: 200, after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: warningText.join(' '),
						font: DOCX_STYLES.fonts.body,
						size: 22,
						color: DOCX_STYLES.colors.warning
					})
				],
				spacing: { after: 200 }
			})
		);
	}

	const rows = junkSalvage.records.map(record => [
		record.date,
		record.type,
		record.reason || 'N/A',
		record.auctionHouse || 'N/A'
	]);

	content.push(
		createDOCXTable(['Date', 'Type', 'Reason', 'Auction House'], rows)
	);

	return buildDOCXSection('Junk & Salvage Information', content);
}

// ===== Accident History Section =====

export function buildAccidentHistorySection(accidents: AccidentHistory): (Paragraph | Table)[] {
	if (!accidents.accidents || accidents.accidents.length === 0) {
		return buildEmptySectionDOCX('Accident History');
	}

	const content: (Paragraph | Table)[] = [];

	content.push(
		new Paragraph({
			children: [
				new TextRun({
					text: `Total Accidents: ${accidents.totalAccidents}`,
					font: DOCX_STYLES.fonts.body,
					size: 22,
					bold: true
				})
			],
			spacing: { before: 200, after: 200 }
		})
	);

	accidents.accidents.forEach((accident, index) => {
		if (index > 0) {
			content.push(new Paragraph({ text: '', spacing: { before: 300 } }));
		}

		content.push(
			new Paragraph({
				text: `Accident #${index + 1} - ${accident.date}`,
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 200, after: 120 }
			})
		);

		const accidentDetails = [
			['Severity', accident.severity.toUpperCase()],
			['Airbag Deployment', accident.airbagDeployment ? 'Yes' : 'No'],
			['Estimated Cost', accident.estimatedCost ? accident.estimatedCost.toLocaleString() : 'N/A'],
			['Location', accident.location || 'N/A']
		];

		content.push(createDOCXTable(['Detail', 'Value'], accidentDetails));

		if (accident.damageAreas && accident.damageAreas.length > 0) {
			content.push(
				new Paragraph({
					children: [
						new TextRun({
							text: 'Damage Areas:',
							font: DOCX_STYLES.fonts.body,
							size: 22,
							bold: true
						})
					],
					spacing: { before: 200, after: 100 }
				})
			);

			accident.damageAreas.forEach(damage => {
				content.push(
					new Paragraph({
						children: [
							new TextRun({
								text: `• ${damage.area}: ${damage.severity}`,
								font: DOCX_STYLES.fonts.body,
								size: 22
							})
						],
						spacing: { after: 60 }
					})
				);
			});
		}
	});

	return buildDOCXSection('Accident History', content);
}

// ===== Lien & Impound Records Section =====

export function buildLienImpoundSection(lienImpound: LienImpoundHistory): (Paragraph | Table)[] {
	const hasLiens = lienImpound.liens && lienImpound.liens.length > 0;
	const hasImpounds = lienImpound.impounds && lienImpound.impounds.length > 0;

	if (!hasLiens && !hasImpounds) {
		return buildEmptySectionDOCX('Lien & Impound Records');
	}

	const content: (Paragraph | Table)[] = [];

	if (hasLiens) {
		content.push(
			new Paragraph({
				text: 'Liens',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 200, after: 120 }
			})
		);

		const lienRows = lienImpound.liens.map(lien => [
			lien.date,
			lien.holder,
			lien.amount ? lien.amount.toLocaleString() : 'N/A',
			lien.status.toUpperCase()
		]);

		content.push(
			createDOCXTable(['Date', 'Holder', 'Amount', 'Status'], lienRows)
		);
	}

	if (hasImpounds) {
		content.push(
			new Paragraph({
				text: 'Impounds',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 240, after: 120 }
			})
		);

		const impoundRows = lienImpound.impounds.map(impound => [
			impound.date,
			impound.location,
			impound.reason,
			impound.releaseDate || 'Not Released'
		]);

		content.push(
			createDOCXTable(['Date', 'Location', 'Reason', 'Release Date'], impoundRows)
		);
	}

	return buildDOCXSection('Lien & Impound Records', content);
}

// ===== Theft History Section =====

export function buildTheftHistorySection(theft: TheftHistory): (Paragraph | Table)[] {
	if (!theft.records || theft.records.length === 0) {
		return buildEmptySectionDOCX('Theft History');
	}

	const content: (Paragraph | Table)[] = [];

	if (theft.isStolen) {
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'WARNING: STOLEN VEHICLE',
						font: DOCX_STYLES.fonts.body,
						size: 24,
						color: DOCX_STYLES.colors.error,
						bold: true
					})
				],
				spacing: { before: 200, after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'This vehicle is currently reported as stolen. Do not purchase.',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						color: DOCX_STYLES.colors.error,
						bold: true
					})
				],
				spacing: { after: 200 }
			})
		);
	}

	const rows = theft.records.map(record => [
		record.reportDate,
		record.recoveryDate || 'Not Recovered',
		record.location,
		record.status.toUpperCase()
	]);

	content.push(
		createDOCXTable(['Report Date', 'Recovery Date', 'Location', 'Status'], rows)
	);

	return buildDOCXSection('Theft History', content);
}

// ===== Title Brands Section =====

export function buildTitleBrandsSection(titleBrands: TitleBrands): (Paragraph | Table)[] {
	if (!titleBrands.brands || titleBrands.brands.length === 0) {
		return buildEmptySectionDOCX('Title Brands');
	}

	const content: (Paragraph | Table)[] = [];
	const warningBrands = ['salvage', 'flood', 'lemon'];
	const hasWarning = titleBrands.brands.some(b => warningBrands.includes(b.brand));

	if (hasWarning) {
		content.push(
			new Paragraph({
				children: [
					new TextRun({
						text: 'WARNING',
						font: DOCX_STYLES.fonts.body,
						size: 24,
						color: DOCX_STYLES.colors.warning,
						bold: true
					})
				],
				spacing: { before: 200, after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: 'This vehicle has title brands that may affect its value and safety.',
						font: DOCX_STYLES.fonts.body,
						size: 22,
						color: DOCX_STYLES.colors.warning
					})
				],
				spacing: { after: 200 }
			})
		);
	}

	const rows = titleBrands.brands.map(brand => [
		brand.brand.toUpperCase(),
		brand.date,
		brand.state,
		brand.description || 'N/A'
	]);

	content.push(
		createDOCXTable(['Brand Type', 'Date', 'State', 'Description'], rows)
	);

	return buildDOCXSection('Title Brands', content);
}

// ===== Market Value Section =====

export function buildMarketValueSection(marketValue: MarketValue): (Paragraph | Table)[] {
	const specs = [
		['Current Value', marketValue.currentValue ? `${marketValue.currency} ${marketValue.currentValue.toLocaleString()}` : 'N/A'],
		['Source', marketValue.source],
		['Valuation Date', marketValue.date],
		['Condition', marketValue.condition ? marketValue.condition.toUpperCase() : 'N/A'],
		['Mileage Adjustment', marketValue.mileageAdjustment ? `${marketValue.currency} ${marketValue.mileageAdjustment.toLocaleString()}` : 'N/A']
	];

	return buildDOCXSection('Market Value', [
		createDOCXTable(['Detail', 'Value'], specs)
	]);
}

// ===== Warranty Information Section =====

export function buildWarrantySection(warranty: WarrantyInfo): (Paragraph | Table)[] {
	const hasManufacturer = warranty.manufacturer !== undefined;
	const hasExtended = warranty.extended && warranty.extended.length > 0;

	if (!hasManufacturer && !hasExtended) {
		return buildEmptySectionDOCX('Warranty Information');
	}

	const content: (Paragraph | Table)[] = [];

	if (hasManufacturer) {
		content.push(
			new Paragraph({
				text: 'Manufacturer Warranty',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 200, after: 120 }
			})
		);

		const mfgWarranty = warranty.manufacturer!;
		const mfgRows = [
			['Type', mfgWarranty.type],
			['Start Date', mfgWarranty.startDate],
			['End Date', mfgWarranty.endDate],
			['Mileage Limit', mfgWarranty.mileageLimit ? `${mfgWarranty.mileageLimit.toLocaleString()} miles` : 'N/A'],
			['Provider', mfgWarranty.provider],
			['Status', mfgWarranty.status.toUpperCase()]
		];

		content.push(createDOCXTable(['Detail', 'Value'], mfgRows));
	}

	if (hasExtended) {
		content.push(
			new Paragraph({
				text: 'Extended Warranties',
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 240, after: 120 }
			})
		);

		warranty.extended!.forEach((ext, index) => {
			if (index > 0) {
				content.push(new Paragraph({ text: '', spacing: { before: 200 } }));
			}

			content.push(
				new Paragraph({
					children: [
						new TextRun({
							text: `Extended Warranty #${index + 1}`,
							font: DOCX_STYLES.fonts.body,
							size: 22,
							bold: true
						})
					],
					spacing: { before: 120, after: 100 }
				})
			);

			const extRows = [
				['Type', ext.type],
				['Start Date', ext.startDate],
				['End Date', ext.endDate],
				['Mileage Limit', ext.mileageLimit ? `${ext.mileageLimit.toLocaleString()} miles` : 'N/A'],
				['Provider', ext.provider],
				['Status', ext.status.toUpperCase()]
			];

			content.push(createDOCXTable(['Detail', 'Value'], extRows));
		});
	}

	return buildDOCXSection('Warranty Information', content);
}

// ===== NCS Valuation Section (Conditional) =====

export function buildNCSValuationSection(options: ReportGenerationOptions): (Paragraph | Table)[] {
	if (!options.includeNCSValuation || !options.cifUsd) {
		return [];
	}

	const rows = [
		['CIF Value (USD)', `$${options.cifUsd.toLocaleString()}`],
		['CIF Value (NGN)', options.cifNgn ? `₦${options.cifNgn.toLocaleString()}` : 'N/A'],
		['CBN Exchange Rate', options.cbnRate ? `₦${options.cbnRate.toLocaleString()}/USD` : 'N/A'],
		['Confidence Level', options.confidence || 'N/A']
	];

	return buildDOCXSection('NCS Valuation', [
		createDOCXTable(['Detail', 'Value'], rows)
	]);
}

// ===== Nigerian Import Duty Breakdown Section (Conditional) =====

export function buildDutyBreakdownSection(options: ReportGenerationOptions): (Paragraph | Table)[] {
	if (!options.includeDutyBreakdown || !options.dutyBreakdown) {
		return [];
	}

	const duty = options.dutyBreakdown;

	const rows = [
		['Import Duty (35%)', `₦${duty.importDuty.toLocaleString()}`],
		['Surcharge (7%)', `₦${duty.surcharge.toLocaleString()}`],
		['NAC Levy (20%)', `₦${duty.nacLevy.toLocaleString()}`],
		['CISS (1%)', `₦${duty.ciss.toLocaleString()}`],
		['ETLS (0.5%)', `₦${duty.etls.toLocaleString()}`],
		['VAT (7.5%)', `₦${duty.vat.toLocaleString()}`]
	];

	const content: (Paragraph | Table)[] = [
		createDOCXTable(['Duty Component', 'Amount'], rows),
		new Paragraph({
			children: [
				new TextRun({
					text: 'TOTAL IMPORT DUTY: ',
					font: DOCX_STYLES.fonts.body,
					size: 24,
					bold: true,
					color: DOCX_STYLES.colors.text
				}),
				new TextRun({
					text: `₦${duty.totalDutyNgn.toLocaleString()}`,
					font: DOCX_STYLES.fonts.body,
					size: 24,
					bold: true,
					color: DOCX_STYLES.colors.primary
				})
			],
			spacing: { before: 200, after: 200 }
		})
	];

	return buildDOCXSection('Nigerian Import Duty Breakdown', content);
}
