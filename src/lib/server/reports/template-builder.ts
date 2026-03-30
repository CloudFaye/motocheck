/**
 * PDF Template Builder
 * Builds HTML templates for vehicle reports from comprehensive vehicle data
 */

import type { ComprehensiveVehicleData } from '../vehicle/types';
import { PDF_STYLES } from './pdf-styles';

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

/**
 * Build vehicle specifications section
 */
function buildSpecificationsSection(data: ComprehensiveVehicleData): string {
	const specs = [
		{ label: 'Make', value: data.identification.make },
		{ label: 'Model', value: data.identification.model },
		{ label: 'Year', value: data.identification.modelYear },
		{ label: 'Series', value: data.identification.series },
		{ label: 'Trim', value: data.identification.trim },
		{ label: 'Body Class', value: data.body.bodyClass },
		{ label: 'Vehicle Type', value: data.identification.vehicleType },
		{ label: 'Doors', value: data.dimensions.doors }
	].filter(spec => spec.value);

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">🚗</div>
				<div class="section-title">Vehicle Specifications</div>
			</div>
			<div class="info-grid">
				${specs.map(spec => `
					<div class="info-card">
						<div class="info-label">${spec.label}</div>
						<div class="info-value">${spec.value}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build engine section
 */
function buildEngineSection(data: ComprehensiveVehicleData): string {
	const engine = data.engine;
	const specs = [
		{ label: 'Engine Model', value: engine.model },
		{ label: 'Configuration', value: engine.configuration },
		{ label: 'Cylinders', value: engine.cylinders },
		{ label: 'Displacement', value: engine.displacementL ? `${engine.displacementL}L` : engine.displacementCC ? `${engine.displacementCC}cc` : '' },
		{ label: 'Power Output', value: engine.power ? `${engine.power} kW` : '' },
		{ label: 'Fuel Type', value: engine.fuelTypePrimary },
		{ label: 'Turbo', value: engine.turbo },
		{ label: 'Manufacturer', value: engine.manufacturer }
	].filter(spec => spec.value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">⚙️</div>
				<div class="section-title">Engine & Performance</div>
			</div>
			<div class="info-grid">
				${specs.map(spec => `
					<div class="info-card">
						<div class="info-label">${spec.label}</div>
						<div class="info-value">${spec.value}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build transmission section
 */
function buildTransmissionSection(data: ComprehensiveVehicleData): string {
	const trans = data.transmission;
	const specs = [
		{ label: 'Transmission', value: trans.transmissionStyle },
		{ label: 'Speeds', value: trans.transmissionSpeeds },
		{ label: 'Drive Type', value: trans.driveType }
	].filter(spec => spec.value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">🔧</div>
				<div class="section-title">Transmission & Drivetrain</div>
			</div>
			<div class="info-grid info-grid-3">
				${specs.map(spec => `
					<div class="info-card">
						<div class="info-label">${spec.label}</div>
						<div class="info-value">${spec.value}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build dimensions section
 */
function buildDimensionsSection(data: ComprehensiveVehicleData): string {
	const dims = data.dimensions;
	const specs = [
		{ label: 'Wheelbase', value: dims.wheelBaseShort || dims.wheelBaseLong ? `${dims.wheelBaseShort || dims.wheelBaseLong}"` : '' },
		{ label: 'GVWR', value: dims.gvwr || dims.gvwrRange },
		{ label: 'Curb Weight', value: dims.curbWeight ? `${dims.curbWeight} lbs` : '' },
		{ label: 'Seats', value: data.body.numberOfSeats },
		{ label: 'Seat Rows', value: data.body.numberOfSeatRows },
		{ label: 'Bed Length', value: dims.bedLength ? `${dims.bedLength}"` : '' }
	].filter(spec => spec.value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">📏</div>
				<div class="section-title">Dimensions & Capacity</div>
			</div>
			<div class="info-grid info-grid-3">
				${specs.map(spec => `
					<div class="info-card">
						<div class="info-label">${spec.label}</div>
						<div class="info-value">${spec.value}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build safety features section
 */
function buildSafetySection(data: ComprehensiveVehicleData): string {
	const safety = data.safety;
	const features = [
		{ label: 'Front Airbags', value: safety.airBagLocFront, icon: '✓' },
		{ label: 'Side Airbags', value: safety.airBagLocSide, icon: '✓' },
		{ label: 'Curtain Airbags', value: safety.airBagLocCurtain, icon: '✓' },
		{ label: 'ABS', value: safety.abs, icon: '✓' },
		{ label: 'ESC', value: safety.esc, icon: '✓' },
		{ label: 'Traction Control', value: safety.tractionControl, icon: '✓' },
		{ label: 'Pretensioner', value: safety.pretensioner, icon: '✓' },
		{ label: 'Brake System', value: safety.brakeSystemType, icon: '✓' }
	].filter(feat => feat.value);

	if (features.length === 0) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">🛡️</div>
				<div class="section-title">Safety Features</div>
			</div>
			<div class="feature-list">
				${features.map(feat => `
					<div class="feature-item">
						<div class="feature-icon">${feat.icon}</div>
						<span>${feat.label}: ${feat.value}</span>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build manufacturing section
 */
function buildManufacturingSection(data: ComprehensiveVehicleData): string {
	const mfg = data.manufacturing;
	const specs = [
		{ label: 'Manufacturer', value: data.identification.manufacturer },
		{ label: 'Plant Location', value: [mfg.plantCity, mfg.plantState, mfg.plantCountry].filter(Boolean).join(', ') },
		{ label: 'Plant Company', value: mfg.plantCompanyName },
		{ label: 'Destination Market', value: data.market.destinationMarket }
	].filter(spec => spec.value);

	if (specs.length === 0) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">🏭</div>
				<div class="section-title">Manufacturing Information</div>
			</div>
			<div class="info-grid">
				${specs.map(spec => `
					<div class="info-card">
						<div class="info-label">${spec.label}</div>
						<div class="info-value">${spec.value}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
}

/**
 * Build recalls section
 */
function buildRecallsSection(data: ComprehensiveVehicleData): string {
	if (data.recalls.length === 0) {
		return `
			<div class="section">
				<div class="section-header">
					<div class="section-icon">✓</div>
					<div class="section-title">Safety Recalls</div>
				</div>
				<div class="info-card">
					<div class="info-value" style="color: #10b981;">
						✓ No open recalls found for this vehicle
					</div>
				</div>
			</div>
		`;
	}

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">⚠️</div>
				<div class="section-title">Safety Recalls (${data.recalls.length})</div>
			</div>
			${data.recalls.map(recall => `
				<div class="recall-alert">
					<div class="recall-alert-header">
						<div class="recall-icon">!</div>
						<div class="recall-title">${recall.component}</div>
					</div>
					<div class="recall-content">
						<strong>Issue:</strong> ${recall.summary}<br>
						<strong>Consequence:</strong> ${recall.consequence}<br>
						<strong>Remedy:</strong> ${recall.remedy}
					</div>
					<div class="recall-meta">
						Campaign: ${recall.nhtsaCampaignNumber} | Reported: ${recall.reportReceivedDate}
					</div>
				</div>
			`).join('')}
		</div>
	`;
}

/**
 * Build NCS valuation section (optional)
 */
function buildValuationSection(options: ReportOptions): string {
	if (!options.includeNCSValuation || !options.cifUsd) return '';

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">💰</div>
				<div class="section-title">NCS Valuation</div>
			</div>
			<div class="info-grid">
				<div class="info-card">
					<div class="info-label">CIF Value (USD)</div>
					<div class="info-value info-value-large">$${options.cifUsd.toLocaleString()}</div>
				</div>
				<div class="info-card">
					<div class="info-label">CIF Value (NGN)</div>
					<div class="info-value info-value-large">₦${options.cifNgn?.toLocaleString()}</div>
				</div>
				<div class="info-card">
					<div class="info-label">CBN Exchange Rate</div>
					<div class="info-value">₦${options.cbnRate?.toLocaleString()}/USD</div>
				</div>
				<div class="info-card">
					<div class="info-label">Confidence Level</div>
					<div class="info-value">
						<span class="badge badge-${options.confidence === 'High' ? 'success' : options.confidence === 'Medium' ? 'warning' : 'info'}">
							${options.confidence}
						</span>
					</div>
				</div>
			</div>
		</div>
	`;
}

/**
 * Build duty breakdown section (optional)
 */
function buildDutySection(options: ReportOptions): string {
	if (!options.includeDutyBreakdown || !options.dutyBreakdown) return '';

	const duty = options.dutyBreakdown;

	return `
		<div class="section">
			<div class="section-header">
				<div class="section-icon">📊</div>
				<div class="section-title">Nigerian Import Duty Breakdown</div>
			</div>
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

/**
 * Build complete HTML report
 */
export function buildReportHTML(
	data: ComprehensiveVehicleData,
	options: ReportOptions = {}
): string {
	const vehicleName = `${data.identification.modelYear} ${data.identification.make} ${data.identification.model}`;
	const trim = data.identification.trim ? ` ${data.identification.trim}` : '';

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>${PDF_STYLES}</style>
</head>
<body>
	<div class="page">
		<!-- Header -->
		<div class="header">
			<div class="brand">
				<div class="logo">Moto<span class="logo-accent">Check</span></div>
			</div>
			<div class="tagline">Comprehensive Vehicle Report</div>
		</div>

		<!-- Vehicle Hero -->
		<div class="vehicle-hero">
			<div class="vehicle-title">${vehicleName}${trim}</div>
			<div class="vin-display">VIN: ${data.identification.vin}</div>
		</div>

		<!-- Content -->
		<div class="content">
			${buildSpecificationsSection(data)}
			${buildEngineSection(data)}
			${buildTransmissionSection(data)}
			${buildDimensionsSection(data)}
			${buildSafetySection(data)}
			${buildManufacturingSection(data)}
			${buildRecallsSection(data)}
			${buildValuationSection(options)}
			${buildDutySection(options)}
		</div>

		<!-- Footer -->
		<div class="footer">
			<div class="footer-grid">
				<div class="footer-section">
					<h4>Report Information</h4>
					<p>
						<strong>Generated:</strong> ${new Date().toLocaleString('en-NG')}<br>
						<strong>Report ID:</strong> ${data.identification.vin.slice(-8)}<br>
						<strong>Data Source:</strong> NHTSA Vehicle Database
					</p>
				</div>
				<div class="footer-section">
					<h4>Disclaimer</h4>
					<p>
						This report is based on data from NHTSA and other public sources. 
						Information accuracy depends on source data quality. 
						Always verify critical details independently.
					</p>
				</div>
			</div>
			<div class="footer-brand">
				<strong>MotoCheck</strong> - Professional Vehicle Reports for Nigeria
			</div>
		</div>
	</div>
</body>
</html>
	`;
}
