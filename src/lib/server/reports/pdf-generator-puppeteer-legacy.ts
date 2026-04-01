/**
 * Improved PDF Generator
 * Carfax-inspired professional design using Puppeteer
 */

import puppeteer, { type Browser } from 'puppeteer';
import crypto from 'crypto';
import type { ComprehensiveVehicleData } from '../vehicle/types';
import { buildReportHTML } from './template-builder-improved';
import { VehicleImageService, type ImageResult } from '../vehicle-image-service';
import type { ReportGenerationOptions } from './docx-generator-improved';

export interface PDFGenerationResult {
  pdfBuffer: Buffer;
  hash: string;
}

// Singleton browser instance for performance
let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (browserPromise) {
    return browserPromise;
  }

  browserPromise = puppeteer
    .launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    })
    .then((browser) => {
      browserInstance = browser;
      browserPromise = null;
      return browser;
    });

  return browserPromise;
}

/**
 * Generate improved PDF report from comprehensive vehicle data
 */
export async function generatePDFReport(
  vehicleData: ComprehensiveVehicleData,
  options: ReportGenerationOptions = {}
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Fetch vehicle images with timeout
    const imageService = new VehicleImageService();
    try {
      const imagesPromise = imageService.searchImages({
        vin: vehicleData.identification.vin,
        make: vehicleData.identification.make,
        model: vehicleData.identification.model,
        year: vehicleData.identification.modelYear
      });

      // Race with 3-second timeout
      vehicleData.images = await Promise.race([
        imagesPromise,
        new Promise<ImageResult[]>((resolve) => 
          setTimeout(() => resolve([]), 3000)
        )
      ]);
    } catch (error) {
      console.warn('Image fetch failed, using empty array:', error);
      vehicleData.images = [];
    }

    // Build HTML from vehicle data
    const html = buildReportHTML(vehicleData, options);

    // Set content with optimized wait strategy
    try {
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Wait a bit for any inline styles to apply
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (contentError) {
      console.error('Error setting page content, retrying with load strategy:', contentError);
      await page.setContent(html, { 
        waitUntil: 'load',
        timeout: 60000 
      });
    }
    
    // Generate PDF with improved settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '15mm', 
        right: '15mm', 
        bottom: '15mm', 
        left: '15mm' 
      },
      preferCSSPageSize: true,
      timeout: 60000,
      displayHeaderFooter: false
    });

    // Generate hash for integrity verification
    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    const duration = Date.now() - startTime;
    console.log(`Improved PDF report generated in ${duration}ms, size: ${pdfBuffer.length} bytes`);

    return { 
      pdfBuffer: Buffer.from(pdfBuffer), 
      hash
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(
      `Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
    );
  } finally {
    await page.close();
  }
}

/**
 * Close browser instance (call on app shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export default generatePDFReport;
