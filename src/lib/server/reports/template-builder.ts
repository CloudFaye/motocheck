/**
 * PDF Template Builder
 * Clean, professional layout for vehicle reports
 */

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
	WarrantyInfo,
	DamageArea
} from '../vehicle/types';
import { pdfStyles } from './pdf-styles';

interface ReportOptions {
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

function buildSpecificationsSection(data: ComprehensiveVehicleData): string {
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

	return `
		<div class="section">
			<div class="section-title">Vehicle Specifications</div>
			<table class="data-table">
				${specs.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildEngineSection(data: ComprehensiveVehicleData): string {
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

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-title">Engine & Performance</div>
			<table class="data-table">
				${specs.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildTransmissionSection(data: ComprehensiveVehicleData): string {
	const trans = data.transmission;
	const specs = [
		['Transmission Style', trans.transmissionStyle],
		['Number of Speeds', trans.transmissionSpeeds],
		['Drive Type', trans.driveType]
	].filter(([, value]) => value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-title">Transmission & Drivetrain</div>
			<table class="data-table">
				${specs.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildDimensionsSection(data: ComprehensiveVehicleData): string {
	const dims = data.dimensions;
	const specs = [
		['Wheelbase', dims.wheelBaseShort || dims.wheelBaseLong ? `${dims.wheelBaseShort || dims.wheelBaseLong}"` : ''],
		['GVWR', dims.gvwr || dims.gvwrRange],
		['Curb Weight', dims.curbWeight ? `${dims.curbWeight} lbs` : ''],
		['Bed Length', dims.bedLength ? `${dims.bedLength}"` : ''],
		['Cab Type', dims.cabType]
	].filter(([, value]) => value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-title">Dimensions & Capacity</div>
			<table class="data-table">
				${specs.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildSafetySection(data: ComprehensiveVehicleData): string {
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

	if (features.length === 0) return '';

	return `
		<div class="section">
			<div class="section-title">Safety Features</div>
			<table class="data-table">
				${features.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildManufacturingSection(data: ComprehensiveVehicleData): string {
	const mfg = data.manufacturing;
	const specs = [
		['Manufacturer', data.identification.manufacturer],
		['Plant City', mfg.plantCity],
		['Plant State', mfg.plantState],
		['Plant Country', mfg.plantCountry],
		['Plant Company', mfg.plantCompanyName],
		['Destination Market', data.market.destinationMarket]
	].filter(([, value]) => value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-title">Manufacturing Information</div>
			<table class="data-table">
				${specs.map(([label, value]) => `
					<tr>
						<td>${label}</td>
						<td>${value}</td>
					</tr>
				`).join('')}
			</table>
		</div>
	`;
}

function buildRecallsSection(data: ComprehensiveVehicleData): string {
	if (data.recalls.length === 0) {
		return `
			<div class="section">
				<div class="section-title">Safety Recalls</div>
				<div class="info-box">
					<div class="info-box-content" style="color: #10b981; font-weight: 600;">
						✓ No open safety recalls found for this vehicle
					</div>
				</div>
			</div>
		`;
	}

	return `
		<div class="section">
			<div class="section-title">Safety Recalls (${data.recalls.length} Found)</div>
			${data.recalls.map(recall => `
				<div class="recall-box">
					<div class="recall-header">${recall.component}</div>
					<div class="recall-content">
						<strong>Issue:</strong> ${recall.summary}<br>
						<strong>Consequence:</strong> ${recall.consequence}<br>
						<strong>Remedy:</strong> ${recall.remedy}
					</div>
					<div class="recall-meta">
						Campaign #${recall.nhtsaCampaignNumber} | Reported: ${recall.reportReceivedDate}
					</div>
				</div>
			`).join('')}
		</div>
	`;
}

function buildValuationSection(options: ReportOptions): string {
	if (!options.includeNCSValuation || !options.cifUsd) return '';

	return `
		<div class="section">
			<div class="section-title">NCS Valuation</div>
			<table class="data-table">
				<tr>
					<td>CIF Value (USD)</td>
					<td>$${options.cifUsd.toLocaleString()}</td>
				</tr>
				<tr>
					<td>CIF Value (NGN)</td>
					<td>₦${options.cifNgn?.toLocaleString()}</td>
				</tr>
				<tr>
					<td>CBN Exchange Rate</td>
					<td>₦${options.cbnRate?.toLocaleString()}/USD</td>
				</tr>
				<tr>
					<td>Confidence Level</td>
					<td><span class="badge badge-${options.confidence === 'exact' ? 'success' : 'warning'}">${options.confidence}</span></td>
				</tr>
			</table>
		</div>
	`;
}

function buildDutySection(options: ReportOptions): string {
	if (!options.includeDutyBreakdown || !options.dutyBreakdown) return '';

	const duty = options.dutyBreakdown;

	return `
		<div class="section">
			<div class="section-title">Nigerian Import Duty Breakdown</div>
			<table class="duty-table">
				<tr>
					<td>Import Duty (35%)</td>
					<td>₦${duty.importDuty.toLocaleString()}</td>
				</tr>
				<tr>
					<td>Surcharge (7%)</td>
					<td>₦${duty.surcharge.toLocaleString()}</td>
				</tr>
				<tr>
					<td>NAC Levy (20%)</td>
					<td>₦${duty.nacLevy.toLocaleString()}</td>
				</tr>
				<tr>
					<td>CISS (1%)</td>
					<td>₦${duty.ciss.toLocaleString()}</td>
				</tr>
				<tr>
					<td>ETLS (0.5%)</td>
					<td>₦${duty.etls.toLocaleString()}</td>
				</tr>
				<tr>
					<td>VAT (7.5%)</td>
					<td>₦${duty.vat.toLocaleString()}</td>
				</tr>
				<tr class="duty-total">
					<td>TOTAL IMPORT DUTY</td>
					<td>₦${duty.totalDutyNgn.toLocaleString()}</td>
				</tr>
			</table>
		</div>
	`;
}

// ===== Utility Functions for Section Rendering =====

/**
 * Generic function to build a section with data
 */
export function buildSectionWithData<T>(
	title: string,
	data: T | undefined,
	renderFunction: (data: T) => string
): string {
	if (!data) {
		return buildEmptySection(title);
	}
	try {
		return `
			<div class="section">
				<div class="section-title">${title}</div>
				${renderFunction(data)}
			</div>
		`;
	} catch (error) {
		console.error(`Error rendering section ${title}:`, error);
		return buildEmptySection(title);
	}
}

/**
 * Build empty section for "No data available" states
 */
export function buildEmptySection(title: string): string {
	return `
		<div class="section">
			<div class="section-title">${title}</div>
			<div class="info-box">
				<div class="info-box-content no-data">
					No data available for this section
				</div>
			</div>
		</div>
	`;
}

/**
 * Safely render a section with error handling
 */
export function safelyRenderSection<T>(
	data: T | undefined,
	renderFn: (data: T) => string,
	fallback: string
): string {
	try {
		return data ? renderFn(data) : fallback;
	} catch (error) {
		console.error('Section render error:', error);
		return fallback;
	}
}

// ===== Vehicle Images Section =====

export function buildVehicleImagesSection(images?: ImageResult[]): string {
	if (!images || images.length === 0) {
		return buildEmptySection('Vehicle Images');
	}

	// Display up to 4 images in 2x2 grid
	const displayImages = images.slice(0, 4);

	return `
		<div class="section">
			<div class="section-title">Vehicle Images</div>
			<div class="image-grid">
				${displayImages.map(img => `
					<div class="image-container">
						<img src="${img.url}" alt="Vehicle image from ${img.source}" />
						<div class="image-metadata">
							<strong>Source:</strong> ${img.source} | 
							<strong>Match:</strong> ${img.matchType}
							${img.metadata.date ? ` | <strong>Date:</strong> ${img.metadata.date}` : ''}
						</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

// ===== Ownership History Section =====

export function buildOwnershipHistorySection(ownership?: OwnershipHistory): string {
	if (!ownership || !ownership.owners || ownership.owners.length === 0) {
		return buildEmptySection('Ownership History');
	}

	return `
		<div class="section">
			<div class="section-title">Ownership History</div>
			${ownership.numberOfOwners ? `<p><strong>Total Owners:</strong> ${ownership.numberOfOwners}</p>` : ''}
			<table class="data-table">
				<thead>
					<tr>
						<th>Owner #</th>
						<th>Start Date</th>
						<th>End Date</th>
						<th>State</th>
						<th class="number">Duration (months)</th>
					</tr>
				</thead>
				<tbody>
					${ownership.owners.map(owner => `
						<tr>
							<td>${owner.ownerNumber}</td>
							<td>${owner.startDate || 'N/A'}</td>
							<td>${owner.endDate || 'Current'}</td>
							<td>${owner.state || 'N/A'}</td>
							<td class="number">${owner.durationMonths || 'N/A'}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Sale History Section =====

export function buildSaleHistorySection(sales?: SaleHistory): string {
	if (!sales || !sales.sales || sales.sales.length === 0) {
		return buildEmptySection('Sale History');
	}

	return `
		<div class="section">
			<div class="section-title">Sale History</div>
			<table class="data-table">
				<thead>
					<tr>
						<th>Date</th>
						<th class="number">Price</th>
						<th>Location</th>
						<th>Type</th>
					</tr>
				</thead>
				<tbody>
					${sales.sales.map(sale => `
						<tr>
							<td>${sale.date}</td>
							<td class="number">${sale.price && sale.currency ? `${sale.currency} ${sale.price.toLocaleString()}` : 'N/A'}</td>
							<td>${sale.location || 'N/A'}</td>
							<td>${sale.saleType}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Odometer History Section =====

export function buildOdometerHistorySection(odometer?: OdometerHistory): string {
	if (!odometer || !odometer.readings || odometer.readings.length === 0) {
		return buildEmptySection('Odometer History');
	}

	return `
		<div class="section">
			<div class="section-title">Odometer History</div>
			${odometer.rollbackDetected ? `
				<div class="warning-box">
					<div class="warning-box-title">⚠ Rollback Detected</div>
					<p>This vehicle has a detected odometer rollback. Exercise caution.</p>
				</div>
			` : ''}
			<table class="data-table">
				<thead>
					<tr>
						<th>Date</th>
						<th class="number">Mileage</th>
						<th>Source</th>
						<th>Verified</th>
					</tr>
				</thead>
				<tbody>
					${odometer.readings.map(reading => `
						<tr>
							<td>${reading.date}</td>
							<td class="number">${reading.mileage.toLocaleString()}</td>
							<td>${reading.source}</td>
							<td>${reading.verified ? '✓ Yes' : '✗ No'}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Title History Section =====

export function buildTitleHistorySection(titleHistory?: TitleHistory): string {
	if (!titleHistory || !titleHistory.records || titleHistory.records.length === 0) {
		return buildEmptySection('Title History');
	}

	return `
		<div class="section">
			<div class="section-title">Title History</div>
			<table class="data-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>State</th>
						<th>Title Number</th>
						<th>Transfer Type</th>
					</tr>
				</thead>
				<tbody>
					${titleHistory.records.map(record => `
						<tr>
							<td>${record.date}</td>
							<td>${record.state}</td>
							<td>${record.titleNumber || 'N/A'}</td>
							<td>${record.transferType}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Inspection History Section =====

export function buildInspectionHistorySection(inspections?: InspectionHistory): string {
	if (!inspections || 
		(!inspections.emissions || inspections.emissions.length === 0) && 
		(!inspections.safety || inspections.safety.length === 0)) {
		return buildEmptySection('Inspection History');
	}

	return `
		<div class="section">
			<div class="section-title">Inspection History</div>
			
			${inspections.emissions && inspections.emissions.length > 0 ? `
				<div class="subsection-title">Emissions Inspections</div>
				<table class="data-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Location</th>
							<th>Result</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						${inspections.emissions.map(inspection => `
							<tr>
								<td>${inspection.date}</td>
								<td>${inspection.location}</td>
								<td><span class="status-badge ${inspection.result}">${inspection.result.toUpperCase()}</span></td>
								<td>${inspection.notes || 'N/A'}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			` : ''}
			
			${inspections.safety && inspections.safety.length > 0 ? `
				<div class="subsection-title">Safety Inspections</div>
				<table class="data-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Location</th>
							<th>Result</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						${inspections.safety.map(inspection => `
							<tr>
								<td>${inspection.date}</td>
								<td>${inspection.location}</td>
								<td><span class="status-badge ${inspection.result}">${inspection.result.toUpperCase()}</span></td>
								<td>${inspection.notes || 'N/A'}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			` : ''}
		</div>
	`;
}

// ===== Insurance History Section =====

export function buildInsuranceHistorySection(insurance?: InsuranceHistory): string {
	if (!insurance || !insurance.records || insurance.records.length === 0) {
		return buildEmptySection('Insurance History');
	}

	return `
		<div class="section">
			<div class="section-title">Insurance History</div>
			<table class="data-table">
				<thead>
					<tr>
						<th>Claim Date</th>
						<th>Type</th>
						<th class="number">Amount</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					${insurance.records.map(record => `
						<tr>
							<td>${record.claimDate}</td>
							<td>${record.claimType}</td>
							<td class="number">${record.amount ? `$${record.amount.toLocaleString()}` : 'N/A'}</td>
							<td><span class="status-badge ${record.status}">${record.status.toUpperCase()}</span></td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Junk and Salvage Section =====

export function buildJunkSalvageSection(junkSalvage?: JunkSalvageInfo): string {
	if (!junkSalvage || !junkSalvage.records || junkSalvage.records.length === 0) {
		return buildEmptySection('Junk & Salvage Information');
	}

	const hasWarning = junkSalvage.isSalvage || junkSalvage.isJunk;

	return `
		<div class="section">
			<div class="section-title">Junk & Salvage Information</div>
			
			${hasWarning ? `
				<div class="warning-box">
					<div class="warning-box-title">⚠ Warning</div>
					<p>
						${junkSalvage.isSalvage ? 'This vehicle has a salvage title. ' : ''}
						${junkSalvage.isJunk ? 'This vehicle has been designated as junk. ' : ''}
					</p>
				</div>
			` : ''}
			
			<table class="data-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>Reason</th>
						<th>Auction House</th>
					</tr>
				</thead>
				<tbody>
					${junkSalvage.records.map(record => `
						<tr>
							<td>${record.date}</td>
							<td>${record.type}</td>
							<td>${record.reason || 'N/A'}</td>
							<td>${record.auctionHouse || 'N/A'}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Damage Diagram SVG Generation =====

export function generateDamageDiagramSVG(vehicleType: string, damageAreas: DamageArea[]): string {
	// Vehicle outlines (top view) based on type
	const vehicleOutlines: Record<string, string> = {
		sedan: `
			<rect x="200" y="100" width="200" height="200" fill="none" stroke="#cbd5e1" stroke-width="2" rx="20"/>
			<rect x="220" y="120" width="160" height="160" fill="none" stroke="#cbd5e1" stroke-width="1"/>
		`,
		suv: `
			<rect x="180" y="80" width="240" height="240" fill="none" stroke="#cbd5e1" stroke-width="2" rx="25"/>
			<rect x="200" y="100" width="200" height="200" fill="none" stroke="#cbd5e1" stroke-width="1"/>
		`,
		truck: `
			<rect x="200" y="100" width="200" height="120" fill="none" stroke="#cbd5e1" stroke-width="2" rx="15"/>
			<rect x="200" y="220" width="200" height="80" fill="none" stroke="#cbd5e1" stroke-width="2" rx="10"/>
		`,
		van: `
			<rect x="180" y="80" width="240" height="240" fill="none" stroke="#cbd5e1" stroke-width="2" rx="30"/>
			<rect x="200" y="100" width="200" height="200" fill="none" stroke="#cbd5e1" stroke-width="1"/>
		`
	};

	const outline = vehicleOutlines[vehicleType.toLowerCase()] || vehicleOutlines.sedan;

	// Damage area coordinates (approximate positions on vehicle)
	const damageCoordinates: Record<string, { x: number; y: number; width: number; height: number }> = {
		'front': { x: 250, y: 80, width: 100, height: 40 },
		'rear': { x: 250, y: 280, width: 100, height: 40 },
		'left-side': { x: 180, y: 150, width: 40, height: 100 },
		'right-side': { x: 380, y: 150, width: 40, height: 100 },
		'roof': { x: 250, y: 150, width: 100, height: 100 },
		'undercarriage': { x: 250, y: 180, width: 100, height: 60 }
	};

	// Severity colors
	const severityColors: Record<string, string> = {
		minor: '#93c5fd',
		moderate: '#fb923c',
		severe: '#f87171'
	};

	if (damageAreas.length === 0) {
		return `
			<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
				${outline}
				<text x="300" y="360" text-anchor="middle" font-size="14" fill="#64748b">No damage reported</text>
			</svg>
		`;
	}

	const damageHighlights = damageAreas.map(damage => {
		const coords = damageCoordinates[damage.area];
		const color = severityColors[damage.severity];
		if (!coords) return '';
		return `<rect x="${coords.x}" y="${coords.y}" width="${coords.width}" height="${coords.height}" fill="${color}" opacity="0.7" stroke="${color}" stroke-width="2"/>`;
	}).join('');

	return `
		<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
			${outline}
			${damageHighlights}
			<text x="300" y="20" text-anchor="middle" font-size="16" font-weight="600" fill="#0f172a">Damage Diagram</text>
		</svg>
	`;
}

// ===== Accident History Section =====

export function buildAccidentHistorySection(accidents?: AccidentHistory): string {
	if (!accidents || !accidents.accidents || accidents.accidents.length === 0) {
		return buildEmptySection('Accident History');
	}

	return `
		<div class="section">
			<div class="section-title">Accident History</div>
			<p><strong>Total Accidents:</strong> ${accidents.totalAccidents}</p>
			
			${accidents.accidents.map((accident, index) => `
				<div class="mb-3">
					<div class="subsection-title">Accident #${index + 1} - ${accident.date}</div>
					<table class="data-table">
						<tr>
							<td>Severity</td>
							<td><span class="status-badge ${accident.severity === 'severe' ? 'fail' : accident.severity === 'moderate' ? 'warning' : 'pass'}">${accident.severity.toUpperCase()}</span></td>
						</tr>
						<tr>
							<td>Airbag Deployment</td>
							<td>${accident.airbagDeployment ? 'Yes' : 'No'}</td>
						</tr>
						<tr>
							<td>Estimated Cost</td>
							<td class="number">${accident.estimatedCost ? `$${accident.estimatedCost.toLocaleString()}` : 'N/A'}</td>
						</tr>
						<tr>
							<td>Location</td>
							<td>${accident.location || 'N/A'}</td>
						</tr>
					</table>
					
					${accident.damageAreas && accident.damageAreas.length > 0 ? `
						<div class="damage-diagram">
							${generateDamageDiagramSVG('sedan', accident.damageAreas)}
							<div class="damage-legend">
								<div class="legend-item">
									<div class="legend-color minor"></div>
									<span>Minor</span>
								</div>
								<div class="legend-item">
									<div class="legend-color moderate"></div>
									<span>Moderate</span>
								</div>
								<div class="legend-item">
									<div class="legend-color severe"></div>
									<span>Severe</span>
								</div>
							</div>
						</div>
					` : ''}
				</div>
			`).join('')}
		</div>
	`;
}

// ===== Lien and Impound Section =====

export function buildLienImpoundSection(lienImpound?: LienImpoundHistory): string {
	if (!lienImpound || 
		(!lienImpound.liens || lienImpound.liens.length === 0) && 
		(!lienImpound.impounds || lienImpound.impounds.length === 0)) {
		return buildEmptySection('Lien & Impound Records');
	}

	return `
		<div class="section">
			<div class="section-title">Lien & Impound Records</div>
			
			${lienImpound.liens && lienImpound.liens.length > 0 ? `
				<div class="subsection-title">Liens</div>
				<table class="data-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Holder</th>
							<th class="number">Amount</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						${lienImpound.liens.map(lien => `
							<tr>
								<td>${lien.date}</td>
								<td>${lien.holder}</td>
								<td class="number">${lien.amount ? `$${lien.amount.toLocaleString()}` : 'N/A'}</td>
								<td><span class="status-badge ${lien.status}">${lien.status.toUpperCase()}</span></td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			` : ''}
			
			${lienImpound.impounds && lienImpound.impounds.length > 0 ? `
				<div class="subsection-title">Impounds</div>
				<table class="data-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Location</th>
							<th>Reason</th>
							<th>Release Date</th>
						</tr>
					</thead>
					<tbody>
						${lienImpound.impounds.map(impound => `
							<tr>
								<td>${impound.date}</td>
								<td>${impound.location}</td>
								<td>${impound.reason}</td>
								<td>${impound.releaseDate || 'Not Released'}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			` : ''}
		</div>
	`;
}

// ===== Theft History Section =====

export function buildTheftHistorySection(theft?: TheftHistory): string {
	if (!theft || !theft.records || theft.records.length === 0) {
		return buildEmptySection('Theft History');
	}

	return `
		<div class="section">
			<div class="section-title">Theft History</div>
			
			${theft.isStolen ? `
				<div class="error-box">
					<div class="error-box-title">⚠ STOLEN VEHICLE</div>
					<p>This vehicle is currently reported as stolen. Do not purchase.</p>
				</div>
			` : ''}
			
			<table class="data-table">
				<thead>
					<tr>
						<th>Report Date</th>
						<th>Recovery Date</th>
						<th>Location</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					${theft.records.map(record => `
						<tr>
							<td>${record.reportDate}</td>
							<td>${record.recoveryDate || 'Not Recovered'}</td>
							<td>${record.location}</td>
							<td><span class="status-badge ${record.status === 'stolen' ? 'fail' : 'pass'}">${record.status.toUpperCase()}</span></td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Title Brands Section =====

export function buildTitleBrandsSection(titleBrands?: TitleBrands): string {
	if (!titleBrands || !titleBrands.brands || titleBrands.brands.length === 0) {
		return buildEmptySection('Title Brands');
	}

	const warningBrands = ['salvage', 'flood', 'lemon'];

	return `
		<div class="section">
			<div class="section-title">Title Brands</div>
			
			${titleBrands.brands.some(b => warningBrands.includes(b.brand)) ? `
				<div class="warning-box">
					<div class="warning-box-title">⚠ Warning</div>
					<p>This vehicle has title brands that may affect its value and safety.</p>
				</div>
			` : ''}
			
			<table class="data-table">
				<thead>
					<tr>
						<th>Brand Type</th>
						<th>Date</th>
						<th>State</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					${titleBrands.brands.map(brand => `
						<tr>
							<td><span class="status-badge ${warningBrands.includes(brand.brand) ? 'warning' : 'pass'}">${brand.brand.toUpperCase()}</span></td>
							<td>${brand.date}</td>
							<td>${brand.state}</td>
							<td>${brand.description || 'N/A'}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

// ===== Market Value Section =====

export function buildMarketValueSection(marketValue?: MarketValue): string {
	if (!marketValue) {
		return buildEmptySection('Market Value');
	}

	return `
		<div class="section">
			<div class="section-title">Market Value</div>
			<table class="data-table">
				<tr>
					<td>Current Value</td>
					<td class="number">${marketValue.currentValue ? `${marketValue.currency} ${marketValue.currentValue.toLocaleString()}` : 'N/A'}</td>
				</tr>
				<tr>
					<td>Source</td>
					<td>${marketValue.source}</td>
				</tr>
				<tr>
					<td>Valuation Date</td>
					<td>${marketValue.date}</td>
				</tr>
				${marketValue.condition ? `
					<tr>
						<td>Condition</td>
						<td>${marketValue.condition.toUpperCase()}</td>
					</tr>
				` : ''}
				${marketValue.mileageAdjustment ? `
					<tr>
						<td>Mileage Adjustment</td>
						<td class="number">${marketValue.currency} ${marketValue.mileageAdjustment.toLocaleString()}</td>
					</tr>
				` : ''}
			</table>
		</div>
	`;
}

// ===== Warranty Information Section =====

export function buildWarrantySection(warranty?: WarrantyInfo): string {
	if (!warranty || (!warranty.manufacturer && (!warranty.extended || warranty.extended.length === 0))) {
		return buildEmptySection('Warranty Information');
	}

	return `
		<div class="section">
			<div class="section-title">Warranty Information</div>
			
			${warranty.manufacturer ? `
				<div class="subsection-title">Manufacturer Warranty</div>
				<table class="data-table">
					<tr>
						<td>Type</td>
						<td>${warranty.manufacturer.type}</td>
					</tr>
					<tr>
						<td>Start Date</td>
						<td>${warranty.manufacturer.startDate}</td>
					</tr>
					<tr>
						<td>End Date</td>
						<td>${warranty.manufacturer.endDate}</td>
					</tr>
					${warranty.manufacturer.mileageLimit ? `
						<tr>
							<td>Mileage Limit</td>
							<td class="number">${warranty.manufacturer.mileageLimit.toLocaleString()} miles</td>
						</tr>
					` : ''}
					<tr>
						<td>Provider</td>
						<td>${warranty.manufacturer.provider}</td>
					</tr>
					<tr>
						<td>Status</td>
						<td><span class="status-badge ${warranty.manufacturer.status}">${warranty.manufacturer.status.toUpperCase()}</span></td>
					</tr>
				</table>
			` : ''}
			
			${warranty.extended && warranty.extended.length > 0 ? `
				<div class="subsection-title">Extended Warranties</div>
				${warranty.extended.map((ext, index) => `
					<div class="mb-2">
						<strong>Extended Warranty #${index + 1}</strong>
						<table class="data-table">
							<tr>
								<td>Type</td>
								<td>${ext.type}</td>
							</tr>
							<tr>
								<td>Start Date</td>
								<td>${ext.startDate}</td>
							</tr>
							<tr>
								<td>End Date</td>
								<td>${ext.endDate}</td>
							</tr>
							${ext.mileageLimit ? `
								<tr>
									<td>Mileage Limit</td>
									<td class="number">${ext.mileageLimit.toLocaleString()} miles</td>
								</tr>
							` : ''}
							<tr>
								<td>Provider</td>
								<td>${ext.provider}</td>
							</tr>
							<tr>
								<td>Status</td>
								<td><span class="status-badge ${ext.status}">${ext.status.toUpperCase()}</span></td>
							</tr>
						</table>
					</div>
				`).join('')}
			` : ''}
		</div>
	`;
}

export function buildReportHTML(
	data: ComprehensiveVehicleData,
	options: ReportOptions = {}
): string {
	const vehicleName = `${data.identification.modelYear} ${data.identification.make} ${data.identification.model}`;
	const trim = data.identification.trim ? ` ${data.identification.trim}` : '';
	const reportDate = new Date().toLocaleDateString('en-NG', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});

	// Helper function to safely render sections with error handling
	const safeRender = (sectionName: string, renderFn: () => string): string => {
		try {
			return renderFn();
		} catch (error) {
			console.warn(`Error rendering section ${sectionName}:`, error);
			return buildEmptySection(sectionName);
		}
	};

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>${pdfStyles}</style>
</head>
<body>
	<div class="page">
		<!-- Header -->
		<div class="header">
			<div class="header-content">
				<div class="brand-section">
					<div class="logo">MotoCheck</div>
					<div class="tagline">Comprehensive Vehicle History Report</div>
				</div>
				<div class="report-meta">
					<div><strong>Report Date:</strong> ${reportDate}</div>
					<div><strong>Report ID:</strong> ${data.identification.vin.slice(-8).toUpperCase()}</div>
				</div>
			</div>
		</div>

		<!-- Vehicle Title Bar -->
		<div class="vehicle-title-bar">
			<div class="vehicle-name">${vehicleName}${trim}</div>
			<div class="vin-display">VIN: ${data.identification.vin}</div>
		</div>

		<!-- Content -->
		<div class="content">
			${safeRender('Vehicle Images', () => buildVehicleImagesSection(data.images))}
			${safeRender('Vehicle Specifications', () => buildSpecificationsSection(data))}
			${safeRender('Engine & Performance', () => buildEngineSection(data))}
			${safeRender('Transmission & Drivetrain', () => buildTransmissionSection(data))}
			${safeRender('Dimensions & Capacity', () => buildDimensionsSection(data))}
			${safeRender('Safety Features', () => buildSafetySection(data))}
			${safeRender('Manufacturing Information', () => buildManufacturingSection(data))}
			${safeRender('Safety Recalls', () => buildRecallsSection(data))}
			${safeRender('Ownership History', () => buildOwnershipHistorySection(data.ownership))}
			${safeRender('Sale History', () => buildSaleHistorySection(data.sales))}
			${safeRender('Odometer History', () => buildOdometerHistorySection(data.odometer))}
			${safeRender('Title History', () => buildTitleHistorySection(data.titleHistory))}
			${safeRender('Inspection History', () => buildInspectionHistorySection(data.inspections))}
			${safeRender('Insurance History', () => buildInsuranceHistorySection(data.insurance))}
			${safeRender('Junk & Salvage Information', () => buildJunkSalvageSection(data.junkSalvage))}
			${safeRender('Accident History', () => buildAccidentHistorySection(data.accidents))}
			${safeRender('Lien & Impound Records', () => buildLienImpoundSection(data.lienImpound))}
			${safeRender('Theft History', () => buildTheftHistorySection(data.theft))}
			${safeRender('Title Brands', () => buildTitleBrandsSection(data.titleBrands))}
			${safeRender('Market Value', () => buildMarketValueSection(data.marketValue))}
			${safeRender('Warranty Information', () => buildWarrantySection(data.warranty))}
			${safeRender('NCS Valuation', () => buildValuationSection(options))}
			${safeRender('Nigerian Import Duty Breakdown', () => buildDutySection(options))}
		</div>

		<!-- Footer -->
		<div class="footer">
			<div class="footer-grid">
				<div class="footer-section">
					<h4>Report Information</h4>
					<p>
						This report was generated on ${reportDate} using data from the National Highway Traffic Safety Administration (NHTSA) 
						Vehicle Product Information Catalog and other public sources.
					</p>
				</div>
				<div class="footer-section">
					<h4>Disclaimer</h4>
					<p>
						Information accuracy depends on source data quality. This report should be used as a reference guide. 
						Always verify critical details independently before making purchase decisions.
					</p>
				</div>
			</div>
			<div class="footer-brand">
				<strong>MotoCheck</strong> - Professional Vehicle Reports for Nigeria | www.motocheck.ng
			</div>
		</div>
	</div>
</body>
</html>
	`;
}
