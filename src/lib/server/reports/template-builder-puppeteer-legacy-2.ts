/**
 * Improved PDF Template Builder
 * Carfax-inspired professional layout for vehicle reports
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
import { pdfStyles } from './pdf-styles-puppeteer-legacy';

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

// ===== HTML Template Builder =====

export function buildReportHTML(
  vehicleData: ComprehensiveVehicleData, 
  options: ReportOptions = {}
): string {
  const reportDate = new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reportId = vehicleData.identification.vin.slice(-8).toUpperCase();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vehicle History Report - ${vehicleData.identification.vin}</title>
  <style>${pdfStyles}</style>
</head>
<body>
  <div class="report-container">
    ${buildHeader(vehicleData, reportDate, reportId)}
    ${buildHighlightsSection(vehicleData)}
    <div class="report-content">
      ${buildVehicleImagesSection(vehicleData.images)}
      ${buildSpecificationsSection(vehicleData)}
      ${buildEngineSection(vehicleData)}
      ${buildTransmissionSection(vehicleData)}
      ${buildDimensionsSection(vehicleData)}
      ${buildSafetySection(vehicleData)}
      ${buildManufacturingSection(vehicleData)}
      ${buildRecallsSection(vehicleData)}
      ${buildOwnershipHistorySection(vehicleData.ownership)}
      ${buildSaleHistorySection(vehicleData.sales)}
      ${buildOdometerHistorySection(vehicleData.odometer)}
      ${buildTitleHistorySection(vehicleData.titleHistory)}
      ${buildInspectionHistorySection(vehicleData.inspections)}
      ${buildInsuranceHistorySection(vehicleData.insurance)}
      ${buildJunkSalvageSection(vehicleData.junkSalvage)}
      ${buildAccidentHistorySection(vehicleData.accidents)}
      ${buildLienImpoundSection(vehicleData.lienImpound)}
      ${buildTheftHistorySection(vehicleData.theft)}
      ${buildTitleBrandsSection(vehicleData.titleBrands)}
      ${buildMarketValueSection(vehicleData.marketValue)}
      ${buildWarrantySection(vehicleData.warranty)}
      ${buildValuationSection(options)}
      ${buildDutySection(options)}
    </div>
    ${buildFooter(vehicleData, reportDate, reportId)}
  </div>
</body>
</html>
  `;
}

// ===== Header Section =====

function buildHeader(
  data: ComprehensiveVehicleData, 
  reportDate: string, 
  reportId: string
): string {
  const vehicleName = `${data.identification.modelYear} ${data.identification.make} ${data.identification.model}`;
  const trim = data.identification.trim ? ` ${data.identification.trim}` : '';
  
  return `
    <div class="report-header">
      <div class="header-top">
        <div class="logo-section">
          <div class="logo-icon">M</div>
          <div>
            <div class="logo-text">MotoCheck</div>
            <div class="logo-subtitle">Professional Vehicle Reports</div>
          </div>
        </div>
        <div class="report-meta">
          <div class="report-type">Vehicle History Report</div>
          <div class="report-date">Generated: ${reportDate}</div>
          <div class="report-id">Report ID: ${reportId}</div>
        </div>
      </div>
      <div class="vehicle-summary">
        <div class="vehicle-name">${vehicleName}${trim}</div>
        <div class="vehicle-vin">VIN: ${data.identification.vin}</div>
      </div>
    </div>
  `;
}

// ===== Highlights Section =====

function buildHighlightsSection(data: ComprehensiveVehicleData): string {
  const accidentCount = data.accidents?.totalAccidents || 0;
  const ownerCount = data.ownership?.numberOfOwners || 'Unknown';
  const recallCount = data.recalls?.length || 0;
  const hasTheft = data.theft?.isStolen || false;
  
  return `
    <div class="highlights-section">
      <div class="highlights-grid">
        <div class="highlight-card">
          <div class="highlight-icon">🚗</div>
          <div class="highlight-value">${ownerCount}</div>
          <div class="highlight-label">Previous Owners</div>
          <span class="highlight-status ${accidentCount === 0 ? 'status-clean' : 'status-warning'}">
            ${accidentCount === 0 ? 'Clean Title' : 'Check History'}
          </span>
        </div>
        <div class="highlight-card">
          <div class="highlight-icon">⚠️</div>
          <div class="highlight-value">${accidentCount}</div>
          <div class="highlight-label">Accidents Reported</div>
          <span class="highlight-status ${accidentCount === 0 ? 'status-clean' : accidentCount > 1 ? 'status-alert' : 'status-warning'}">
            ${accidentCount === 0 ? 'No Accidents' : accidentCount > 1 ? 'Multiple' : '1 Accident'}
          </span>
        </div>
        <div class="highlight-card">
          <div class="highlight-icon">🔧</div>
          <div class="highlight-value">${recallCount}</div>
          <div class="highlight-label">Open Recalls</div>
          <span class="highlight-status ${recallCount === 0 ? 'status-clean' : 'status-warning'}">
            ${recallCount === 0 ? 'No Recalls' : `${recallCount} Open`}
          </span>
        </div>
        <div class="highlight-card">
          <div class="highlight-icon">🔒</div>
          <div class="highlight-value">${hasTheft ? 'Yes' : 'No'}</div>
          <div class="highlight-label">Theft Record</div>
          <span class="highlight-status ${hasTheft ? 'status-alert' : 'status-clean'}">
            ${hasTheft ? 'Stolen' : 'Clean'}
          </span>
        </div>
      </div>
    </div>
  `;
}

// ===== Vehicle Images Section =====

function buildVehicleImagesSection(images?: ImageResult[]): string {
  if (!images || images.length === 0) {
    return '';
  }

  const displayImages = images.slice(0, 4);

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📷</div>
        <h2 class="section-title">Vehicle Images</h2>
      </div>
      <div class="image-grid">
        ${displayImages.map(img => `
          <div class="image-container">
            <img src="${img.url}" alt="Vehicle image from ${img.source}" />
            <div class="image-metadata">
              Source: ${img.source} | Match: ${img.matchType}
              ${img.metadata.date ? ` | Date: ${img.metadata.date}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== Vehicle Specifications Section =====

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

  if (specs.length === 0) return '';

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <h2 class="section-title">Vehicle Specifications</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${specs.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Engine Section =====

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
      <div class="section-header">
        <div class="section-icon">⚙️</div>
        <h2 class="section-title">Engine & Performance</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${specs.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Transmission Section =====

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
      <div class="section-header">
        <div class="section-icon">🔄</div>
        <h2 class="section-title">Transmission & Drivetrain</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${specs.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Dimensions Section =====

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
      <div class="section-header">
        <div class="section-icon">📐</div>
        <h2 class="section-title">Dimensions & Capacity</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${specs.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Safety Section =====

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
      <div class="section-header">
        <div class="section-icon">🛡️</div>
        <h2 class="section-title">Safety Features</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${features.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Manufacturing Section =====

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
      <div class="section-header">
        <div class="section-icon">🏭</div>
        <h2 class="section-title">Manufacturing Information</h2>
      </div>
      <table class="data-table">
        <tbody>
          ${specs.map(([label, value]) => `
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Recalls Section =====

function buildRecallsSection(data: ComprehensiveVehicleData): string {
  if (data.recalls.length === 0) {
    return `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🔧</div>
          <h2 class="section-title">Safety Recalls</h2>
        </div>
        <div class="success-box">
          <div class="success-box-title">✓ No Open Safety Recalls</div>
          <p>This vehicle has no open safety recalls according to NHTSA records.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔧</div>
        <h2 class="section-title">Safety Recalls (${data.recalls.length} Found)</h2>
      </div>
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

// ===== Ownership History Section =====

function buildOwnershipHistorySection(ownership?: OwnershipHistory): string {
  if (!ownership || !ownership.owners || ownership.owners.length === 0) {
    return buildEmptySection('Ownership History', '👤');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">👤</div>
        <h2 class="section-title">Ownership History</h2>
      </div>
      ${ownership.numberOfOwners ? `
        <p style="margin-bottom: 16px;"><span class="badge badge-info">Total Owners: ${ownership.numberOfOwners}</span></p>
      ` : ''}
      <table class="data-table">
        <thead>
          <tr>
            <th>Owner #</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>State</th>
            <th class="number">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${ownership.owners.map(owner => `
            <tr>
              <td>${owner.ownerNumber}</td>
              <td>${owner.startDate || 'N/A'}</td>
              <td>${owner.endDate || 'Current'}</td>
              <td>${owner.state || 'N/A'}</td>
              <td class="number">${owner.durationMonths ? `${owner.durationMonths} months` : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Sale History Section =====

function buildSaleHistorySection(sales?: SaleHistory): string {
  if (!sales || !sales.sales || sales.sales.length === 0) {
    return buildEmptySection('Sale History', '💰');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💰</div>
        <h2 class="section-title">Sale History</h2>
      </div>
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

function buildOdometerHistorySection(odometer?: OdometerHistory): string {
  if (!odometer || !odometer.readings || odometer.readings.length === 0) {
    return buildEmptySection('Odometer History', '📊');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <h2 class="section-title">Odometer History</h2>
      </div>
      ${odometer.rollbackDetected ? `
        <div class="error-box">
          <div class="error-box-title">⚠ Rollback Detected</div>
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
              <td><span class="badge ${reading.verified ? 'badge-success' : 'badge-warning'}">${reading.verified ? 'Verified' : 'Unverified'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Title History Section =====

function buildTitleHistorySection(titleHistory?: TitleHistory): string {
  if (!titleHistory || !titleHistory.records || titleHistory.records.length === 0) {
    return buildEmptySection('Title History', '📄');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📄</div>
        <h2 class="section-title">Title History</h2>
      </div>
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

function buildInspectionHistorySection(inspections?: InspectionHistory): string {
  const hasEmissions = inspections?.emissions && inspections.emissions.length > 0;
  const hasSafety = inspections?.safety && inspections.safety.length > 0;

  if (!hasEmissions && !hasSafety) {
    return buildEmptySection('Inspection History', '🔍');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔍</div>
        <h2 class="section-title">Inspection History</h2>
      </div>
      
      ${hasEmissions ? `
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
            ${inspections!.emissions!.map(inspection => `
              <tr>
                <td>${inspection.date}</td>
                <td>${inspection.location}</td>
                <td><span class="badge ${inspection.result === 'pass' ? 'badge-success' : inspection.result === 'fail' ? 'badge-error' : 'badge-warning'}">${inspection.result.toUpperCase()}</span></td>
                <td>${inspection.notes || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${hasSafety ? `
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
            ${inspections!.safety!.map(inspection => `
              <tr>
                <td>${inspection.date}</td>
                <td>${inspection.location}</td>
                <td><span class="badge ${inspection.result === 'pass' ? 'badge-success' : inspection.result === 'fail' ? 'badge-error' : 'badge-warning'}">${inspection.result.toUpperCase()}</span></td>
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

function buildInsuranceHistorySection(insurance?: InsuranceHistory): string {
  if (!insurance || !insurance.records || insurance.records.length === 0) {
    return buildEmptySection('Insurance History', '🛡️');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🛡️</div>
        <h2 class="section-title">Insurance History</h2>
      </div>
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
              <td><span class="badge ${record.status === 'resolved' ? 'badge-success' : record.status === 'denied' ? 'badge-error' : 'badge-warning'}">${record.status.toUpperCase()}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Junk and Salvage Section =====

function buildJunkSalvageSection(junkSalvage?: JunkSalvageInfo): string {
  if (!junkSalvage || !junkSalvage.records || junkSalvage.records.length === 0) {
    return buildEmptySection('Junk & Salvage Information', '⚠️');
  }

  const hasWarning = junkSalvage.isSalvage || junkSalvage.isJunk;

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚠️</div>
        <h2 class="section-title">Junk & Salvage Information</h2>
      </div>
      
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

// ===== Accident History Section =====

function buildAccidentHistorySection(accidents?: AccidentHistory): string {
  if (!accidents || !accidents.accidents || accidents.accidents.length === 0) {
    return buildEmptySection('Accident History', '💥');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💥</div>
        <h2 class="section-title">Accident History</h2>
      </div>
      <p style="margin-bottom: 16px;"><span class="badge ${accidents.totalAccidents > 1 ? 'badge-error' : 'badge-warning'}">Total Accidents: ${accidents.totalAccidents}</span></p>
      
      ${accidents.accidents.map((accident, index) => `
        <div style="margin-bottom: 24px;">
          <div class="subsection-title">Accident #${index + 1} - ${accident.date}</div>
          <table class="data-table">
            <tbody>
              <tr>
                <td>Severity</td>
                <td><span class="badge ${accident.severity === 'severe' ? 'badge-error' : accident.severity === 'moderate' ? 'badge-warning' : 'badge-success'}">${accident.severity.toUpperCase()}</span></td>
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
            </tbody>
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

function buildLienImpoundSection(lienImpound?: LienImpoundHistory): string {
  const hasLiens = lienImpound?.liens && lienImpound.liens.length > 0;
  const hasImpounds = lienImpound?.impounds && lienImpound.impounds.length > 0;

  if (!hasLiens && !hasImpounds) {
    return buildEmptySection('Lien & Impound Records', '🔒');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔒</div>
        <h2 class="section-title">Lien & Impound Records</h2>
      </div>
      
      ${hasLiens ? `
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
            ${lienImpound!.liens!.map(lien => `
              <tr>
                <td>${lien.date}</td>
                <td>${lien.holder}</td>
                <td class="number">${lien.amount ? `$${lien.amount.toLocaleString()}` : 'N/A'}</td>
                <td><span class="badge ${lien.status === 'released' ? 'badge-success' : 'badge-warning'}">${lien.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${hasImpounds ? `
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
            ${lienImpound!.impounds!.map(impound => `
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

function buildTheftHistorySection(theft?: TheftHistory): string {
  if (!theft || !theft.records || theft.records.length === 0) {
    return buildEmptySection('Theft History', '🚓');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🚓</div>
        <h2 class="section-title">Theft History</h2>
      </div>
      
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
              <td><span class="badge ${record.status === 'stolen' ? 'badge-error' : 'badge-success'}">${record.status.toUpperCase()}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Title Brands Section =====

function buildTitleBrandsSection(titleBrands?: TitleBrands): string {
  if (!titleBrands || !titleBrands.brands || titleBrands.brands.length === 0) {
    return buildEmptySection('Title Brands', '🏷️');
  }

  const warningBrands = ['salvage', 'flood', 'lemon'];
  const hasWarning = titleBrands.brands.some(b => warningBrands.includes(b.brand));

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏷️</div>
        <h2 class="section-title">Title Brands</h2>
      </div>
      
      ${hasWarning ? `
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
              <td><span class="badge ${warningBrands.includes(brand.brand) ? 'badge-error' : 'badge-info'}">${brand.brand.toUpperCase()}</span></td>
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

function buildMarketValueSection(marketValue?: MarketValue): string {
  if (!marketValue) {
    return buildEmptySection('Market Value', '💵');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💵</div>
        <h2 class="section-title">Market Value</h2>
      </div>
      <table class="data-table">
        <tbody>
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
              <td><span class="badge badge-info">${marketValue.condition.toUpperCase()}</span></td>
            </tr>
          ` : ''}
          ${marketValue.mileageAdjustment ? `
            <tr>
              <td>Mileage Adjustment</td>
              <td class="number">${marketValue.currency} ${marketValue.mileageAdjustment.toLocaleString()}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Warranty Section =====

function buildWarrantySection(warranty?: WarrantyInfo): string {
  const hasManufacturer = warranty?.manufacturer !== undefined;
  const hasExtended = warranty?.extended && warranty.extended.length > 0;

  if (!hasManufacturer && !hasExtended) {
    return buildEmptySection('Warranty Information', '🔒');
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔒</div>
        <h2 class="section-title">Warranty Information</h2>
      </div>
      
      ${hasManufacturer ? `
        <div class="subsection-title">Manufacturer Warranty</div>
        <table class="data-table">
          <tbody>
            <tr><td>Type</td><td>${warranty!.manufacturer!.type}</td></tr>
            <tr><td>Start Date</td><td>${warranty!.manufacturer!.startDate}</td></tr>
            <tr><td>End Date</td><td>${warranty!.manufacturer!.endDate}</td></tr>
            <tr><td>Mileage Limit</td><td>${warranty!.manufacturer!.mileageLimit ? `${warranty!.manufacturer!.mileageLimit.toLocaleString()} miles` : 'N/A'}</td></tr>
            <tr><td>Provider</td><td>${warranty!.manufacturer!.provider}</td></tr>
            <tr><td>Status</td><td><span class="badge ${warranty!.manufacturer!.status === 'active' ? 'badge-success' : 'badge-warning'}">${warranty!.manufacturer!.status.toUpperCase()}</span></td></tr>
          </tbody>
        </table>
      ` : ''}
      
      ${hasExtended ? `
        <div class="subsection-title">Extended Warranties</div>
        ${warranty!.extended!.map((ext, index) => `
          <div style="margin-bottom: 16px;">
            <p style="font-weight: 600; margin-bottom: 8px;">Extended Warranty #${index + 1}</p>
            <table class="data-table">
              <tbody>
                <tr><td>Type</td><td>${ext.type}</td></tr>
                <tr><td>Start Date</td><td>${ext.startDate}</td></tr>
                <tr><td>End Date</td><td>${ext.endDate}</td></tr>
                <tr><td>Mileage Limit</td><td>${ext.mileageLimit ? `${ext.mileageLimit.toLocaleString()} miles` : 'N/A'}</td></tr>
                <tr><td>Provider</td><td>${ext.provider}</td></tr>
                <tr><td>Status</td><td><span class="badge ${ext.status === 'active' ? 'badge-success' : 'badge-warning'}">${ext.status.toUpperCase()}</span></td></tr>
              </tbody>
            </table>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;
}

// ===== NCS Valuation Section =====

function buildValuationSection(options: ReportOptions): string {
  if (!options.includeNCSValuation || !options.cifUsd) return '';

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💰</div>
        <h2 class="section-title">NCS Valuation</h2>
      </div>
      <table class="data-table">
        <tbody>
          <tr>
            <td>CIF Value (USD)</td>
            <td class="number">$${options.cifUsd.toLocaleString()}</td>
          </tr>
          <tr>
            <td>CIF Value (NGN)</td>
            <td class="number">₦${options.cifNgn?.toLocaleString()}</td>
          </tr>
          <tr>
            <td>CBN Exchange Rate</td>
            <td class="number">₦${options.cbnRate?.toLocaleString()}/USD</td>
          </tr>
          <tr>
            <td>Confidence Level</td>
            <td><span class="badge ${options.confidence === 'exact' ? 'badge-success' : 'badge-info'}">${options.confidence?.toUpperCase()}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ===== Import Duty Section =====

function buildDutySection(options: ReportOptions): string {
  if (!options.includeDutyBreakdown || !options.dutyBreakdown) return '';

  const duty = options.dutyBreakdown;

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <h2 class="section-title">Nigerian Import Duty Breakdown</h2>
      </div>
      <table class="duty-table">
        <tbody>
          <tr>
            <td>Import Duty (35%)</td>
            <td class="number">₦${duty.importDuty.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Surcharge (7%)</td>
            <td class="number">₦${duty.surcharge.toLocaleString()}</td>
          </tr>
          <tr>
            <td>NAC Levy (20%)</td>
            <td class="number">₦${duty.nacLevy.toLocaleString()}</td>
          </tr>
          <tr>
            <td>CISS (1%)</td>
            <td class="number">₦${duty.ciss.toLocaleString()}</td>
          </tr>
          <tr>
            <td>ETLS (0.5%)</td>
            <td class="number">₦${duty.etls.toLocaleString()}</td>
          </tr>
          <tr>
            <td>VAT (7.5%)</td>
            <td class="number">₦${duty.vat.toLocaleString()}</td>
          </tr>
          <tr class="duty-total">
            <td>TOTAL IMPORT DUTY</td>
            <td class="number">₦${duty.totalDutyNgn.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ===== Footer Section =====

function buildFooter(
  data: ComprehensiveVehicleData, 
  reportDate: string, 
  reportId: string
): string {
  return `
    <div class="report-footer">
      <div class="footer-content">
        <div class="footer-section">
          <strong>Report Information</strong>
          Generated: ${reportDate}<br>
          Report ID: ${reportId}<br>
          VIN: ${data.identification.vin}
        </div>
        <div class="footer-section" style="text-align: right;">
          <strong>MotoCheck</strong>
          Professional Vehicle Reports for Nigeria<br>
          www.motocheck.ng | support@motocheck.ng
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong>Disclaimer:</strong> This report is based on data from NHTSA and official Nigerian Customs Service valuation tables. 
        Information accuracy depends on source data quality. This report should be used as a reference guide. 
        Always verify critical details independently before making purchase decisions.
      </div>
    </div>
  `;
}

// ===== Utility Functions =====

function buildEmptySection(title: string, icon: string): string {
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${icon}</div>
        <h2 class="section-title">${title}</h2>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">Data Not Available</div>
        <div class="empty-state-message">This information will be displayed when available from our data sources</div>
      </div>
    </div>
  `;
}

// ===== Damage Diagram SVG Generation =====

function generateDamageDiagramSVG(vehicleType: string, damageAreas: DamageArea[]): string {
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

  const damageCoordinates: Record<string, { x: number; y: number; width: number; height: number }> = {
    'front': { x: 250, y: 80, width: 100, height: 40 },
    'rear': { x: 250, y: 280, width: 100, height: 40 },
    'left-side': { x: 180, y: 150, width: 40, height: 100 },
    'right-side': { x: 380, y: 150, width: 40, height: 100 },
    'roof': { x: 250, y: 150, width: 100, height: 100 },
    'undercarriage': { x: 250, y: 180, width: 100, height: 60 }
  };

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

export default buildReportHTML;
