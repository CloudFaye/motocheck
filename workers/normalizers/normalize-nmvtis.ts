/**
 * NMVTIS Normalizer
 * 
 * Extracts title history, title brands, and odometer readings from NMVTIS data.
 * NMVTIS provides official title transfer records from state DMVs.
 * 
 * Requirements: 11.3, 11.4, 11.5, 42.1-42.5
 */

import type {
	NormalizedVehicleRecord,
	VehicleEvent,
	OdometerReading,
	TitleBrandRecord,
	TitleBrand
} from '../../src/lib/shared/types.js';

/**
 * NMVTIS API response structure (example - adjust based on actual API)
 */
interface NmvtisResponse {
	vin: string;
	titleRecords?: Array<{
		date: string;
		state: string;
		titleNumber?: string;
		odometer?: number;
		odometerUnit?: string;
		transferType?: string;
	}>;
	titleBrands?: Array<{
		brand: string;
		date: string;
		state: string;
		description?: string;
	}>;
	theftRecords?: Array<{
		date: string;
		status: string;
	}>;
}

/**
 * Map NMVTIS brand strings to our TitleBrand enum
 */
function mapTitleBrand(brand: string): TitleBrand {
	const brandLower = brand.toLowerCase();
	
	if (brandLower.includes('salvage')) return 'salvage';
	if (brandLower.includes('rebuilt') || brandLower.includes('reconstructed')) return 'rebuilt';
	if (brandLower.includes('flood') || brandLower.includes('water')) return 'flood';
	if (brandLower.includes('hail')) return 'hail';
	if (brandLower.includes('lemon') || brandLower.includes('manufacturer buyback')) return 'lemon';
	
	return 'other';
}

/**
 * Normalize NMVTIS data
 * 
 * Requirements: 11.3, 11.4, 11.5, 42.1-42.5
 */
export async function normalizeNmvtis(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const nmvtisData = rawJson as NmvtisResponse;
	
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	const titleBrands: TitleBrandRecord[] = [];
	
	// Extract title history and create title transfer events
	if (nmvtisData.titleRecords && Array.isArray(nmvtisData.titleRecords)) {
		for (const record of nmvtisData.titleRecords) {
			// Create title transfer event
			events.push({
				type: 'title_transfer',
				date: record.date,
				description: `Title transferred in ${record.state}${record.titleNumber ? ` (Title #${record.titleNumber})` : ''}`,
				location: record.state,
				details: {
					state: record.state,
					titleNumber: record.titleNumber,
					transferType: record.transferType || 'sale'
				}
			});
			
			// Extract odometer reading from title transfer
			if (record.odometer && record.odometer > 0) {
				odometerReadings.push({
					date: record.date,
					mileage: record.odometer,
					source: 'title_transfer',
					reportedBy: `${record.state} DMV`
				});
			}
		}
	}
	
	// Extract title brands
	if (nmvtisData.titleBrands && Array.isArray(nmvtisData.titleBrands)) {
		for (const brand of nmvtisData.titleBrands) {
			const mappedBrand = mapTitleBrand(brand.brand);
			
			titleBrands.push({
				brand: mappedBrand,
				date: brand.date,
				state: brand.state,
				description: brand.description
			});
			
			// Create title brand event
			events.push({
				type: 'title_brand',
				date: brand.date,
				description: `${brand.brand} title brand issued in ${brand.state}`,
				location: brand.state,
				details: {
					brand: mappedBrand,
					originalBrand: brand.brand,
					description: brand.description
				}
			});
		}
	}
	
	// Return normalized record
	return {
		vin,
		source: 'nmvtis',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands,
		recalls: undefined,
		marketValue: undefined,
		damageRecords: undefined
	};
}
