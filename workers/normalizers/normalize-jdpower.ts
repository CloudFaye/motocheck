/**
 * JD Power Normalizer
 *
 * Extracts listing, pricing, and odometer data from JD Power inventory pages.
 */

import type {
	MarketValue,
	NormalizedVehicleRecord,
	OdometerReading,
	VehicleEvent
} from '../../src/lib/shared/types.js';

interface JDPowerData {
	year?: string | null;
	make?: string | null;
	model?: string | null;
	trim?: string | null;
	price?: number | null;
	mileage?: number | null;
	dealerName?: string | null;
	dealerLocation?: string | null;
	listingUrl?: string | null;
}

function buildListingDescription(data: JDPowerData): string {
	const parts = ['Vehicle listed on JD Power'];

	if (data.dealerName) {
		parts.push(`by ${data.dealerName}`);
	}

	if (data.dealerLocation) {
		parts.push(`in ${data.dealerLocation}`);
	}

	if (data.price) {
		parts.push(`for $${data.price.toLocaleString()}`);
	}

	return parts.join(' ');
}

export async function normalizeJdpower(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const data = rawJson as JDPowerData;
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];

	// JD Power pages often do not expose a reliable listing date. We use a
	// synthetic "first seen" event date so the listing can still participate in
	// the stitched timeline instead of being discarded entirely.
	const listingDate = new Date().toISOString();

	if (data.price || data.dealerName || data.listingUrl) {
		events.push({
			type: 'listing',
			date: listingDate,
			description: buildListingDescription(data),
			location: data.dealerLocation || undefined,
			details: {
				platform: 'JD Power',
				dealer: data.dealerName,
				price: data.price,
				listingUrl: data.listingUrl
			}
		});
	}

	if (data.mileage && data.mileage > 0) {
		odometerReadings.push({
			date: listingDate,
			mileage: data.mileage,
			source: 'listing',
			reportedBy: data.dealerName || 'JD Power listing'
		});
	}

	const marketValue: MarketValue | undefined = data.price
		? {
				askingPrice: data.price,
				currency: 'USD'
			}
		: undefined;

	return {
		vin,
		source: 'jdpower',
		events,
		odometerReadings,
		titleBrands: [],
		marketValue
	};
}
