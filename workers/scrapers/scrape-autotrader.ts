/**
 * AutoTrader Listing Scraper Worker
 * 
 * Scrapes AutoTrader listings for vehicle market pricing and listing data
 * Uses Puppeteer with stealth plugin to avoid bot detection
 * This is an OPTIONAL source - pipeline continues even if this fails
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { PgBoss } from 'pg-boss';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog, vehiclePhotos } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

// Add stealth plugin to avoid bot detection (Requirement 9.1)
puppeteer.use(StealthPlugin());

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

interface AutoTraderData {
	listingId: string | null;
	price: number | null;
	mileage: number | null;
	dealer: string | null;
	dealerLocation: string | null;
	listingDate: string | null;
	images: string[];
	year: number | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	exteriorColor: string | null;
	interiorColor: string | null;
	transmission: string | null;
	drivetrain: string | null;
	fuelType: string | null;
	bodyStyle: string | null;
}

/**
 * Scrape AutoTrader listing data for a VIN
 * Uses puppeteer-extra with stealth plugin (Requirement 9.1)
 */
async function scrapeAutoTrader(vin: string): Promise<{ data: AutoTraderData; html: string }> {
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
		
		// Navigate to AutoTrader VIN search page
		const searchUrl = `https://www.autotrader.com/cars-for-sale/vin/${vin}`;
		console.log(`[scrape-autotrader] Navigating to: ${searchUrl}`);
		
		await page.goto(searchUrl, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});
		
		// Wait a bit for dynamic content to load
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// Get the complete HTML snapshot for re-parsing (Requirement 9.3)
		const html = await page.content();
		
		// Extract data from the page (Requirement 9.2)
		// Wrapped in try-catch to handle missing elements gracefully
		const data = await page.evaluate(() => {
			const result: AutoTraderData = {
				listingId: null,
				price: null,
				mileage: null,
				dealer: null,
				dealerLocation: null,
				listingDate: null,
				images: [],
				year: null,
				make: null,
				model: null,
				trim: null,
				exteriorColor: null,
				interiorColor: null,
				transmission: null,
				drivetrain: null,
				fuelType: null,
				bodyStyle: null,
			};
			
			try {
				// Try to find the listing container
				// AutoTrader may use various selectors depending on page structure
				const listingContainer = document.querySelector('[data-cmp="inventoryListing"]') ||
				                        document.querySelector('.listing-container') ||
				                        document.querySelector('[data-testid="listing-card"]') ||
				                        document.querySelector('.inventory-listing');
				
				if (!listingContainer) {
					console.log('[scrape-autotrader] No listing found');
					return result;
				}
				
				// Extract listing ID
				const listingIdEl = listingContainer.querySelector('[data-listing-id]');
				if (listingIdEl) {
					result.listingId = listingIdEl.getAttribute('data-listing-id');
				}
				
				// Extract price (Requirement 9.2)
				const priceEl = listingContainer.querySelector('[data-cmp="pricing"]') ||
				               listingContainer.querySelector('.first-price') ||
				               listingContainer.querySelector('[class*="price"]') ||
				               document.querySelector('[data-testid="price"]');
				if (priceEl) {
					const priceText = priceEl.textContent?.trim() || '';
					// Match price with optional commas: $25,000 or 25000
					const priceMatch = priceText.match(/\$?(\d{1,3}(?:,\d{3})*)/);
					if (priceMatch) {
						result.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract mileage (Requirement 9.2)
				const mileageEl = listingContainer.querySelector('[data-cmp="mileage"]') ||
				                 listingContainer.querySelector('.mileage') ||
				                 listingContainer.querySelector('[class*="mileage"]') ||
				                 document.querySelector('[data-testid="mileage"]');
				if (mileageEl) {
					const mileageText = mileageEl.textContent?.trim() || '';
					// Match numbers with optional commas
					const mileageMatch = mileageText.match(/(\d{1,3}(?:,\d{3})*)/);
					if (mileageMatch) {
						result.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract dealer name (Requirement 9.2)
				const dealerEl = listingContainer.querySelector('[data-cmp="sellerName"]') ||
				                listingContainer.querySelector('.dealer-name') ||
				                listingContainer.querySelector('[class*="dealer"]') ||
				                document.querySelector('[data-testid="dealer-name"]');
				if (dealerEl) {
					result.dealer = dealerEl.textContent?.trim() || null;
				}
				
				// Extract dealer location (Requirement 9.2)
				const locationEl = listingContainer.querySelector('[data-cmp="sellerLocation"]') ||
				                  listingContainer.querySelector('.dealer-location') ||
				                  listingContainer.querySelector('[class*="location"]') ||
				                  document.querySelector('[data-testid="dealer-location"]');
				if (locationEl) {
					result.dealerLocation = locationEl.textContent?.trim() || null;
				}
				
				// Extract listing date
				const dateEl = listingContainer.querySelector('[data-cmp="listingDate"]') ||
				              listingContainer.querySelector('.listing-date') ||
				              listingContainer.querySelector('[class*="date"]');
				if (dateEl) {
					result.listingDate = dateEl.textContent?.trim() || null;
				}
				
				// Extract vehicle details
				const yearEl = listingContainer.querySelector('[data-cmp="year"]') ||
				              document.querySelector('[class*="year"]');
				if (yearEl) {
					const yearText = yearEl.textContent?.trim() || '';
					const yearMatch = yearText.match(/(\d{4})/);
					if (yearMatch) {
						result.year = parseInt(yearMatch[1], 10);
					}
				}
				
				const makeEl = listingContainer.querySelector('[data-cmp="make"]') ||
				              document.querySelector('[class*="make"]');
				if (makeEl) {
					result.make = makeEl.textContent?.trim() || null;
				}
				
				const modelEl = listingContainer.querySelector('[data-cmp="model"]') ||
				               document.querySelector('[class*="model"]');
				if (modelEl) {
					result.model = modelEl.textContent?.trim() || null;
				}
				
				const trimEl = listingContainer.querySelector('[data-cmp="trim"]') ||
				              document.querySelector('[class*="trim"]');
				if (trimEl) {
					result.trim = trimEl.textContent?.trim() || null;
				}
				
				// Extract colors
				const exteriorColorEl = listingContainer.querySelector('[data-cmp="exteriorColor"]') ||
				                       document.querySelector('[class*="exterior-color"]');
				if (exteriorColorEl) {
					result.exteriorColor = exteriorColorEl.textContent?.trim() || null;
				}
				
				const interiorColorEl = listingContainer.querySelector('[data-cmp="interiorColor"]') ||
				                       document.querySelector('[class*="interior-color"]');
				if (interiorColorEl) {
					result.interiorColor = interiorColorEl.textContent?.trim() || null;
				}
				
				// Extract transmission
				const transmissionEl = listingContainer.querySelector('[data-cmp="transmission"]') ||
				                      document.querySelector('[class*="transmission"]');
				if (transmissionEl) {
					result.transmission = transmissionEl.textContent?.trim() || null;
				}
				
				// Extract drivetrain
				const drivetrainEl = listingContainer.querySelector('[data-cmp="drivetrain"]') ||
				                    document.querySelector('[class*="drivetrain"]');
				if (drivetrainEl) {
					result.drivetrain = drivetrainEl.textContent?.trim() || null;
				}
				
				// Extract fuel type
				const fuelTypeEl = listingContainer.querySelector('[data-cmp="fuelType"]') ||
				                  document.querySelector('[class*="fuel"]');
				if (fuelTypeEl) {
					result.fuelType = fuelTypeEl.textContent?.trim() || null;
				}
				
				// Extract body style
				const bodyStyleEl = listingContainer.querySelector('[data-cmp="bodyStyle"]') ||
				                   document.querySelector('[class*="body-style"]');
				if (bodyStyleEl) {
					result.bodyStyle = bodyStyleEl.textContent?.trim() || null;
				}
				
				// Extract listing images (Requirement 9.2, 9.4)
				const imageElements = document.querySelectorAll('img[src*="autotrader"]') ||
				                     document.querySelectorAll('[data-cmp="vehicleImage"] img') ||
				                     document.querySelectorAll('.vehicle-image img') ||
				                     document.querySelectorAll('[class*="photo"] img');
				imageElements.forEach((img) => {
					const src = (img as HTMLImageElement).src;
					if (src && 
					    !src.includes('placeholder') && 
					    !src.includes('logo') &&
					    !src.includes('icon') &&
					    src.includes('http')) {
						result.images.push(src);
					}
				});
				
				// Also check for background images
				const bgImageElements = document.querySelectorAll('[style*="background-image"]');
				bgImageElements.forEach((el) => {
					const style = (el as HTMLElement).style.backgroundImage;
					const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
					if (urlMatch && 
					    urlMatch[1] && 
					    !urlMatch[1].includes('placeholder') &&
					    !urlMatch[1].includes('logo') &&
					    urlMatch[1].includes('autotrader')) {
						result.images.push(urlMatch[1]);
					}
				});
				
				// Deduplicate images
				result.images = [...new Set(result.images)];
				
			} catch (error) {
				// Log selector failures without failing entire scrape
				console.error('[scrape-autotrader] Error extracting data:', error);
			}
			
			return result;
		});
		
		console.log(`[scrape-autotrader] Extracted data for VIN ${vin}:`, {
			listingId: data.listingId,
			price: data.price,
			mileage: data.mileage,
			dealer: data.dealer,
			imageCount: data.images.length,
		});
		
		return { data, html };
		
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for AutoTrader scraping job
 * Default concurrency settings (no special rate limiting needed)
 */
export async function handleScrapeAutoTrader(jobs: Job[]): Promise<void> {
	// Process jobs sequentially for consistency
	for (const job of jobs) {
		await processScrapeAutoTrader(job);
	}
}

async function processScrapeAutoTrader(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started (Requirement 22.1)
	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-autotrader',
		status: 'started',
		message: 'Scraping AutoTrader listing data',
	});
	
	console.log(`[scrape-autotrader] Starting scrape for VIN: ${vin}`);
	
	try {
		// Scrape AutoTrader data (Requirement 9.1)
		const { data, html } = await scrapeAutoTrader(vin);
		
		// Store raw data with HTML snapshot (Requirement 9.3)
		await db.insert(rawData).values({
			vin,
			source: 'autotrader',
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
		
		// Store listing images in vehicle_photos table (Requirement 9.4)
		if (data.images.length > 0) {
			for (const imageUrl of data.images) {
				try {
					await db.insert(vehiclePhotos).values({
						vin,
						url: imageUrl,
						source: 'autotrader',
						capturedAt: data.listingDate ? new Date(data.listingDate) : null,
						photoType: 'listing',
						auctionLotId: data.listingId,
					}).onConflictDoNothing();
				} catch (error) {
					// Continue processing other images if one fails
					console.error(`[scrape-autotrader] Failed to store image ${imageUrl}:`, error);
				}
			}
			
			console.log(`[scrape-autotrader] Stored ${data.images.length} images for VIN: ${vin}`);
		}
		
		// Log pipeline progress: completed (Requirement 22.2)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-autotrader',
			status: 'completed',
			message: `Successfully scraped AutoTrader data (listing: ${data.listingId || 'N/A'}, price: $${data.price || 'N/A'})`,
		});
		
		console.log(`[scrape-autotrader] Successfully scraped data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 9.5)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'autotrader',
		});
		
		console.log(`[scrape-autotrader] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'autotrader',
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
			stage: 'scrape-autotrader',
			status: 'failed',
			message: `Failed to scrape AutoTrader data: ${errorMessage}`,
		});
		
		console.error(`[scrape-autotrader] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		// Note: This is an OPTIONAL source (Requirement 9.6)
		// Pipeline will continue even if this fails after retries
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 * Default concurrency settings (no special rate limiting needed for AutoTrader)
 * 
 * Note: AutoTrader is an OPTIONAL source (Requirement 9.6)
 * Pipeline continues even if this source fails after 3 retries
 */
export async function registerScrapeAutoTraderWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_AUTOTRADER,
		handleScrapeAutoTrader
	);
	
	console.log('[scrape-autotrader] Worker registered (optional source - pipeline continues on failure)');
}
