/**
 * PDF Styling System for Vehicle Reports
 * 
 * Comprehensive styling rules for professional vehicle history reports.
 * Includes typography, color palette, table styling, damage diagrams, and no-data states.
 */

export const pdfStyles = `
  /* ===== CSS Variables ===== */
  :root {
    /* Primary Colors */
    --color-primary: #2563eb;
    --color-primary-dark: #1e40af;
    
    /* Accent Colors */
    --color-accent-blue: #93c5fd;
    --color-accent-gray: #e2e8f0;
    
    /* Text Colors */
    --color-text-primary: #0f172a;
    --color-text-secondary: #475569;
    --color-text-muted: #64748b;
    
    /* Status Colors */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    
    /* Background Colors */
    --color-bg-white: #ffffff;
    --color-bg-light: #f8fafc;
    --color-bg-section: #f1f5f9;
  }

  /* ===== Typography System ===== */
  
  /* Body Text */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }

  /* Section Titles */
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--color-primary);
  }

  /* Subsection Titles */
  .subsection-title {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 12px;
    margin-top: 20px;
  }

  /* ===== Table Styling ===== */
  
  /* Data Tables with Monospace Font */
  .data-table, .duty-table {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  .data-table tr {
    border-bottom: 1px solid var(--color-accent-gray);
  }

  .data-table td {
    padding: 10px 12px;
    vertical-align: top;
  }

  .data-table td:first-child {
    width: 40%;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .data-table td:last-child {
    width: 60%;
    color: var(--color-text-primary);
    font-weight: 600;
    text-align: right;
  }

  /* Table Headers */
  .data-table th {
    background-color: var(--color-bg-section);
    color: var(--color-text-primary);
    font-weight: 600;
    text-align: left;
    padding: 12px;
    border-bottom: 2px solid var(--color-accent-gray);
  }

  /* Right-align numerical columns */
  .data-table td.number,
  .data-table th.number {
    text-align: right;
  }

  /* ===== Section Styling ===== */
  
  .section {
    margin-bottom: 32px;
    page-break-inside: avoid;
  }

  .info-box {
    background: var(--color-bg-white);
    border: 1px solid var(--color-accent-gray);
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .info-box-content {
    line-height: 1.8;
  }

  /* ===== No Data State Styling ===== */
  
  .no-data {
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
    padding: 24px;
    background: var(--color-bg-section);
    border-radius: 4px;
  }

  /* ===== Visual Separators ===== */
  
  .section-separator {
    border-top: 1px dashed var(--color-accent-gray);
    margin: 24px 0;
  }

  .visual-divider {
    height: 2px;
    background: linear-gradient(
      to right,
      transparent,
      var(--color-accent-gray),
      transparent
    );
    margin: 16px 0;
  }

  /* ===== Damage Diagram Styles ===== */
  
  .damage-diagram {
    width: 100%;
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    background: var(--color-bg-light);
    border: 1px solid var(--color-accent-gray);
    border-radius: 8px;
    text-align: center;
  }

  .damage-diagram svg {
    max-width: 100%;
    height: auto;
  }

  /* Damage Legend */
  .damage-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 16px;
    font-size: 11px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid #cbd5e1;
  }

  .legend-color.minor {
    background-color: #93c5fd;
  }

  .legend-color.moderate {
    background-color: #fb923c;
  }

  .legend-color.severe {
    background-color: #f87171;
  }

  /* ===== Status Indicators ===== */
  
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.pass,
  .status-badge.active {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-badge.fail,
  .status-badge.denied {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .status-badge.warning {
    background-color: #fef3c7;
    color: #92400e;
  }

  /* ===== Image Grid ===== */
  
  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 20px 0;
  }

  .image-container {
    border: 1px solid var(--color-accent-gray);
    border-radius: 4px;
    overflow: hidden;
    background: var(--color-bg-white);
  }

  .image-container img {
    width: 100%;
    height: auto;
    display: block;
  }

  .image-metadata {
    padding: 8px;
    font-size: 11px;
    color: var(--color-text-secondary);
    background: var(--color-bg-section);
  }

  /* ===== Warning Boxes ===== */
  
  .warning-box {
    background-color: #fef3c7;
    border-left: 4px solid var(--color-warning);
    padding: 16px;
    margin: 16px 0;
    border-radius: 4px;
  }

  .warning-box-title {
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }

  .error-box {
    background-color: #fee2e2;
    border-left: 4px solid var(--color-error);
    padding: 16px;
    margin: 16px 0;
    border-radius: 4px;
  }

  .error-box-title {
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 8px;
  }

  /* ===== Spacing Utilities ===== */
  
  .mt-1 { margin-top: 8px; }
  .mt-2 { margin-top: 16px; }
  .mt-3 { margin-top: 24px; }
  
  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 24px; }
  
  .p-1 { padding: 8px; }
  .p-2 { padding: 16px; }
  .p-3 { padding: 24px; }

  /* ===== Text Utilities ===== */
  
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  
  .text-bold { font-weight: 600; }
  .text-semibold { font-weight: 500; }
  
  .text-muted { color: var(--color-text-muted); }
  .text-primary { color: var(--color-primary); }
  .text-success { color: var(--color-success); }
  .text-warning { color: var(--color-warning); }
  .text-error { color: var(--color-error); }

  /* ===== Page Break Control ===== */
  
  .page-break-before {
    page-break-before: always;
  }

  .page-break-after {
    page-break-after: always;
  }

  .page-break-avoid {
    page-break-inside: avoid;
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
    
    .data-table {
      page-break-inside: auto;
    }
    
    .data-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
  }
`;

export default pdfStyles;
