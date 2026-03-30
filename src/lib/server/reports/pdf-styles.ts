/**
 * PDF Report Styling
 * Professional automotive-themed styles for vehicle reports
 */

export const PDF_STYLES = `
* { 
	margin: 0; 
	padding: 0; 
	box-sizing: border-box; 
}

body { 
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
	color: #0a0a0a;
	line-height: 1.5;
	background: #ffffff;
}

.page {
	padding: 0;
	background: #ffffff;
}

/* Header Section */
.header {
	background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
	padding: 32px 40px;
	color: white;
	position: relative;
	overflow: hidden;
}

.header::before {
	content: '';
	position: absolute;
	top: 0;
	right: 0;
	width: 300px;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05));
	transform: skewX(-15deg);
}

.brand {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
}

.logo {
	font-size: 32px;
	font-weight: 800;
	letter-spacing: -1px;
	color: #ffffff;
}

.logo-accent {
	color: #3b82f6;
}

.tagline {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 2px;
	opacity: 0.7;
	font-weight: 600;
}

/* Vehicle Hero */
.vehicle-hero {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	padding: 40px;
	color: white;
	border-radius: 0 0 24px 24px;
	box-shadow: 0 10px 40px rgba(37, 99, 235, 0.2);
}

.vehicle-title {
	font-size: 36px;
	font-weight: 800;
	margin-bottom: 12px;
	letter-spacing: -0.5px;
}

.vin-display {
	font-family: 'Courier New', Courier, monospace;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 2px;
	opacity: 0.95;
	padding: 12px 20px;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 8px;
	display: inline-block;
	backdrop-filter: blur(10px);
}

/* Content Container */
.content {
	padding: 40px;
}

/* Section Styling */
.section {
	margin-bottom: 40px;
	page-break-inside: avoid;
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 24px;
	padding-bottom: 12px;
	border-bottom: 3px solid #e5e7eb;
}

.section-icon {
	width: 32px;
	height: 32px;
	background: linear-gradient(135deg, #3b82f6, #2563eb);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: bold;
	font-size: 18px;
}

.section-title {
	font-size: 22px;
	font-weight: 700;
	color: #1a1a1a;
	letter-spacing: -0.3px;
}

/* Info Grid */
.info-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
	margin-bottom: 24px;
}

.info-grid-3 {
	grid-template-columns: repeat(3, 1fr);
}

.info-card {
	background: #f8fafc;
	padding: 16px;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
	transition: all 0.2s;
}

.info-label {
	font-size: 11px;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 6px;
}

.info-value {
	font-size: 16px;
	font-weight: 600;
	color: #0f172a;
	word-wrap: break-word;
}

.info-value-large {
	font-size: 20px;
	font-weight: 700;
}

/* Feature List */
.feature-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
}

.feature-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	background: #f8fafc;
	border-radius: 8px;
	font-size: 14px;
	border: 1px solid #e2e8f0;
}

.feature-icon {
	width: 20px;
	height: 20px;
	background: #10b981;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 12px;
	font-weight: bold;
	flex-shrink: 0;
}

.feature-icon-warning {
	background: #f59e0b;
}

/* Duty Table */
.duty-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.duty-table tr {
	background: #ffffff;
}

.duty-table tr:nth-child(even) {
	background: #f8fafc;
}

.duty-table td {
	padding: 14px 16px;
	border-bottom: 1px solid #e2e8f0;
}

.duty-table tr:last-child td {
	border-bottom: none;
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
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
}

.duty-total td {
	padding: 18px 16px;
	color: white !important;
	font-size: 20px;
	font-weight: 700;
	border: none;
}

/* Recall Alert */
.recall-alert {
	background: #fef2f2;
	border: 2px solid #fecaca;
	border-radius: 12px;
	padding: 20px;
	margin-bottom: 16px;
}

.recall-alert-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}

.recall-icon {
	width: 32px;
	height: 32px;
	background: #ef4444;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: bold;
	font-size: 18px;
}

.recall-title {
	font-size: 16px;
	font-weight: 700;
	color: #991b1b;
}

.recall-content {
	font-size: 13px;
	color: #7f1d1d;
	line-height: 1.6;
}

.recall-meta {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid #fecaca;
	font-size: 11px;
	color: #991b1b;
	font-weight: 600;
}

/* Badge */
.badge {
	display: inline-block;
	padding: 6px 14px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
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
	margin-top: 60px;
	padding: 32px 40px;
	background: #f8fafc;
	border-top: 3px solid #e2e8f0;
	border-radius: 24px 24px 0 0;
}

.footer-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	margin-bottom: 20px;
}

.footer-section h4 {
	font-size: 12px;
	font-weight: 700;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 1px;
	margin-bottom: 8px;
}

.footer-section p {
	font-size: 13px;
	color: #475569;
	line-height: 1.6;
}

.footer-brand {
	text-align: center;
	padding-top: 20px;
	border-top: 1px solid #e2e8f0;
	font-size: 11px;
	color: #94a3b8;
}

.footer-brand strong {
	color: #3b82f6;
	font-weight: 700;
}

/* Utility Classes */
.text-center { text-align: center; }
.text-right { text-align: right; }
.mt-4 { margin-top: 16px; }
.mb-4 { margin-bottom: 16px; }
`;
