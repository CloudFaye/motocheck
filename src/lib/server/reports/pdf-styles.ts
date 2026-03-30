/**
 * PDF Report Styling
 * Clean, professional layout matching industry standards
 */

export const PDF_STYLES = `
* { 
	margin: 0; 
	padding: 0; 
	box-sizing: border-box; 
}

body { 
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
	color: #1a1a1a;
	line-height: 1.6;
	background: #ffffff;
	font-size: 13px;
}

.page {
	padding: 0;
	background: #ffffff;
	max-width: 210mm;
	margin: 0 auto;
}

/* Header */
.header {
	background: #2563eb;
	padding: 24px 40px;
	color: white;
	border-bottom: 4px solid #1e40af;
}

.header-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.brand-section {
	flex: 1;
}

.logo {
	font-size: 28px;
	font-weight: 800;
	letter-spacing: -0.5px;
	margin-bottom: 4px;
}

.tagline {
	font-size: 11px;
	opacity: 0.9;
	text-transform: uppercase;
	letter-spacing: 1px;
}

.report-meta {
	text-align: right;
	font-size: 11px;
	opacity: 0.95;
}

.report-meta div {
	margin-bottom: 2px;
}

/* Vehicle Title Bar */
.vehicle-title-bar {
	background: #f8fafc;
	padding: 20px 40px;
	border-bottom: 2px solid #e2e8f0;
}

.vehicle-name {
	font-size: 24px;
	font-weight: 700;
	color: #0f172a;
	margin-bottom: 8px;
}

.vin-display {
	font-family: 'Courier New', monospace;
	font-size: 14px;
	font-weight: 600;
	color: #475569;
	letter-spacing: 1px;
}

/* Content */
.content {
	padding: 32px 40px;
}

/* Section */
.section {
	margin-bottom: 32px;
	page-break-inside: avoid;
	break-inside: avoid;
}

.section-title {
	font-size: 16px;
	font-weight: 700;
	color: #0f172a;
	padding: 10px 0;
	border-bottom: 2px solid #2563eb;
	margin-bottom: 16px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	page-break-after: avoid;
	break-after: avoid;
}

/* Data Table */
.data-table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 20px;
	page-break-inside: auto;
}

.data-table tr {
	border-bottom: 1px solid #e2e8f0;
	page-break-inside: avoid;
	break-inside: avoid;
}

.data-table tr:last-child {
	border-bottom: none;
}

.data-table td {
	padding: 10px 12px;
	vertical-align: top;
}

.data-table td:first-child {
	width: 40%;
	color: #64748b;
	font-weight: 500;
	font-size: 12px;
}

.data-table td:last-child {
	width: 60%;
	color: #0f172a;
	font-weight: 600;
}

/* Two Column Layout */
.two-column {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	margin-bottom: 20px;
}

.column {
	min-width: 0;
}

/* Feature List */
.feature-list {
	list-style: none;
	padding: 0;
}

.feature-list li {
	padding: 8px 0;
	border-bottom: 1px solid #f1f5f9;
	display: flex;
	align-items: center;
	gap: 8px;
}

.feature-list li:last-child {
	border-bottom: none;
}

.feature-icon {
	width: 18px;
	height: 18px;
	background: #10b981;
	color: white;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: bold;
	flex-shrink: 0;
}

.feature-icon-warning {
	background: #f59e0b;
}

/* Duty Breakdown Table */
.duty-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 12px;
}

.duty-table tr {
	border-bottom: 1px solid #e2e8f0;
}

.duty-table td {
	padding: 12px;
}

.duty-table td:first-child {
	color: #475569;
	font-weight: 500;
}

.duty-table td:last-child {
	text-align: right;
	font-weight: 600;
	color: #0f172a;
	font-family: 'Courier New', monospace;
}

.duty-total {
	background: #f1f5f9;
	border-top: 2px solid #2563eb;
	border-bottom: 2px solid #2563eb;
}

.duty-total td {
	padding: 16px 12px;
	font-size: 16px;
	font-weight: 700;
	color: #2563eb;
}

/* Recall Alert */
.recall-box {
	background: #fef2f2;
	border-left: 4px solid #ef4444;
	padding: 16px;
	margin-bottom: 12px;
}

.recall-header {
	font-weight: 700;
	color: #991b1b;
	margin-bottom: 8px;
	font-size: 14px;
}

.recall-content {
	font-size: 12px;
	color: #7f1d1d;
	line-height: 1.5;
}

.recall-meta {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid #fecaca;
	font-size: 11px;
	color: #991b1b;
}

/* Info Box */
.info-box {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 16px;
	margin-bottom: 16px;
}

.info-box-title {
	font-weight: 700;
	color: #0f172a;
	margin-bottom: 8px;
	font-size: 14px;
}

.info-box-content {
	font-size: 12px;
	color: #475569;
	line-height: 1.6;
}

/* Badge */
.badge {
	display: inline-block;
	padding: 4px 10px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
}

.badge-success {
	background: #d1fae5;
	color: #065f46;
}

.badge-warning {
	background: #fef3c7;
	color: #92400e;
}

.badge-info {
	background: #dbeafe;
	color: #1e40af;
}

/* Footer */
.footer {
	background: #f8fafc;
	padding: 24px 40px;
	border-top: 2px solid #e2e8f0;
	margin-top: 40px;
}

.footer-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	margin-bottom: 16px;
}

.footer-section h4 {
	font-size: 12px;
	font-weight: 700;
	color: #475569;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 8px;
}

.footer-section p {
	font-size: 11px;
	color: #64748b;
	line-height: 1.6;
}

.footer-brand {
	text-align: center;
	padding-top: 16px;
	border-top: 1px solid #e2e8f0;
	font-size: 11px;
	color: #94a3b8;
}

.footer-brand strong {
	color: #2563eb;
	font-weight: 700;
}

/* Utility */
.text-center { text-align: center; }
.text-right { text-align: right; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
`;
