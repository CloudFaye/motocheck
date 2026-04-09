/**
 * Copart Auction Scraper Worker
 *
 * Scrapes Copart auction history for vehicle damage records and photos
 * Uses Puppeteer with stealth plugin to avoid bot detection
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 24.1-24.4, 35.1-35.5, 36.1, 56.1-56.7
 */

import { PgBoss } from 'pg-boss';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog, vehiclePhotos } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

// Add stealth plugin to avoid bot detection (Requirement 7.2)
puppeteer.use(StealthPlugin());

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

interface CopartData {
	lotNumber: string | null;
	saleDate: string | null;
	odometer: number | null;
	primaryDamage: string | null;
	secondaryDamage: string | null;
	images: string[];
	location: string | null;
	titleCode: string | null;
}

/**
 * Scrape Copart auction data for a VIN
 * Uses puppeteer-extra with stealth plugin (Requirement 7.2)
 */
async function scrapeCopart(vin: string): Promise<{ data: CopartData; html: string }> {
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
				'--disable-blink-features=AutomationControlled' // Hide automation
			]
		});
	} catch (error) {
		console.error('[scrape-copart] Failed to launch browser:', error);
		throw new Error(
			`Failed to launch browser: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ cause: error }
		);
	}

	try {
		const page = await browser.newPage();

		// Better stealth - hide webdriver
		await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false
			});
		});

		// Set realistic User-Agent
		await page.setUserAgent(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		);

		// Set viewport
		await page.setViewport({ width: 1920, height: 1080 });

		// Navigate to Copart search page
		const searchUrl = `https://www.copart.com/lotSearchResults/?free=true&query=${vin}`;
		console.log(`[scrape-copart] Navigating to: ${searchUrl}`);

		try {
			await page.goto(searchUrl, {
				waitUntil: 'domcontentloaded', // Changed from networkidle2 - faster and more reliable
				timeout: 45000 // Increased to 45 seconds
			});
		} catch {
			// If navigation times out, try to continue anyway - page might be partially loaded
			console.log(`[scrape-copart] Navigation timeout, attempting to scrape partial content`);
		}

		// Wait a bit for dynamic content to load
		await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased wait time

		// Get the complete HTML snapshot for re-parsing (Requirement 7.5, 24.1)
		const html = await page.content();

		// Extract data from the page (Requirement 7.3)
		// Wrapped in try-catch to handle missing elements gracefully (Requirement 35.1-35.5)
		const data = await page.evaluate(() => {
			const result: CopartData = {
				lotNumber: null,
				saleDate: null,
				odometer: null,
				primaryDamage: null,
				secondaryDamage: null,
				images: [],
				location: null,
				titleCode: null
			};

			try {
				// Try to find the first search result
				const firstResult = document.querySelector('[data-uname="lotsearchresultslot"]');

				if (!firstResult) {
					console.log('[scrape-copart] No search results found');
					return result;
				}

				// Extract lot number
				const lotNumberEl = firstResult.querySelector('[data-uname="lotsearchLotNumber"]');
				if (lotNumberEl) {
					result.lotNumber = lotNumberEl.textContent?.trim() || null;
				}

				// Extract sale date
				const saleDateEl = firstResult.querySelector('[data-uname="lotsearchSaleDate"]');
				if (saleDateEl) {
					result.saleDate = saleDateEl.textContent?.trim() || null;
				}

				// Extract odometer reading
				const odometerEl = firstResult.querySelector('[data-uname="lotsearchOdometer"]');
				if (odometerEl) {
					const odometerText = odometerEl.textContent?.trim() || '';
					const odometerMatch = odometerText.match(/(\d+)/);
					if (odometerMatch) {
						result.odometer = parseInt(odometerMatch[1], 10);
					}
				}

				// Extract primary damage
				const primaryDamageEl = firstResult.querySelector('[data-uname="lotsearchDamagePrimary"]');
				if (primaryDamageEl) {
					result.primaryDamage = primaryDamageEl.textContent?.trim() || null;
				}

				// Extract secondary damage
				const secondaryDamageEl = firstResult.querySelector(
					'[data-uname="lotsearchDamageSecondary"]'
				);
				if (secondaryDamageEl) {
					result.secondaryDamage = secondaryDamageEl.textContent?.trim() || null;
				}

				// Extract location
				const locationEl = firstResult.querySelector('[data-uname="lotsearchLocation"]');
				if (locationEl) {
					result.location = locationEl.textContent?.trim() || null;
				}

				// Extract title code
				const titleCodeEl = firstResult.querySelector('[data-uname="lotsearchTitleCode"]');
				if (titleCodeEl) {
					result.titleCode = titleCodeEl.textContent?.trim() || null;
				}

				// Extract images (Requirement 7.3)
				const imageElements = firstResult.querySelectorAll('img[src*="copart"]');
				imageElements.forEach((img) => {
					const src = (img as HTMLImageElement).src;
					if (src && !src.includes('placeholder')) {
						result.images.push(src);
					}
				});
			} catch (error) {
				// Log selector failures without failing entire scrape (Requirement 35.3)
				console.error('[scrape-copart] Error extracting data:', error);
			}

			return result;
		});

		console.log(`[scrape-copart] Extracted data for VIN ${vin}:`, {
			lotNumber: data.lotNumber,
			saleDate: data.saleDate,
			odometer: data.odometer,
			imageCount: data.images.length
		});

		return { data, html };
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for Copart scraping job
 * Processes jobs sequentially (one at a time) for rate limiting (Requirement 7.8, 36.1)
 * Even though batchSize=2 fetches 2 jobs, we process them sequentially to avoid overloading Copart
 */
export async function handleScrapeCopart(jobs: Job[]): Promise<void> {
	// Process jobs sequentially (not concurrently) for rate limiting
	for (const job of jobs) {
		await processScrapeCopart(job);
	}
}

async function processScrapeCopart(job: Job): Promise<void> {
	const { vin } = job.data;

	// Log pipeline progress: started (Requirement 22.1)
	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-copart',
		status: 'started',
		message: 'Scraping Copart auction data'
	});

	console.log(`[scrape-copart] Starting scrape for VIN: ${vin}`);

	try {
		// Scrape Copart data (Requirement 7.1)
		const { data, html } = await scrapeCopart(vin);

		// Store raw data with HTML snapshot (Requirement 7.4, 7.5, 24.2)
		await db
			.insert(rawData)
			.values({
				vin,
				source: 'copart',
				rawJson: data,
				rawHtml: html,
				success: true
			})
			.onConflictDoUpdate({
				target: [rawData.vin, rawData.source],
				set: {
					rawJson: data,
					rawHtml: html,
					fetchedAt: new Date(),
					success: true,
					errorMessage: null
				}
			});

		// Store extracted images in vehicle_photos table (Requirement 7.6)
		if (data.images.length > 0) {
			for (const imageUrl of data.images) {
				try {
					await db
						.insert(vehiclePhotos)
						.values({
							vin,
							url: imageUrl,
							source: 'copart',
							capturedAt: data.saleDate ? new Date(data.saleDate) : null,
							photoType: 'auction_condition',
							auctionLotId: data.lotNumber
						})
						.onConflictDoNothing();
				} catch (error) {
					// Continue processing other images if one fails (Requirement 35.5)
					console.error(`[scrape-copart] Failed to store image ${imageUrl}:`, error);
				}
			}

			console.log(`[scrape-copart] Stored ${data.images.length} images for VIN: ${vin}`);
		}

		// Log pipeline progress: completed (Requirement 22.2)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-copart',
			status: 'completed',
			message: `Successfully scraped Copart data (lot: ${data.lotNumber || 'N/A'})`
		});

		console.log(`[scrape-copart] Successfully scraped data for VIN: ${vin}`);

		// Enqueue normalization job on success (Requirement 7.7)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'copart'
		});

		console.log(`[scrape-copart] Enqueued normalization job for VIN: ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		// Store error in raw_data table (Requirement 35.4)
		await db
			.insert(rawData)
			.values({
				vin,
				source: 'copart',
				rawJson: {},
				success: false,
				errorMessage
			})
			.onConflictDoUpdate({
				target: [rawData.vin, rawData.source],
				set: {
					fetchedAt: new Date(),
					success: false,
					errorMessage
				}
			});

		// Log pipeline progress: failed (Requirement 22.3)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-copart',
			status: 'failed',
			message: `Failed to scrape Copart data: ${errorMessage}`
		});

		console.error(`[scrape-copart] Failed for VIN ${vin}:`, error);

		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 * Configure with batchSize=2 for rate limiting (Requirement 7.8, 36.1)
 *
 * Rate limiting strategy:
 * - batchSize: 2 - fetch 2 jobs at a time (equivalent to deprecated teamSize)
 * - Sequential processing in handler - process 1 job at a time (equivalent to deprecated teamConcurrency: 1)
 *
 * This prevents overloading Copart's servers by:
 * 1. Fetching small batches (2 jobs)
 * 2. Processing them sequentially (not concurrently)
 * 3. Using Puppeteer delays and realistic User-Agent headers
 */
export async function registerScrapeCopartWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_COPART,
		{
			batchSize: 2
		},
		handleScrapeCopart
	);

	console.log(
		'[scrape-copart] Worker registered with batchSize=2, sequential processing for rate limiting'
	);
}
