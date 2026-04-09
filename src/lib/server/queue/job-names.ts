/**
 * Job name constants for the vehicle history pipeline
 *
 * This file defines all job types used in the worker-based pipeline architecture.
 * Jobs are processed by workers registered in workers/index.ts
 */

/**
 * Job names enum
 * Each job corresponds to a specific worker in the pipeline
 */
export const Jobs = {
	// Fetcher jobs - API data retrieval (Requirements 63.1, 77.1)
	FETCH_NHTSA_DECODE: 'fetch-nhtsa-decode',
	FETCH_NHTSA_RECALLS: 'fetch-nhtsa-recalls',
	FETCH_NMVTIS: 'fetch-nmvtis',
	FETCH_NICB: 'fetch-nicb',

	// Scraper jobs - Web scraping with Puppeteer (Requirements 63.1, 77.2)
	SCRAPE_COPART: 'scrape-copart',
	SCRAPE_IAAI: 'scrape-iaai',
	SCRAPE_AUTOTRADER: 'scrape-autotrader',
	SCRAPE_CARGURUS: 'scrape-cargurus',
	SCRAPE_JDPOWER: 'scrape-jdpower',
	SCRAPE_VININSPECT: 'scrape-vininspect',

	// Normalizer job - Transform raw data to unified schema (Requirements 63.1, 77.3)
	NORMALIZE: 'normalize',

	// Stitcher job - Merge normalized data into timeline (Requirements 63.1, 77.4)
	STITCH_REPORT: 'stitch-report',

	// LLM jobs - AI analysis and section writing (Requirements 63.1, 77.5, 77.6)
	LLM_ANALYZE: 'llm-analyze',
	LLM_WRITE_SECTIONS: 'llm-write-sections',

	// Document generation job - Create and send report documents
	GENERATE_DOCUMENT: 'generate-document',

	// Notification job - User progress and admin alerts
	SEND_NOTIFICATION: 'send-notification'
} as const;

/**
 * Type for job names
 */
export type JobName = (typeof Jobs)[keyof typeof Jobs];

/**
 * Required data sources that must complete before stitching
 * Pipeline will not proceed to stitching until all required sources are normalized
 * (Requirements 63.2, 63.3)
 */
export const REQUIRED_SOURCES = ['nhtsa_decode', 'nhtsa_recalls'] as const;

/**
 * Optional data sources that enrich reports but don't block stitching
 * Pipeline continues even if these sources fail after retries
 * (Requirements 63.2, 63.4, 63.5)
 */
export const OPTIONAL_SOURCES = [
	'nmvtis', // Optional: May not be configured or available
	'nicb', // Optional: Often blocked (403) by API
	'copart', // Optional: Auction sites are high-churn and frequently block bots
	'iaai', // Optional: Auction sites are high-churn and frequently block bots
	'autotrader',
	'cargurus',
	'jdpower',
	'vininspect'
] as const;

/**
 * All data sources (required + optional)
 */
export const ALL_SOURCES = [...REQUIRED_SOURCES, ...OPTIONAL_SOURCES] as const;

/**
 * Type for data source names
 */
export type DataSource = (typeof ALL_SOURCES)[number];

/**
 * Check if a source is required
 */
export function isRequiredSource(source: string): boolean {
	return REQUIRED_SOURCES.includes(source as (typeof REQUIRED_SOURCES)[number]);
}

/**
 * Check if a source is optional
 */
export function isOptionalSource(source: string): boolean {
	return OPTIONAL_SOURCES.includes(source as (typeof OPTIONAL_SOURCES)[number]);
}
