/**
 * Stitcher Worker
 *
 * Merges normalized data from all sources into a chronological timeline.
 * Detects odometer anomalies and history gaps.
 * Enqueues LLM analysis job when complete.
 *
 * Requirements: 12.1-12.9, 13.1-13.5, 14.1-14.5, 38.1-38.5, 39.1-39.5,
 *               40.1-40.6, 41.1-41.5, 42.1-42.5, 43.1-43.5, 44.1-44.5,
 *               74.1-74.5, 81.1-81.5
 */

import type { Job } from 'pg-boss';
import { db } from '../src/lib/server/db/index.js';
import {
	normalizedData,
	pipelineReports,
	odometerReadings,
	pipelineLog
} from '../src/lib/server/db/schema.js';
import { getQueue } from '../src/lib/server/queue/index.js';
import { Jobs, REQUIRED_SOURCES } from '../src/lib/server/queue/job-names.js';
import { eq } from 'drizzle-orm';
import type {
	NormalizedVehicleRecord,
	Timeline,
	VehicleIdentity,
	VehicleEvent,
	OdometerReading,
	TitleBrandRecord,
	RecallRecord,
	MarketValue,
	DamageRecord,
	TitleTransfer,
	HistoryGap
} from '../src/lib/shared/types.js';

/**
 * Stitch job payload
 */
interface StitchJobPayload {
	vin: string;
}

/**
 * Main stitcher worker handler
 * Requirements: 12.1-12.9, 38.1-38.5
 */
export async function stitchReportWorkerHandler(jobs: Job<StitchJobPayload>[]): Promise<void> {
	for (const job of jobs) {
		await stitchReportWorker(job);
	}
}

/**
 * Process a single stitching job
 */
async function stitchReportWorker(job: Job<StitchJobPayload>): Promise<void> {
	const { vin } = job.data;

	console.log(`[stitch-report] Starting stitching for VIN ${vin}`);

	// Log pipeline progress - started
	await db.insert(pipelineLog).values({
		vin,
		stage: 'stitch-report',
		status: 'started',
		message: 'Starting timeline stitching'
	});

	try {
		// Fetch all normalized data for this VIN
		const normalizedRecords = await db
			.select()
			.from(normalizedData)
			.where(eq(normalizedData.vin, vin));

		if (normalizedRecords.length === 0) {
			throw new Error(`No normalized data found for VIN ${vin}`);
		}

		// Check if all required sources are present
		const completedSources = new Set(normalizedRecords.map((r) => r.source));
		const missingRequired = REQUIRED_SOURCES.filter((source) => !completedSources.has(source));

		if (missingRequired.length > 0) {
			throw new Error(`Missing required sources: ${missingRequired.join(', ')}`);
		}

		console.log(
			`[stitch-report] Found ${normalizedRecords.length} normalized records for VIN ${vin}`
		);

		// Parse normalized data
		const records: NormalizedVehicleRecord[] = normalizedRecords.map(
			(r) => r.data as unknown as NormalizedVehicleRecord
		);

		// Build timeline
		const timeline = await buildTimeline(vin, records);

		// Detect odometer anomalies
		await detectOdometerAnomalies(vin, timeline.odometerReadings);

		// Detect history gaps
		timeline.gaps = detectHistoryGaps(timeline.events);

		// Store timeline in pipeline_reports table
		await storeTimeline(vin, timeline);

		console.log(`[stitch-report] Successfully stitched timeline for VIN ${vin}`);

		// Log pipeline progress - completed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'stitch-report',
			status: 'completed',
			message: 'Timeline stitching completed'
		});

		// Update report status to "analyzing"
		await db
			.update(pipelineReports)
			.set({
				status: 'analyzing',
				updatedAt: new Date()
			})
			.where(eq(pipelineReports.vin, vin));

		// Enqueue LLM analysis job
		const queue = await getQueue();
		await queue.send(Jobs.LLM_ANALYZE, { vin });

		console.log(`[stitch-report] LLM analysis job enqueued for VIN ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`[stitch-report] Failed to stitch timeline for VIN ${vin}:`, errorMessage);

		// Log pipeline progress - failed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'stitch-report',
			status: 'failed',
			message: `Stitching failed: ${errorMessage}`
		});

		throw error;
	}
}

/**
 * Build complete timeline from normalized records
 * Requirements: 12.1-12.7, 39.1-39.5, 40.1-40.6, 41.1-41.5, 42.1-42.5, 43.1-43.5, 44.1-44.5
 */
async function buildTimeline(vin: string, records: NormalizedVehicleRecord[]): Promise<Timeline> {
	// Extract vehicle identity from NHTSA decode (authoritative source)
	// Requirements: 12.2, 39.1-39.5
	let identity: VehicleIdentity | undefined;
	const nhtsaDecodeRecord = records.find((r) => r.source === 'nhtsa_decode');
	if (nhtsaDecodeRecord?.identity) {
		identity = nhtsaDecodeRecord.identity;
	}

	if (!identity) {
		throw new Error(`No vehicle identity found from NHTSA decode for VIN ${vin}`);
	}

	// Merge all events from all sources
	// Requirements: 12.1, 38.1-38.5
	const allEvents: VehicleEvent[] = [];
	for (const record of records) {
		allEvents.push(...record.events);
	}

	// Sort events chronologically (ascending order)
	// Requirements: 38.1, 38.2
	allEvents.sort((a, b) => {
		const dateA = new Date(a.date).getTime();
		const dateB = new Date(b.date).getTime();

		if (dateA !== dateB) {
			return dateA - dateB;
		}

		// Stable sort for same-date events: maintain source order
		// NHTSA, NMVTIS, auctions, listings
		const sourceOrder = [
			'nhtsa_decode',
			'nhtsa_recalls',
			'nmvtis',
			'nicb',
			'copart',
			'iaai',
			'autotrader',
			'cargurus',
			'jdpower',
			'vininspect'
		];
		const recordA = records.find((r) => r.events.includes(a));
		const recordB = records.find((r) => r.events.includes(b));

		if (recordA && recordB) {
			return sourceOrder.indexOf(recordA.source) - sourceOrder.indexOf(recordB.source);
		}

		return 0;
	});

	// Merge odometer readings from all sources
	// Requirements: 12.3
	const allOdometerReadings: OdometerReading[] = [];
	for (const record of records) {
		allOdometerReadings.push(...record.odometerReadings);
	}

	// Sort odometer readings by date
	allOdometerReadings.sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime();
	});

	// Extract title history from NMVTIS
	// Requirements: 12.4, 42.1-42.5
	const titleHistory: TitleTransfer[] = [];
	const nmvtisRecord = records.find((r) => r.source === 'nmvtis');
	if (nmvtisRecord) {
		// Extract title transfers from NMVTIS events
		for (const event of nmvtisRecord.events) {
			if (event.type === 'title_transfer') {
				titleHistory.push({
					date: event.date,
					state: event.details.state || event.location || 'Unknown',
					titleNumber: event.details.titleNumber,
					transferType: event.details.transferType || 'sale'
				});
			}
		}
	}

	// Merge title brands from NMVTIS
	// Requirements: 42.1-42.5
	const titleBrands: TitleBrandRecord[] = [];
	for (const record of records) {
		titleBrands.push(...record.titleBrands);
	}

	// Extract recalls from NHTSA
	// Requirements: 12.4, 43.1-43.5
	const recalls: RecallRecord[] = [];
	const nhtsaRecallsRecord = records.find((r) => r.source === 'nhtsa_recalls');
	if (nhtsaRecallsRecord?.recalls) {
		recalls.push(...nhtsaRecallsRecord.recalls);
	}

	// Merge damage records from Copart and IAAI
	// Requirements: 12.5, 41.1-41.5
	const damageRecords: DamageRecord[] = [];
	for (const record of records) {
		if (record.damageRecords) {
			damageRecords.push(...record.damageRecords);
		}
	}

	// Merge market value data from AutoTrader and CarGurus
	// Requirements: 12.6, 40.1-40.6
	const marketValue: MarketValue = {
		currency: 'USD'
	};

	const autotraderRecord = records.find((r) => r.source === 'autotrader');
	if (autotraderRecord?.marketValue) {
		marketValue.askingPrice = autotraderRecord.marketValue.askingPrice;
		marketValue.daysOnMarket = autotraderRecord.marketValue.daysOnMarket;
	}

	const cargurusRecord = records.find((r) => r.source === 'cargurus');
	if (cargurusRecord?.marketValue) {
		marketValue.priceRating = cargurusRecord.marketValue.priceRating;
		marketValue.marketAverage = cargurusRecord.marketValue.marketAverage;
		// Use CarGurus days on market if AutoTrader doesn't have it
		if (!marketValue.daysOnMarket && cargurusRecord.marketValue.daysOnMarket) {
			marketValue.daysOnMarket = cargurusRecord.marketValue.daysOnMarket;
		}
	}

	// Track which sources contributed data
	// Requirements: 44.1-44.5
	const sourcesCovered = records.map((r) => r.source);

	// Build complete timeline
	const timeline: Timeline = {
		identity,
		titleHistory,
		titleBrands,
		recalls,
		damageRecords,
		odometerReadings: allOdometerReadings,
		marketValue,
		events: allEvents,
		gaps: [], // Will be populated by detectHistoryGaps
		sourcesCovered
	};

	return timeline;
}

/**
 * Detect odometer anomalies (rollbacks and unusual rates)
 * Requirements: 13.1-13.5, 74.1-74.5
 */
async function detectOdometerAnomalies(vin: string, readings: OdometerReading[]): Promise<void> {
	console.log(`[stitch-report] Detecting odometer anomalies for VIN ${vin}`);

	// Insert all odometer readings into database
	for (let i = 0; i < readings.length; i++) {
		const reading = readings[i];
		let isAnomaly = false;
		let anomalyNote: string | undefined;

		// Check for mileage rollback (decreasing mileage)
		// Requirements: 13.1, 13.2
		if (i > 0) {
			const prevReading = readings[i - 1];

			if (reading.mileage < prevReading.mileage) {
				isAnomaly = true;
				anomalyNote = 'possible rollback';
				console.log(
					`[stitch-report] Rollback detected: ${prevReading.mileage} -> ${reading.mileage} miles`
				);
			}

			// Check for unusual mileage rate (exceeding 50,000 miles/year)
			// Requirements: 13.3, 13.4
			if (!isAnomaly) {
				const prevDate = new Date(prevReading.date);
				const currDate = new Date(reading.date);
				const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
				const yearsDiff = daysDiff / 365.25;

				if (yearsDiff > 0) {
					const mileageDiff = reading.mileage - prevReading.mileage;
					const annualRate = mileageDiff / yearsDiff;

					if (annualRate > 50000) {
						isAnomaly = true;
						anomalyNote = `unusual rate: ${Math.round(annualRate).toLocaleString()} miles/year`;
						console.log(
							`[stitch-report] Unusual mileage rate detected: ${Math.round(annualRate)} miles/year`
						);
					}
				}
			}
		}

		// Insert odometer reading with anomaly flags
		// Requirements: 13.4
		await db
			.insert(odometerReadings)
			.values({
				vin,
				readingDate: new Date(reading.date),
				mileage: reading.mileage,
				source: reading.source,
				reportedBy: reading.reportedBy || null,
				isAnomaly,
				anomalyNote: anomalyNote || null
			})
			.onConflictDoNothing(); // Handle duplicates gracefully
	}

	console.log(`[stitch-report] Inserted ${readings.length} odometer readings for VIN ${vin}`);
}

/**
 * Detect history gaps (18+ months between events)
 * Requirements: 14.1-14.5
 */
function detectHistoryGaps(events: VehicleEvent[]): HistoryGap[] {
	const gaps: HistoryGap[] = [];

	if (events.length === 0) {
		return gaps;
	}

	// Sort events by date (should already be sorted, but ensure it)
	const sortedEvents = [...events].sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime();
	});

	// Check gaps between consecutive events
	// Requirements: 14.1, 14.2, 14.3
	for (let i = 1; i < sortedEvents.length; i++) {
		const prevEvent = sortedEvents[i - 1];
		const currEvent = sortedEvents[i];

		const prevDate = new Date(prevEvent.date);
		const currDate = new Date(currEvent.date);

		const monthsDiff = calculateMonthsDifference(prevDate, currDate);

		// Gap detected if 18+ months
		if (monthsDiff >= 18) {
			const severity = monthsDiff >= 36 ? 'high' : 'medium';

			gaps.push({
				startDate: prevEvent.date,
				endDate: currEvent.date,
				durationMonths: Math.round(monthsDiff),
				severity
			});

			console.log(
				`[stitch-report] Gap detected: ${Math.round(monthsDiff)} months (${severity} severity)`
			);
		}
	}

	// Check gap from last event to present date
	// Requirements: 14.4
	if (sortedEvents.length > 0) {
		const lastEvent = sortedEvents[sortedEvents.length - 1];
		const lastDate = new Date(lastEvent.date);
		const now = new Date();

		const monthsSinceLastEvent = calculateMonthsDifference(lastDate, now);

		if (monthsSinceLastEvent >= 18) {
			const severity = monthsSinceLastEvent >= 36 ? 'high' : 'medium';

			gaps.push({
				startDate: lastEvent.date,
				endDate: now.toISOString(),
				durationMonths: Math.round(monthsSinceLastEvent),
				severity
			});

			console.log(
				`[stitch-report] Gap to present detected: ${Math.round(monthsSinceLastEvent)} months (${severity} severity)`
			);
		}
	}

	return gaps;
}

/**
 * Calculate difference in months between two dates
 */
function calculateMonthsDifference(date1: Date, date2: Date): number {
	const yearsDiff = date2.getFullYear() - date1.getFullYear();
	const monthsDiff = date2.getMonth() - date1.getMonth();
	return yearsDiff * 12 + monthsDiff;
}

/**
 * Store complete timeline in pipeline_reports table
 * Requirements: 12.7, 12.8
 */
async function storeTimeline(vin: string, timeline: Timeline): Promise<void> {
	console.log(`[stitch-report] Storing timeline for VIN ${vin}`);

	// Update or insert report with timeline and vehicle identity
	await db
		.insert(pipelineReports)
		.values({
			vin,
			status: 'stitching',
			year: timeline.identity.year,
			make: timeline.identity.make,
			model: timeline.identity.model,
			trim: timeline.identity.trim || null,
			bodyStyle: timeline.identity.bodyStyle || null,
			engineDescription: timeline.identity.engineDescription || null,
			driveType: timeline.identity.driveType || null,
			fuelType: timeline.identity.fuelType || null,
			timeline: timeline as unknown as typeof pipelineReports.$inferInsert.timeline,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: pipelineReports.vin,
			set: {
				status: 'stitching',
				year: timeline.identity.year,
				make: timeline.identity.make,
				model: timeline.identity.model,
				trim: timeline.identity.trim || null,
				bodyStyle: timeline.identity.bodyStyle || null,
				engineDescription: timeline.identity.engineDescription || null,
				driveType: timeline.identity.driveType || null,
				fuelType: timeline.identity.fuelType || null,
				timeline: timeline as unknown as typeof pipelineReports.$inferInsert.timeline,
				updatedAt: new Date()
			}
		});

	console.log(`[stitch-report] Timeline stored for VIN ${vin}`);
}

/**
 * Register the stitcher worker with pg-boss
 */
export async function registerStitcherWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.STITCH_REPORT, stitchReportWorkerHandler);
	console.log('[stitch-report] Worker registered');
}
