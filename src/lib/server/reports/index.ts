/**
 * Report Generation Module
 * Professional design for DOCX and PDF reports
 */

export { generateDOCXReport, type ReportGenerationOptions } from './docx-generator';
export { generatePDFReport, type PDFGenerationResult } from './pdfkit-generator';

// Re-export types from original for compatibility
export type { ComprehensiveVehicleData } from '../vehicle/types';
