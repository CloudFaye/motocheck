/**
 * IAAI Normalizer
 * 
 * Extracts auction events, damage records, and odometer readings from IAAI data.
 * IAAI (Insurance Auto Auctions) is another major salvage vehicle auction platform.
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
 * IAAI scraped data structure
 */
interface IaaiData {
	vin: string;
	stockNumber?: string;
	saleDate?: string;
	location?: string;
	mileage?: number;
	damageType?: string;
	secondaryDamage?: string;
	lossType?: string;
	estimatedValue?: number;
	salePrice?: number;
	images?: string[];
}

/**
 * Generate human-readable event description for IAAI auction
 * Requirements: 84.1-84.5
 */
function generateAuctionDescription(data: IaaiData): string {
	const parts: string[] = ['Vehicle sold at IAAI auction'];
	
	if (data.location) {
		parts.push(`in ${data.location}`);
	}
	
	if (data.damageType) {
		parts.push(`with ${data.damageType.toLowerCase()} damage`);
	}
	
	if (data.salePrice) {
		parts.push(`for $${data.salePrice.toLocaleString()}`);
	}
	
	return parts.join(' ');
}

/**
 * Normalize IAAI auction data
 * 
 * Requirements: 11.3, 11.4, 41.1-41.5, 84.1-84.5
 */
export async function normalizeIaai(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const iaaiData = rawJson as IaaiData;
	
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	const damageRecords: DamageRecord[] = [];
	
	// Extract auction sale event
	if (iaaiData.saleDate) {
		events.push({
			type: 'auction_sale',
			date: iaaiData.saleDate,
			description: generateAuctionDescription(iaaiData),
			location: iaaiData.location,
			details: {
				auctionHouse: 'IAAI',
				stockNumber: iaaiData.stockNumber,
				salePrice: iaaiData.salePrice,
				estimatedValue: iaaiData.estimatedValue,
				damageType: iaaiData.damageType,
				secondaryDamage: iaaiData.secondaryDamage,
				lossType: iaaiData.lossType
			}
		});
	}
	
	// Extract damage record
	if (iaaiData.damageType && iaaiData.saleDate) {
		damageRecords.push({
			date: iaaiData.saleDate,
			primaryDamage: iaaiData.damageType,
			secondaryDamage: iaaiData.secondaryDamage,
			titleCode: iaaiData.lossType, // IAAI uses lossType similar to title code
			location: iaaiData.location || 'Unknown'
		});
	}
	
	// Extract odometer reading from auction data
	if (iaaiData.mileage && iaaiData.mileage > 0 && iaaiData.saleDate) {
		odometerReadings.push({
			date: iaaiData.saleDate,
			mileage: iaaiData.mileage,
			source: 'auction',
			reportedBy: `IAAI ${iaaiData.location || ''}`
		});
	}
	
	// Return normalized record
	return {
		vin,
		source: 'iaai',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands: [],
		recalls: undefined,
		marketValue: undefined,
		damageRecords
	};
}
