/**
 * Copart Normalizer
 *
 * Extracts auction events, damage records, and odometer readings from Copart data.
 * Copart is a major salvage vehicle auction platform.
 *
 * Requirements: 11.3, 11.4, 41.1-41.5, 84.1-84.5
 */

import type {
	NormalizedVehicleRecord,
	VehicleEvent,
	OdometerReading,
	DamageRecord
} from '../../src/lib/shared/types.js';

/**
 * Copart scraped data structure
 */
interface CopartData {
	vin: string;
	lotNumber?: string;
	saleDate?: string;
	location?: string;
	odometer?: number;
	odometerUnit?: string;
	primaryDamage?: string;
	secondaryDamage?: string;
	titleCode?: string;
	estimatedValue?: number;
	salePrice?: number;
	images?: string[];
}

/**
 * Generate human-readable event description for Copart auction
 * Requirements: 84.1-84.5
 */
function generateAuctionDescription(data: CopartData): string {
	const parts: string[] = ['Vehicle sold at Copart auction'];

	if (data.location) {
		parts.push(`in ${data.location}`);
	}

	if (data.primaryDamage) {
		parts.push(`with ${data.primaryDamage.toLowerCase()} damage`);
	}

	if (data.salePrice) {
		parts.push(`for $${data.salePrice.toLocaleString()}`);
	}

	return parts.join(' ');
}

/**
 * Normalize Copart auction data
 *
 * Requirements: 11.3, 11.4, 41.1-41.5, 84.1-84.5
 */
export async function normalizeCopart(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const copartData = rawJson as CopartData;

	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	const damageRecords: DamageRecord[] = [];

	// Extract auction sale event
	if (copartData.saleDate) {
		events.push({
			type: 'auction_sale',
			date: copartData.saleDate,
			description: generateAuctionDescription(copartData),
			location: copartData.location,
			details: {
				auctionHouse: 'Copart',
				lotNumber: copartData.lotNumber,
				salePrice: copartData.salePrice,
				estimatedValue: copartData.estimatedValue,
				primaryDamage: copartData.primaryDamage,
				secondaryDamage: copartData.secondaryDamage,
				titleCode: copartData.titleCode
			}
		});
	}

	// Extract damage record
	if (copartData.primaryDamage && copartData.saleDate) {
		damageRecords.push({
			date: copartData.saleDate,
			primaryDamage: copartData.primaryDamage,
			secondaryDamage: copartData.secondaryDamage,
			titleCode: copartData.titleCode,
			location: copartData.location || 'Unknown'
		});
	}

	// Extract odometer reading from auction data
	if (copartData.odometer && copartData.odometer > 0 && copartData.saleDate) {
		odometerReadings.push({
			date: copartData.saleDate,
			mileage: copartData.odometer,
			source: 'auction',
			reportedBy: `Copart ${copartData.location || ''}`
		});
	}

	// Return normalized record
	return {
		vin,
		source: 'copart',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands: [],
		recalls: undefined,
		marketValue: undefined,
		damageRecords
	};
}
