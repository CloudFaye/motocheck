/**
 * Improved PDF Styling System for Vehicle Reports
 * Carfax-inspired professional design with modern aesthetics
 */

export const pdfStyles = `
  /* ===== CSS Variables - Professional Color Palette ===== */
  :root {
    /* Primary Colors - Deep Blue */
    --color-primary: #1e3a5f;
    --color-primary-dark: #152a45;
    --color-primary-light: #2d4a6f;
    
    /* Accent Colors */
    --color-accent-blue: #3b82f6;
    --color-accent-gold: #d4943a;
    
    /* Text Colors */
    --color-text-primary: #1a1a1a;
    --color-text-secondary: #4b5563;
    --color-text-muted: #6b7280;
    
    /* Status Colors */
    --color-success: #10b981;
    --color-success-bg: #d1fae5;
    --color-warning: #f59e0b;
    --color-warning-bg: #fef3c7;
    --color-error: #ef4444;
    --color-error-bg: #fee2e2;
    --color-info: #3b82f6;
    --color-info-bg: #dbeafe;
    
    /* Background Colors */
    --color-bg-white: #ffffff;
    --color-bg-light: #f8fafc;
    --color-bg-section: #f1f5f9;
    --color-bg-header: #1e3a5f;
    
    /* Border Colors */
    --color-border: #e5e7eb;
    --color-border-light: #f3f4f6;
  }

  /* ===== Base Typography ===== */
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-text-primary);
    margin: 0;
    padding: 0;
    background: var(--color-bg-white);
  }

  /* ===== Report Container ===== */
  .report-container {
    max-width: 100%;
    margin: 0 auto;
  }

  /* ===== Header Section ===== */
  .report-header {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: white;
    padding: 30px 40px;
    margin-bottom: 0;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: var(--color-accent-gold);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: white;
  }

  .logo-text {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .logo-subtitle {
    font-size: 11px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .report-meta {
    text-align: right;
  }

  .report-type {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .report-date {
    font-size: 11px;
    opacity: 0.8;
  }

  .report-id {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
  }

  /* ===== Vehicle Summary Card ===== */
  .vehicle-summary {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
    backdrop-filter: blur(10px);
  }

  .vehicle-name {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .vehicle-vin {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    opacity: 0.9;
    letter-spacing: 1px;
  }

  /* ===== Key Highlights Section ===== */
  .highlights-section {
    background: var(--color-bg-light);
    padding: 24px 40px;
    border-bottom: 1px solid var(--color-border);
  }

  .highlights-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .highlight-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border-light);
  }

  .highlight-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .highlight-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .highlight-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .highlight-status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 8px;
  }

  .status-clean {
    background: var(--color-success-bg);
    color: #065f46;
  }

  .status-warning {
    background: var(--color-warning-bg);
    color: #92400e;
  }

  .status-alert {
    background: var(--color-error-bg);
    color: #991b1b;
  }

  /* ===== Main Content Area ===== */
  .report-content {
    padding: 30px 40px;
  }

  /* ===== Section Styling ===== */
  .section {
    margin-bottom: 32px;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--color-primary);
  }

  .section-icon {
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
  }

  .subsection-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 20px 0 12px 0;
    padding-left: 12px;
    border-left: 3px solid var(--color-accent-gold);
  }

  /* ===== Table Styling ===== */
  .data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 20px;
    font-size: 12px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .data-table thead {
    background: var(--color-primary);
    color: white;
  }

  .data-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-table th.number {
    text-align: right;
  }

  .data-table tbody tr {
    background: white;
    border-bottom: 1px solid var(--color-border-light);
  }

  .data-table tbody tr:nth-child(even) {
    background: var(--color-bg-light);
  }

  .data-table tbody tr:last-child {
    border-bottom: none;
  }

  .data-table td {
    padding: 12px 16px;
    vertical-align: top;
  }

  .data-table td:first-child {
    font-weight: 500;
    color: var(--color-text-secondary);
    width: 40%;
  }

  .data-table td:last-child {
    font-weight: 600;
    color: var(--color-text-primary);
    width: 60%;
  }

  .data-table td.number {
    text-align: right;
    font-family: 'Courier New', monospace;
  }

  /* Duty Table Specific */
  .duty-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 20px;
    font-size: 13px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .duty-table tr {
    border-bottom: 1px solid var(--color-border-light);
  }

  .duty-table td {
    padding: 14px 16px;
  }

  .duty-table td:first-child {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .duty-table td:last-child {
    text-align: right;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  .duty-total {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: white;
    font-size: 15px;
    font-weight: 700;
  }

  .duty-total td {
    padding: 16px;
  }

  .duty-total td:first-child {
    color: white;
  }

  /* ===== Status Badges ===== */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .badge-success {
    background: var(--color-success-bg);
    color: #065f46;
  }

  .badge-warning {
    background: var(--color-warning-bg);
    color: #92400e;
  }

  .badge-error {
    background: var(--color-error-bg);
    color: #991b1b;
  }

  .badge-info {
    background: var(--color-info-bg);
    color: #1e40af;
  }

  .badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* ===== Info Boxes ===== */
  .info-box {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .info-box-title {
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 8px;
    font-size: 13px;
  }

  /* ===== Warning/Error Boxes ===== */
  .warning-box {
    background: var(--color-warning-bg);
    border-left: 4px solid var(--color-warning);
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  }

  .warning-box-title {
    font-weight: 700;
    color: #92400e;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error-box {
    background: var(--color-error-bg);
    border-left: 4px solid var(--color-error);
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  }

  .error-box-title {
    font-weight: 700;
    color: #991b1b;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .success-box {
    background: var(--color-success-bg);
    border-left: 4px solid var(--color-success);
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  }

  .success-box-title {
    font-weight: 700;
    color: #065f46;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ===== Empty State ===== */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    background: var(--color-bg-light);
    border-radius: 8px;
    border: 2px dashed var(--color-border);
  }

  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .empty-state-message {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* ===== Recall Box ===== */
  .recall-box {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .recall-header {
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    font-size: 14px;
  }

  .recall-content {
    margin-bottom: 12px;
    line-height: 1.6;
  }

  .recall-content strong {
    color: var(--color-text-secondary);
  }

  .recall-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    font-style: italic;
  }

  /* ===== Image Grid ===== */
  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 20px 0;
  }

  .image-container {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .image-container img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
  }

  .image-metadata {
    padding: 10px 12px;
    font-size: 10px;
    color: var(--color-text-muted);
    background: var(--color-bg-light);
    border-top: 1px solid var(--color-border);
  }

  /* ===== Damage Diagram ===== */
  .damage-diagram {
    width: 100%;
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    text-align: center;
  }

  .damage-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 16px;
    font-size: 11px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }

  .legend-color.minor { background: #93c5fd; }
  .legend-color.moderate { background: #fb923c; }
  .legend-color.severe { background: #f87171; }

  /* ===== Footer ===== */
  .report-footer {
    background: var(--color-bg-light);
    border-top: 2px solid var(--color-primary);
    padding: 24px 40px;
    margin-top: 40px;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 16px;
  }

  .footer-section {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .footer-section strong {
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: 4px;
  }

  .footer-disclaimer {
    font-size: 10px;
    color: var(--color-text-muted);
    line-height: 1.5;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    text-align: center;
  }

  /* ===== Print Optimizations ===== */
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .data-table, .duty-table {
      page-break-inside: auto;
    }
    
    .data-table tr, .duty-table tr {
      page-break-inside: avoid;
    }
    
    .report-header {
      page-break-after: avoid;
    }
  }
`;

export default pdfStyles;
