/**
 * CarGurus Price Scraper Worker
 * 
 * Scrapes CarGurus for vehicle price ratings and market value data
 * Uses Puppeteer with stealth plugin to avoid bot detection
 * This is an OPTIONAL source - pipeline continues even if this fails
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { PgBoss } from 'pg-boss';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

// Add stealth plugin to avoid bot detection (Requirement 10.1)
puppeteer.use(StealthPlugin());

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

interface CarGurusData {
	listingId: string | null;
	currentPrice: number | null;
	priceRating: string | null;
	marketAverage: number | null;
	daysOnMarket: number | null;
	dealRating: string | null;
	year: number | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	mileage: number | null;
	dealer: string | null;
	dealerLocation: string | null;
}

/**
 * Scrape CarGurus price data for a VIN
 * Uses puppeteer-extra with stealth plugin (Requirement 10.1)
 */
async function scrapeCarGurus(vin: string): Promise<{ data: CarGurusData; html: string }> {
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
		
		// Navigate to CarGurus VIN search page
		const searchUrl = `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?sourceContext=carGurusHomePageModel&entitySelectingHelper.selectedEntity=&zip=10001&vin=${vin}`;
		console.log(`[scrape-cargurus] Navigating to: ${searchUrl}`);
		
		await page.goto(searchUrl, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});
		
		// Wait a bit for dynamic content to load
		await page.waitForTimeout(2000);
		
		// Get the complete HTML snapshot for re-parsing (Requirement 10.3)
		const html = await page.content();
		
		// Extract data from the page (Requirement 10.2)
		// Wrapped in try-catch to handle missing elements gracefully
		const data = await page.evaluate(() => {
			const result: CarGurusData = {
				listingId: null,
				currentPrice: null,
				priceRating: null,
				marketAverage: null,
				daysOnMarket: null,
				dealRating: null,
				year: null,
				make: null,
				model: null,
				trim: null,
				mileage: null,
				dealer: null,
				dealerLocation: null,
			};
			
			try {
				// Try to find the listing container
				// CarGurus may use various selectors depending on page structure
				const listingContainer = document.querySelector('[data-cg-ft="car-blade"]') ||
				                        document.querySelector('.listing-row') ||
				                        document.querySelector('[data-testid="listing-card"]') ||
				                        document.querySelector('.car-blade');
				
				if (!listingContainer) {
					console.log('[scrape-cargurus] No listing found');
					return result;
				}
				
				// Extract listing ID
				const listingIdEl = listingContainer.querySelector('[data-listing-id]');
				if (listingIdEl) {
					result.listingId = listingIdEl.getAttribute('data-listing-id');
				}
				
				// Extract current price (Requirement 10.2)
				const priceEl = listingContainer.querySelector('[data-cg-ft="listing-price"]') ||
				               listingContainer.querySelector('.price-section') ||
				               listingContainer.querySelector('[class*="price"]') ||
				               document.querySelector('[data-testid="price"]');
				if (priceEl) {
					const priceText = priceEl.textContent?.trim() || '';
					// Match price with optional commas: $25,000 or 25000
					const priceMatch = priceText.match(/\$?(\d{1,3}(?:,\d{3})*)/);
					if (priceMatch) {
						result.currentPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract price rating (Requirement 10.2)
				// CarGurus uses ratings like "Great Deal", "Good Deal", "Fair Price", "High Price", "Overpriced"
				const priceRatingEl = listingContainer.querySelector('[data-cg-ft="deal-rating"]') ||
				                     listingContainer.querySelector('.deal-rating') ||
				                     listingContainer.querySelector('[class*="deal-badge"]') ||
				                     document.querySelector('[data-testid="deal-rating"]');
				if (priceRatingEl) {
					result.priceRating = priceRatingEl.textContent?.trim() || null;
					result.dealRating = result.priceRating; // Alias for consistency
				}
				
				// Extract market average (Requirement 10.2)
				const marketAvgEl = listingContainer.querySelector('[data-cg-ft="market-average"]') ||
				                   listingContainer.querySelector('.market-average') ||
				                   listingContainer.querySelector('[class*="market"]') ||
				                   document.querySelector('[data-testid="market-average"]');
				if (marketAvgEl) {
					const marketAvgText = marketAvgEl.textContent?.trim() || '';
					// Match price with optional commas
					const marketAvgMatch = marketAvgText.match(/\$?(\d{1,3}(?:,\d{3})*)/);
					if (marketAvgMatch) {
						result.marketAverage = parseInt(marketAvgMatch[1].replace(/,/g, ''), 10);
					}
				}
				
				// Extract days on market (Requirement 10.2)
				const daysOnMarketEl = listingContainer.querySelector('[data-cg-ft="days-on-market"]') ||
				                      listingContainer.querySelector('.days-on-market') ||
				                      listingContainer.querySelector('[class*="days"]') ||
				                      document.querySelector('[data-testid="days-on-market"]');
				if (daysOnMarketEl) {
					const daysText = daysOnMarketEl.textContent?.trim() || '';
					// Match numbers
					const daysMatch = daysText.match(/(\d+)/);
					if (daysMatch) {
						result.daysOnMarket = parseInt(daysMatch[1], 10);
					}
				}
				
				// Extract vehicle details
				const yearEl = listingContainer.querySelector('[data-cg-ft="year"]') ||
				              document.querySelector('[class*="year"]');
				if (yearEl) {
					const yearText = yearEl.textContent?.trim() || '';
					const yearMatch = yearText.match(/(\d{4})/);
					if (yearMatch) {
						result.year = parseInt(yearMatch[1], 10);
					}
				}
				
				const makeEl = listingContainer.querySelector('[data-cg-ft="make"]') ||
				              document.querySelector('[class*="make"]');
				if (makeEl) {
					result.make = makeEl.textContent?.trim() || null;
				}
				
				const modelEl = listingContainer.querySelector('[data-cg-ft="model"]') ||
				               document.querySelector('[class*="model"]');
				if (modelEl) {
					result.model = modelEl.textContent?.trim() || null;
				}
				
				const trimEl = listingContainer.querySelector('[data-cg-ft="trim"]') ||
				              document.querySelector('[class*="trim"]');
				if (trimEl) {
					result.trim = trimEl.textContent?.trim() || null;
				}
				
				// Extract mileage
				const mileageEl = listingContainer.querySelector('[data-cg-ft="mileage"]') ||
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
				
				// Extract dealer name
				const dealerEl = listingContainer.querySelector('[data-cg-ft="seller-name"]') ||
				                listingContainer.querySelector('.dealer-name') ||
				                listingContainer.querySelector('[class*="dealer"]') ||
				                document.querySelector('[data-testid="dealer-name"]');
				if (dealerEl) {
					result.dealer = dealerEl.textContent?.trim() || null;
				}
				
				// Extract dealer location
				const locationEl = listingContainer.querySelector('[data-cg-ft="seller-location"]') ||
				                  listingContainer.querySelector('.dealer-location') ||
				                  listingContainer.querySelector('[class*="location"]') ||
				                  document.querySelector('[data-testid="dealer-location"]');
				if (locationEl) {
					result.dealerLocation = locationEl.textContent?.trim() || null;
				}
				
			} catch (error) {
				// Log selector failures without failing entire scrape
				console.error('[scrape-cargurus] Error extracting data:', error);
			}
			
			return result;
		});
		
		console.log(`[scrape-cargurus] Extracted data for VIN ${vin}:`, {
			listingId: data.listingId,
			currentPrice: data.currentPrice,
			priceRating: data.priceRating,
			marketAverage: data.marketAverage,
			daysOnMarket: data.daysOnMarket,
		});
		
		return { data, html };
		
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for CarGurus scraping job
 * Default concurrency settings (no special rate limiting needed)
 */
export async function handleScrapeCarGurus(jobs: Job[]): Promise<void> {
	// Process jobs sequentially for consistency
	for (const job of jobs) {
		await processScrapeCarGurus(job);
	}
}

async function processScrapeCarGurus(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started (Requirement 22.1)
	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-cargurus',
		status: 'started',
		message: 'Scraping CarGurus price data',
	});
	
	console.log(`[scrape-cargurus] Starting scrape for VIN: ${vin}`);
	
	try {
		// Scrape CarGurus data (Requirement 10.1)
		const { data, html } = await scrapeCarGurus(vin);
		
		// Store raw data with HTML snapshot (Requirement 10.3)
		await db.insert(rawData).values({
			vin,
			source: 'cargurus',
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
		
		// Log pipeline progress: completed (Requirement 22.2)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-cargurus',
			status: 'completed',
			message: `Successfully scraped CarGurus data (price: ${data.currentPrice || 'N/A'}, rating: ${data.priceRating || 'N/A'})`,
		});
		
		console.log(`[scrape-cargurus] Successfully scraped data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 10.4)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'cargurus',
		});
		
		console.log(`[scrape-cargurus] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'cargurus',
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
			stage: 'scrape-cargurus',
			status: 'failed',
			message: `Failed to scrape CarGurus data: ${errorMessage}`,
		});
		
		console.error(`[scrape-cargurus] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		// Note: This is an OPTIONAL source (Requirement 10.5)
		// Pipeline will continue even if this fails after retries
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 * Default concurrency settings (no special rate limiting needed for CarGurus)
 * 
 * Note: CarGurus is an OPTIONAL source (Requirement 10.5)
 * Pipeline continues even if this source fails after 3 retries
 */
export async function registerScrapeCarGurusWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_CARGURUS,
		handleScrapeCarGurus
	);
	
	console.log('[scrape-cargurus] Worker registered (optional source - pipeline continues on failure)');
}
