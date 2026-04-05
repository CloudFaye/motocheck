/**
 * CarGurus Normalizer
 * 
 * Extracts market value data from CarGurus price ratings.
 * CarGurus provides price analysis and market comparisons.
 * 
 * Requirements: 40.1-40.6
 */

import type {
	NormalizedVehicleRecord,
	VehicleEvent,
	OdometerReading,
	MarketValue
} from '../../src/lib/shared/types.js';

/**
 * CarGurus scraped data structure
 */
interface CarGurusData {
	vin: string;
	currentPrice?: number;
	priceRating?: string; // 'Great Deal', 'Good Deal', 'Fair Price', 'High Price', 'Overpriced'
	marketAverage?: number;
	daysOnMarket?: number;
	dealRating?: number; // Numeric rating (e.g., 4.5 out of 5)
	listingDate?: string;
}

/**
 * Normalize CarGurus price data
 * 
 * Requirements: 40.1-40.6
 */
export async function normalizeCargurus(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const cargurusData = rawJson as CarGurusData;
	
	// CarGurus primarily provides market value data, not events
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	
	// Extract market value data
	const marketValue: MarketValue | undefined = cargurusData.currentPrice || cargurusData.marketAverage ? {
		askingPrice: cargurusData.currentPrice,
		priceRating: cargurusData.priceRating,
		marketAverage: cargurusData.marketAverage,
		daysOnMarket: cargurusData.daysOnMarket,
		currency: 'USD'
	} : undefined;
	
	// Return normalized record
	return {
		vin,
		source: 'cargurus',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands: [],
		recalls: undefined,
		marketValue,
		damageRecords: undefined
	};
}
