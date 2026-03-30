/**
 * PDF Template Builder
 * Clean, professional layout for vehicle reports
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
