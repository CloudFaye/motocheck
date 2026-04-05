/**
 * AutoTrader Normalizer
 * 
 * Extracts listing events, market value data, and odometer readings from AutoTrader.
 * AutoTrader provides current market pricing and dealer listings.
 * 
 * Requirements: 11.3, 11.4, 40.1-40.6
 */

import type {
	NormalizedVehicleRecord,
	VehicleEvent,
	OdometerReading,
	MarketValue
} from '../../src/lib/shared/types.js';

/**
 * AutoTrader scraped data structure
 */
interface AutoTraderData {
	vin: string;
	listingDate?: string;
	price?: number;
	mileage?: number;
	dealer?: string;
	dealerLocation?: string;
	city?: string;
	state?: string;
	condition?: string;
	daysOnMarket?: number;
	images?: string[];
}

/**
 * Generate human-readable event description for AutoTrader listing
 * Requirements: 84.1-84.5
 */
function generateListingDescription(data: AutoTraderData): string {
	const parts: string[] = ['Vehicle listed for sale'];
	
	if (data.dealer) {
		parts.push(`by ${data.dealer}`);
	}
	
	if (data.city && data.state) {
		parts.push(`in ${data.city}, ${data.state}`);
	} else if (data.dealerLocation) {
		parts.push(`in ${data.dealerLocation}`);
	}
	
	if (data.price) {
		parts.push(`for $${data.price.toLocaleString()}`);
	}
	
	return parts.join(' ');
}

/**
 * Normalize AutoTrader listing data
 * 
 * Requirements: 11.3, 11.4, 40.1-40.6
 */
export async function normalizeAutotrader(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const autotraderData = rawJson as AutoTraderData;
	
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	
	// Extract listing event
	if (autotraderData.listingDate) {
		const location = autotraderData.city && autotraderData.state
			? `${autotraderData.city}, ${autotraderData.state}`
			: autotraderData.dealerLocation;
		
		events.push({
			type: 'listing',
			date: autotraderData.listingDate,
			description: generateListingDescription(autotraderData),
			location,
			details: {
				platform: 'AutoTrader',
				dealer: autotraderData.dealer,
				price: autotraderData.price,
				condition: autotraderData.condition,
				daysOnMarket: autotraderData.daysOnMarket
			}
		});
	}
	
	// Extract odometer reading from listing
	if (autotraderData.mileage && autotraderData.mileage > 0 && autotraderData.listingDate) {
		odometerReadings.push({
			date: autotraderData.listingDate,
			mileage: autotraderData.mileage,
			source: 'listing',
			reportedBy: autotraderData.dealer || 'AutoTrader listing'
		});
	}
	
	// Extract market value data
	const marketValue: MarketValue | undefined = autotraderData.price ? {
		askingPrice: autotraderData.price,
		priceRating: undefined,
		marketAverage: undefined,
		daysOnMarket: autotraderData.daysOnMarket,
		currency: 'USD'
	} : undefined;
	
	// Return normalized record
	return {
		vin,
		source: 'autotrader',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands: [],
		recalls: undefined,
		marketValue,
		damageRecords: undefined
	};
}
