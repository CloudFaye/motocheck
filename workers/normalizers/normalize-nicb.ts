/**
 * NICB Normalizer
 *
 * Extracts theft records from NICB VINCheck API responses.
 * NICB (National Insurance Crime Bureau) tracks stolen vehicles.
 *
 * Requirements: 11.3
 */

import type { NormalizedVehicleRecord, VehicleEvent } from '../../src/lib/shared/types.js';

/**
 * NICB API response structure
 */
interface NicbResponse {
	vin: string;
	status?: string;
	theftRecords?: Array<{
		reportDate: string;
		recoveryDate?: string;
		location?: string;
		status: 'stolen' | 'recovered';
	}>;
	// NICB may return simple boolean flags
	isStolen?: boolean;
	stolenDate?: string;
	recoveredDate?: string;
}

/**
 * Normalize NICB theft data
 *
 * Requirements: 11.3
 */
export async function normalizeNicb(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const nicbData = rawJson as NicbResponse;

	const events: VehicleEvent[] = [];

	// Extract theft records if available
	if (nicbData.theftRecords && Array.isArray(nicbData.theftRecords)) {
		for (const record of nicbData.theftRecords) {
			// Create theft report event
			events.push({
				type: 'theft',
				date: record.reportDate,
				description:
					record.status === 'recovered'
						? `Vehicle reported stolen and later recovered`
						: `Vehicle reported stolen`,
				location: record.location,
				details: {
					status: record.status,
					reportDate: record.reportDate,
					recoveryDate: record.recoveryDate
				}
			});
		}
	}
	// Handle simple boolean flag format
	else if (nicbData.isStolen && nicbData.stolenDate) {
		events.push({
			type: 'theft',
			date: nicbData.stolenDate,
			description: nicbData.recoveredDate
				? `Vehicle reported stolen and later recovered`
				: `Vehicle reported stolen`,
			location: undefined,
			details: {
				status: nicbData.recoveredDate ? 'recovered' : 'stolen',
				reportDate: nicbData.stolenDate,
				recoveryDate: nicbData.recoveredDate
			}
		});
	}

	// Return normalized record
	return {
		vin,
		source: 'nicb',
		identity: undefined,
		events,
		odometerReadings: [],
		titleBrands: [],
		recalls: undefined,
		marketValue: undefined,
		damageRecords: undefined
	};
}
