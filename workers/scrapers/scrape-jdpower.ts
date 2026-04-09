/**
 * JD Power Inventory Scraper Worker
 *
 * Scrapes JD Power vehicle inventory listings for detailed vehicle information
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

interface JDPowerData {
	year: string | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	price: number | null;
	mileage: number | null;
	exteriorColor: string | null;
	interiorColor: string | null;
	transmission: string | null;
	drivetrain: string | null;
	fuelType: string | null;
	mpg: string | null;
	engine: string | null;
	dealerName: string | null;
	dealerLocation: string | null;
	dealerPhone: string | null;
	images: string[];
	features: string[];
	description: string | null;
	listingUrl: string | null;
}

/**
 * Scrape JD Power inventory data for a VIN
 */
async function scrapeJDPower(vin: string): Promise<{ data: JDPowerData; html: string }> {
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
				'--disable-blink-features=AutomationControlled'
			]
		});
	} catch (error) {
		console.error('[scrape-jdpower] Failed to launch browser:', error);
		throw new Error(
			`Failed to launch browser: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ cause: error }
		);
	}

	try {
		const page = await browser.newPage();

		// Hide webdriver
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

		// Navigate to JD Power inventory search
		// Format: https://www.jdpower.com/inventory/{year}/{make}/{model}/{location}/{vin}
		const searchUrl = `https://www.jdpower.com/inventory?vin=${vin}`;
		console.log(`[scrape-jdpower] Navigating to: ${searchUrl}`);

		try {
			await page.goto(searchUrl, {
				waitUntil: 'domcontentloaded',
				timeout: 45000
			});
		} catch {
			console.log(`[scrape-jdpower] Navigation timeout, attempting to scrape partial content`);
		}

		// Wait for dynamic content
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Get the complete HTML snapshot
		const html = await page.content();

		// Extract data from the page
		const data = await page.evaluate(() => {
			const result: JDPowerData = {
				year: null,
				make: null,
				model: null,
				trim: null,
				price: null,
				mileage: null,
				exteriorColor: null,
				interiorColor: null,
				transmission: null,
				drivetrain: null,
				fuelType: null,
				mpg: null,
				engine: null,
				dealerName: null,
				dealerLocation: null,
				dealerPhone: null,
				images: [],
				features: [],
				description: null,
				listingUrl: window.location.href
			};

			try {
				// Extract vehicle title (year, make, model)
				const titleEl = document.querySelector('h1.vehicle-title, h1[class*="title"]');
				if (titleEl) {
					const titleText = titleEl.textContent?.trim() || '';
					const titleMatch = titleText.match(/(\d{4})\s+(\w+)\s+(.+)/);
					if (titleMatch) {
						result.year = titleMatch[1];
						result.make = titleMatch[2];
						result.model = titleMatch[3];
					}
				}

				// Extract price
				const priceEl = document.querySelector('[class*="price"], .vehicle-price');
				if (priceEl) {
					const priceText = priceEl.textContent?.trim() || '';
					const priceMatch = priceText.match(/\$?([\d,]+)/);
					if (priceMatch) {
						result.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
					}
				}

				// Extract mileage
				const mileageEl = document.querySelector('[class*="mileage"], .vehicle-mileage');
				if (mileageEl) {
					const mileageText = mileageEl.textContent?.trim() || '';
					const mileageMatch = mileageText.match(/([\d,]+)/);
					if (mileageMatch) {
						result.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
					}
				}

				// Extract vehicle details from specs section
				const specItems = document.querySelectorAll('[class*="spec"], .vehicle-spec, dt, dd');
				specItems.forEach((item) => {
					const text = item.textContent?.trim().toLowerCase() || '';
					const value =
						item.nextElementSibling?.textContent?.trim() || item.textContent?.trim() || '';

					if (text.includes('exterior') || text.includes('ext color')) {
						result.exteriorColor = value;
					} else if (text.includes('interior') || text.includes('int color')) {
						result.interiorColor = value;
					} else if (text.includes('transmission')) {
						result.transmission = value;
					} else if (text.includes('drivetrain') || text.includes('drive')) {
						result.drivetrain = value;
					} else if (text.includes('fuel')) {
						result.fuelType = value;
					} else if (text.includes('mpg')) {
						result.mpg = value;
					} else if (text.includes('engine')) {
						result.engine = value;
					} else if (text.includes('trim')) {
						result.trim = value;
					}
				});

				// Extract dealer information
				const dealerNameEl = document.querySelector('[class*="dealer-name"], .dealer-info h3');
				if (dealerNameEl) {
					result.dealerName = dealerNameEl.textContent?.trim() || null;
				}

				const dealerLocationEl = document.querySelector(
					'[class*="dealer-location"], .dealer-address'
				);
				if (dealerLocationEl) {
					result.dealerLocation = dealerLocationEl.textContent?.trim() || null;
				}

				const dealerPhoneEl = document.querySelector('[class*="dealer-phone"], a[href^="tel:"]');
				if (dealerPhoneEl) {
					result.dealerPhone = dealerPhoneEl.textContent?.trim() || null;
				}

				// Extract images
				const imageElements = document.querySelectorAll(
					'img[src*="jdpower"], img[class*="vehicle"], img[class*="gallery"]'
				);
				imageElements.forEach((img) => {
					const src = (img as HTMLImageElement).src;
					if (src && !src.includes('placeholder') && !src.includes('logo')) {
						result.images.push(src);
					}
				});

				// Extract features
				const featureElements = document.querySelectorAll(
					'[class*="feature"], .vehicle-features li, ul.features li'
				);
				featureElements.forEach((feature) => {
					const featureText = feature.textContent?.trim();
					if (featureText) {
						result.features.push(featureText);
					}
				});

				// Extract description
				const descriptionEl = document.querySelector(
					'[class*="description"], .vehicle-description'
				);
				if (descriptionEl) {
					result.description = descriptionEl.textContent?.trim() || null;
				}
			} catch (error) {
				console.error('[scrape-jdpower] Error extracting data:', error);
			}

			return result;
		});

		console.log(`[scrape-jdpower] Extracted data for VIN ${vin}:`, {
			year: data.year,
			make: data.make,
			model: data.model,
			price: data.price,
			mileage: data.mileage,
			imageCount: data.images.length
		});

		return { data, html };
	} finally {
		await browser.close();
	}
}

/**
 * Worker handler for JD Power scraping job
 */
export async function handleScrapeJDPower(jobs: Job[]): Promise<void> {
	for (const job of jobs) {
		await processScrapeJDPower(job);
	}
}

async function processScrapeJDPower(job: Job): Promise<void> {
	const { vin } = job.data;

	await db.insert(pipelineLog).values({
		vin,
		stage: 'scrape-jdpower',
		status: 'started',
		message: 'Scraping JD Power inventory data'
	});

	console.log(`[scrape-jdpower] Starting scrape for VIN: ${vin}`);

	try {
		const { data, html } = await scrapeJDPower(vin);

		// Store raw data with HTML snapshot
		await db
			.insert(rawData)
			.values({
				vin,
				source: 'jdpower',
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

		// Store extracted images
		if (data.images.length > 0) {
			for (const imageUrl of data.images) {
				try {
					await db
						.insert(vehiclePhotos)
						.values({
							vin,
							url: imageUrl,
							source: 'jdpower',
							photoType: 'listing'
						})
						.onConflictDoNothing();
				} catch (error) {
					console.error(`[scrape-jdpower] Failed to store image ${imageUrl}:`, error);
				}
			}

			console.log(`[scrape-jdpower] Stored ${data.images.length} images for VIN: ${vin}`);
		}

		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-jdpower',
			status: 'completed',
			message: `Successfully scraped JD Power data`
		});

		console.log(`[scrape-jdpower] Successfully scraped data for VIN: ${vin}`);

		// Enqueue normalization job
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'jdpower'
		});

		console.log(`[scrape-jdpower] Enqueued normalization job for VIN: ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		await db
			.insert(rawData)
			.values({
				vin,
				source: 'jdpower',
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

		await db.insert(pipelineLog).values({
			vin,
			stage: 'scrape-jdpower',
			status: 'failed',
			message: `Failed to scrape JD Power data: ${errorMessage}`
		});

		console.error(`[scrape-jdpower] Failed for VIN ${vin}:`, error);

		throw error;
	}
}

/**
 * Register the worker with pg-boss
 */
export async function registerScrapeJDPowerWorker(queue: PgBoss): Promise<void> {
	await queue.work(
		Jobs.SCRAPE_JDPOWER,
		{
			batchSize: 2
		},
		handleScrapeJDPower
	);

	console.log(
		'[scrape-jdpower] Worker registered with batchSize=2, sequential processing for rate limiting'
	);
}
