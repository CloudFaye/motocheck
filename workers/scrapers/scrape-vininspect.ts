/**
 * VINInspect Scraper Worker
 * 
 * Scrapes VINInspect.com for vehicle history data
 * Uses Puppeteer with stealth plugin to avoid bot detection
 */

import { PgBoss } from 'pg-boss';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog, vehiclePhotos } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

interface VINInspectData {
	year: string | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	odometer: number | null;
	titleStatus: string | null;
	accidentHistory: string | null;
	ownershipHistory: string | null;
	serviceRecords: Array<{
		date: string;
		description: string;
		mileage: number | null;
	}>;
	images: string[];
	recalls: Array<{
		campaign: string;
		description: string;
	}>;
}

/**
 * Scrape VINInspect data for a VIN
 * Uses puppeteer-extra with stealth plugin
 */
async function scrapeVINInspect(vin: string): Promise<{ data: VINInspectData; html: string }> {
	let browser;
	
	try {
		browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--disable-gpu',
				'--disable-blink-features=AutomationControlled',
			],
		});
	} catch (error) {
		console.error('[scrape-vininspect] Failed to launch browser:', error);
		throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	try {
		const page = await browser.newPage();
		
		// Better stealth - hide webdriver
		await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false,
			});
		});
		
		// Set realistic User-Agent
		await page.setUserAgent(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		);
		
		// Set viewport
		await page.setViewport({ width: 1920, height: 1080 });
		
		// Navigate to VINInspect search page
		// The URL format appears to be: https://vininspect.com/vin/{make}/{model}/{year}/{partial_vin}
		// We'll start with just the VIN and let the site redirect/search
		const searchUrl = `https://vininspect.com/vin/${vin}`;
		console.log(`[scrape-vininspect] Navigating to: ${searchUrl}`);
		
		try {
			await page.goto(searchUrl, {
				waitUntil: 'domcontentloaded',
				timeout: 45000,
			});
		} catch (error) {
			// If navigation times out, try to continue anyway - page might be partially loaded
			console.log(`[scrape-vininspect] Navigation timeout, attempting to scrape partial content`);
		}
		
		// Wait for dynamic content to load
		await new Promise(resolve => setTimeout(resolve, 3000));
		
		// Get the complete HTML snapshot for re-parsing
		const html = await page.content();
		
		// Extract data from the page
		const data = await page.evaluate(() => {
			const result: VINInspectData = {
				year: null,
				make: null,
				model: null,
				trim: null,
				odometer: null,
				titleStatus: null,
				accidentHistory: null,
				ownershipHistory: null,
				serviceRecords: [],
				images: [],
				recalls: [],
			};
			
			try {
				// Extract vehicle identity information
				const yearEl = document.querySelector('[data-field="year"], .vehicle-year, .year');
				if (yearEl) {
					result.year = yearEl.textContent?.trim() || null;
				}
				
				const makeEl = document.querySelector('[data-field="make"], .vehicle-make, .make');
				if (makeEl) {
					result.make = makeEl.textContent?.trim() || null;
				}
				
				const modelEl = document.querySelector('[data-field="model"], .vehicle-model, .model');
				if (modelEl) {
					result.model = modelEl.textContent?.trim() || null;
				}
				
				const trimEl = document.querySelector('[data-field="trim"], .vehicle-trim, .trim');
				if (trimEl) {
					result.trim = trimEl.textContent?.trim() || null;
				}
				
				// Extract odometer reading
				const odometerEl = document.querySelector('[data-field="odometer"], .odometer, .mileage');
				if (odometerEl) {
					const odometerText = odometerEl.textContent?.trim() || '';
					const odometerMatch = odometerText.match(/(\d+)/);
					if (odometerMatch) {
						result.odometer = parseInt(odometerMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract title status
				const titleEl = document.querySelector('[data-field="title"], .title-status, .title');
				if (titleEl) {
					result.titleStatus = titleEl.textContent?.trim() || null;
				}
				
				// Extract accident history
				const accidentEl = document.querySelector('[data-field="accidents"], .accident-history, .accidents');
				if (accidentEl) {
					result.accidentHistory = accidentEl.textContent?.trim() || null;
				}
				
				// Extract ownership history
				const ownershipEl = document.querySelector('[data-field="owners"], .ownership-history, .owners');
				if (ownershipEl) {
					result.ownershipHistory = ownershipEl.textContent?.trim() || null;
				}
				
				// Extract service records
				const serviceElements = document.querySelectorAll('.service-record, [data-type="service"]');
				serviceElements.forEach((el) => {
					const dateEl = el.querySelector('.service-date, [data-field="date"]');
					const descEl = el.querySelector('.service-description, [data-field="description"]');
					const mileageEl = el.querySelector('.service-mileage, [data-field="mileage"]');
					
					if (dateEl && descEl) {
						const mileageText = mileageEl?.textContent?.trim() || '';
						const mileageMatch = mileageText.match(/(\d+)/);
						
						result.serviceRecords.push({
							date: dateEl.textContent?.trim() || '',
							description: descEl.textContent?.trim() || '',
							mileage: mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, ''), 10) : null,
						});
					}
				});
				
				// Extract images
				const imageElements = document.querySelectorAll('img[src*="vininspect"], img.vehicle-image, img[data-type="vehicle"]');
				imageElements.forEach((img) => {
					const src = (img as HTMLImageElement).src;
					if (src && !src.includes('placeholder') && !src.includes('logo')) {
						result.images.push(src);
					}
				});
				
				// Extract recalls
				const recallElements = document.querySelectorAll('.recall, [data-type="recall"]');
				recallElements.forEach((el) => {
					const campaignEl = el.querySelector('.recall-campaign, [data-field="campaign"]');
					const descEl = el.querySelector('.recall-description, [data-field="description"]');
					
					if (campaignEl && descEl) {
						result.recalls.push({
							campaign: campaignEl.textContent?.trim() || '',
							description: descEl.textContent?.trim() || '',
						});
					}
				});
				
			} catch (error) {
				console.error('[scrape-vininspect] Error extracting data:', error);
			}
			
			return result;
		});
		
		console.log(`[scrape-vininspect] Extracted data for VIN ${vin}:`, {
			year: data.year,
			make: data.make,
			model: data.model,
			odometer: data.odometer,
			serviceRecordCount: data.serviceRecords.length,
			imageCount: data.images.length,
			recallCount: data.recalls.length,
		});
		
		return { data, html };
		
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for VINInspect scraping job
 * Processes jobs sequentially for rate limiting
 */
export async function handleScrapeVINInspect(jobs: Job[]): Promise<void> {
	// Process jobs sequentially (not concurrently) for rate limiting
	for (const job of jobs) {
		await processScrapeVINInspect(job);
	}
}

async function processScrapeVINInspect(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started
	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-vininspect',
		status: 'started',
		message: 'Scraping VINInspect data',
	});
	
	console.log(`[scrape-vininspect] Starting scrape for VIN: ${vin}`);
	
	try {
		// Scrape VINInspect data
		const { data, html } = await scrapeVINInspect(vin);
		
		// Store raw data with HTML snapshot
		await db.insert(rawData).values({
			vin,
			source: 'vininspect',
			rawJson: data,
			rawHtml: html,
			success: true,
		}).onConflictDoUpdate({
			target: [rawData.vin, rawData.source],
			set: {
				rawJson: data,
				rawHtml: html,
				fetchedAt: new Date(),
				success: true,
				errorMessage: null,
			},
		});
		
		// Store extracted images in vehicle_photos table
		if (data.images.length > 0) {
			for (const imageUrl of data.images) {
				try {
					await db.insert(vehiclePhotos).values({
						vin,
						url: imageUrl,
						source: 'vininspect',
						capturedAt: null, // VINInspect doesn't provide capture dates
						photoType: 'listing',
					}).onConflictDoNothing();
				} catch (error) {
					console.error(`[scrape-vininspect] Failed to store image ${imageUrl}:`, error);
				}
			}
			
			console.log(`[scrape-vininspect] Stored ${data.images.length} images for VIN: ${vin}`);
		}
		
		// Log pipeline progress: completed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-vininspect',
			status: 'completed',
			message: `Successfully scraped VINInspect data (${data.serviceRecords.length} service records, ${data.recalls.length} recalls)`,
		});
		
		console.log(`[scrape-vininspect] Successfully scraped data for VIN: ${vin}`);
		
		// Enqueue normalization job on success
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'vininspect',
		});
		
		console.log(`[scrape-vininspect] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'vininspect',
			rawJson: {},
			success: false,
			errorMessage,
		}).onConflictDoUpdate({
			target: [rawData.vin, rawData.source],
			set: {
				fetchedAt: new Date(),
				success: false,
				errorMessage,
			},
		});
		
		// Log pipeline progress: failed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-vininspect',
			status: 'failed',
			message: `Failed to scrape VINInspect data: ${errorMessage}`,
		});
		
		console.error(`[scrape-vininspect] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 * Configure with batchSize=2 for rate limiting
 */
export async function registerScrapeVINInspectWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_VININSPECT,
		{
			batchSize: 2,
		},
		handleScrapeVINInspect
	);
	
	console.log('[scrape-vininspect] Worker registered with batchSize=2, sequential processing for rate limiting');
}
