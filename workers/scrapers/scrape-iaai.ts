/**
 * IAAI Auction Scraper Worker
 * 
 * Scrapes IAAI (Insurance Auto Auctions) auction history for vehicle damage records and photos
 * Uses Puppeteer with stealth plugin to avoid bot detection
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 36.2
 */

import { PgBoss } from 'pg-boss';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog, vehiclePhotos } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

// Add stealth plugin to avoid bot detection (Requirement 8.2)
puppeteer.use(StealthPlugin());

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

interface IAAIData {
	stockNumber: string | null;
	saleDate: string | null;
	mileage: number | null;
	primaryDamage: string | null;
	secondaryDamage: string | null;
	images: string[];
	location: string | null;
	titleCode: string | null;
	vehicleType: string | null;
}

/**
 * Scrape IAAI auction data for a VIN
 * Uses puppeteer-extra with stealth plugin (Requirement 8.2)
 */
async function scrapeIAAI(vin: string): Promise<{ data: IAAIData; html: string }> {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-accelerated-2d-canvas',
			'--disable-gpu',
		],
	});

	try {
		const page = await browser.newPage();
		
		// Set realistic User-Agent
		await page.setUserAgent(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		);
		
		// Set viewport
		await page.setViewport({ width: 1920, height: 1080 });
		
		// Navigate to IAAI search page
		const searchUrl = `https://www.iaai.com/search?searchType=vin&query=${vin}`;
		console.log(`[scrape-iaai] Navigating to: ${searchUrl}`);
		
		await page.goto(searchUrl, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});
		
		// Wait a bit for dynamic content to load
		await page.waitForTimeout(2000);
		
		// Get the complete HTML snapshot for re-parsing (Requirement 8.5)
		const html = await page.content();
		
		// Extract data from the page (Requirement 8.3)
		// Wrapped in try-catch to handle missing elements gracefully
		const data = await page.evaluate(() => {
			const result: IAAIData = {
				stockNumber: null,
				saleDate: null,
				mileage: null,
				primaryDamage: null,
				secondaryDamage: null,
				images: [],
				location: null,
				titleCode: null,
				vehicleType: null,
			};
			
			try {
				// Try to find the first search result
				// IAAI uses different selectors than Copart
				const firstResult = document.querySelector('.table-row') || 
				                   document.querySelector('[data-test="search-result-item"]') ||
				                   document.querySelector('.search-result');
				
				if (!firstResult) {
					console.log('[scrape-iaai] No search results found');
					return result;
				}
				
				// Extract stock number
				const stockNumberEl = firstResult.querySelector('[data-uname="stockNumber"]') ||
				                     firstResult.querySelector('.stock-number') ||
				                     firstResult.querySelector('[class*="stock"]');
				if (stockNumberEl) {
					result.stockNumber = stockNumberEl.textContent?.trim() || null;
				}
				
				// Extract sale date
				const saleDateEl = firstResult.querySelector('[data-uname="saleDate"]') ||
				                  firstResult.querySelector('.sale-date') ||
				                  firstResult.querySelector('[class*="sale"]');
				if (saleDateEl) {
					result.saleDate = saleDateEl.textContent?.trim() || null;
				}
				
				// Extract mileage/odometer reading
				const mileageEl = firstResult.querySelector('[data-uname="odometer"]') ||
				                 firstResult.querySelector('.odometer') ||
				                 firstResult.querySelector('[class*="mileage"]') ||
				                 firstResult.querySelector('[class*="odometer"]');
				if (mileageEl) {
					const mileageText = mileageEl.textContent?.trim() || '';
					// Match numbers with optional commas
					const mileageMatch = mileageText.match(/(\d{1,3}(?:,\d{3})*)/);
					if (mileageMatch) {
						result.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract primary damage
				const primaryDamageEl = firstResult.querySelector('[data-uname="primaryDamage"]') ||
				                       firstResult.querySelector('.primary-damage') ||
				                       firstResult.querySelector('[class*="damage"]');
				if (primaryDamageEl) {
					result.primaryDamage = primaryDamageEl.textContent?.trim() || null;
				}
				
				// Extract secondary damage
				const secondaryDamageEl = firstResult.querySelector('[data-uname="secondaryDamage"]') ||
				                         firstResult.querySelector('.secondary-damage');
				if (secondaryDamageEl) {
					result.secondaryDamage = secondaryDamageEl.textContent?.trim() || null;
				}
				
				// Extract location
				const locationEl = firstResult.querySelector('[data-uname="location"]') ||
				                  firstResult.querySelector('.location') ||
				                  firstResult.querySelector('[class*="location"]');
				if (locationEl) {
					result.location = locationEl.textContent?.trim() || null;
				}
				
				// Extract title code
				const titleCodeEl = firstResult.querySelector('[data-uname="titleCode"]') ||
				                   firstResult.querySelector('.title-code') ||
				                   firstResult.querySelector('[class*="title"]');
				if (titleCodeEl) {
					result.titleCode = titleCodeEl.textContent?.trim() || null;
				}
				
				// Extract vehicle type
				const vehicleTypeEl = firstResult.querySelector('[data-uname="vehicleType"]') ||
				                     firstResult.querySelector('.vehicle-type');
				if (vehicleTypeEl) {
					result.vehicleType = vehicleTypeEl.textContent?.trim() || null;
				}
				
				// Extract images (Requirement 8.3)
				// IAAI may use different image patterns
				const imageElements = firstResult.querySelectorAll('img[src*="iaai"]') ||
				                     firstResult.querySelectorAll('img[src*="vehicle"]') ||
				                     firstResult.querySelectorAll('.vehicle-image img');
				imageElements.forEach((img) => {
					const src = (img as HTMLImageElement).src;
					if (src && !src.includes('placeholder') && !src.includes('logo')) {
						result.images.push(src);
					}
				});
				
				// Also check for background images in divs
				const bgImageElements = firstResult.querySelectorAll('[style*="background-image"]');
				bgImageElements.forEach((el) => {
					const style = (el as HTMLElement).style.backgroundImage;
					const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
					if (urlMatch && urlMatch[1] && !urlMatch[1].includes('placeholder')) {
						result.images.push(urlMatch[1]);
					}
				});
				
			} catch (error) {
				// Log selector failures without failing entire scrape
				console.error('[scrape-iaai] Error extracting data:', error);
			}
			
			return result;
		});
		
		console.log(`[scrape-iaai] Extracted data for VIN ${vin}:`, {
			stockNumber: data.stockNumber,
			saleDate: data.saleDate,
			mileage: data.mileage,
			imageCount: data.images.length,
		});
		
		return { data, html };
		
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for IAAI scraping job
 * Processes jobs sequentially (one at a time) for rate limiting (Requirement 36.2)
 * Even though batchSize=2 fetches 2 jobs, we process them sequentially to avoid overloading IAAI
 */
export async function handleScrapeIAAI(jobs: Job[]): Promise<void> {
	// Process jobs sequentially (not concurrently) for rate limiting
	for (const job of jobs) {
		await processScrapeIAAI(job);
	}
}

async function processScrapeIAAI(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started (Requirement 22.1)
	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-iaai',
		status: 'started',
		message: 'Scraping IAAI auction data',
	});
	
	console.log(`[scrape-iaai] Starting scrape for VIN: ${vin}`);
	
	try {
		// Scrape IAAI data (Requirement 8.1)
		const { data, html } = await scrapeIAAI(vin);
		
		// Store raw data with HTML snapshot (Requirement 8.4, 8.5)
		await db.insert(rawData).values({
			vin,
			source: 'iaai',
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
		
		// Store extracted images in vehicle_photos table (Requirement 8.6)
		if (data.images.length > 0) {
			for (const imageUrl of data.images) {
				try {
					await db.insert(vehiclePhotos).values({
						vin,
						url: imageUrl,
						source: 'iaai',
						capturedAt: data.saleDate ? new Date(data.saleDate) : null,
						photoType: 'auction_condition',
						auctionLotId: data.stockNumber,
					}).onConflictDoNothing();
				} catch (error) {
					// Continue processing other images if one fails
					console.error(`[scrape-iaai] Failed to store image ${imageUrl}:`, error);
				}
			}
			
			console.log(`[scrape-iaai] Stored ${data.images.length} images for VIN: ${vin}`);
		}
		
		// Log pipeline progress: completed (Requirement 22.2)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-iaai',
			status: 'completed',
			message: `Successfully scraped IAAI data (stock: ${data.stockNumber || 'N/A'})`,
		});
		
		console.log(`[scrape-iaai] Successfully scraped data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 8.7)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'iaai',
		});
		
		console.log(`[scrape-iaai] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'iaai',
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
		
		// Log pipeline progress: failed (Requirement 22.3)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-iaai',
			status: 'failed',
			message: `Failed to scrape IAAI data: ${errorMessage}`,
		});
		
		console.error(`[scrape-iaai] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 * Configure with batchSize=2 for rate limiting (Requirement 36.2)
 * 
 * Rate limiting strategy:
 * - batchSize: 2 - fetch 2 jobs at a time (equivalent to deprecated teamSize)
 * - Sequential processing in handler - process 1 job at a time (equivalent to deprecated teamConcurrency: 1)
 * 
 * This prevents overloading IAAI's servers by:
 * 1. Fetching small batches (2 jobs)
 * 2. Processing them sequentially (not concurrently)
 * 3. Using Puppeteer delays and realistic User-Agent headers
 */
export async function registerScrapeIAAIWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_IAAI,
		{
			batchSize: 2,
		},
		handleScrapeIAAI
	);
	
	console.log('[scrape-iaai] Worker registered with batchSize=2, sequential processing for rate limiting');
}
