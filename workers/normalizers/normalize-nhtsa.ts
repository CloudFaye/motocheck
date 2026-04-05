/**
 * NHTSA Normalizers
 * 
 * Wraps existing NHTSA mapper logic to transform NHTSA API responses
 * into the unified NormalizedVehicleRecord schema.
 * 
 * Requirements: 11.2, 11.5, 33.1, 33.2, 39.1-39.5, 43.1-43.5
 */

import type { 
	NormalizedVehicleRecord, 
	VehicleIdentity,
	VehicleEvent,
	RecallRecord
} from '../../src/lib/shared/types.js';
import type { ComprehensiveVehicleData } from '../../src/lib/server/vehicle/types.js';

/**
 * Normalize NHTSA decode data
 * Wraps existing NHTSA mapper logic without rewriting
 * 
 * Requirements: 11.2, 33.1, 33.2, 39.1-39.5
 */
export async function normalizeNhtsaDecode(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	// The raw data is already the ComprehensiveVehicleData from the existing decoder
	const vehicleData = rawJson as ComprehensiveVehicleData;
	
	// Extract vehicle identity fields
	const identity: VehicleIdentity = {
		year: parseInt(vehicleData.identification.modelYear) || 0,
		make: vehicleData.identification.make || '',
		model: vehicleData.identification.model || '',
		trim: vehicleData.identification.trim || undefined,
		bodyStyle: vehicleData.body.bodyClass || undefined,
		engineDescription: vehicleData.engine.model || 
			`${vehicleData.engine.displacementL || ''} ${vehicleData.engine.configuration || ''}`.trim() || undefined,
		driveType: vehicleData.transmission.driveType || undefined,
		fuelType: vehicleData.engine.fuelTypePrimary || undefined
	};
	
	// NHTSA decode doesn't produce events, just vehicle identity
	const events: VehicleEvent[] = [];
	
	// Return normalized record
	return {
		vin,
		source: 'nhtsa_decode',
		identity,
		events,
		odometerReadings: [],
		titleBrands: [],
		recalls: undefined, // Recalls come from separate NHTSA recalls API
		marketValue: undefined,
		damageRecords: undefined
	};
}

/**
 * Normalize NHTSA recalls data
 * Extracts recalls and creates recall events for timeline
 * 
 * Requirements: 11.5, 43.1-43.5
 */
export async function normalizeNhtsaRecalls(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	// The raw data is already the ComprehensiveVehicleData from the existing decoder
	const vehicleData = rawJson as ComprehensiveVehicleData;
	
	// Extract recalls
	const recalls: RecallRecord[] = vehicleData.recalls.map(recall => ({
		component: recall.component,
		summary: recall.summary,
		consequence: recall.consequence,
		remedy: recall.remedy,
		reportReceivedDate: recall.reportReceivedDate,
		nhtsaCampaignNumber: recall.nhtsaCampaignNumber
	}));
	
	// Create recall events for timeline
	const events: VehicleEvent[] = recalls.map(recall => ({
		type: 'recall' as const,
		date: recall.reportReceivedDate,
		description: `Recall issued for ${recall.component}: ${recall.summary}`,
		location: undefined,
		details: {
			component: recall.component,
			summary: recall.summary,
			consequence: recall.consequence,
			remedy: recall.remedy,
			campaignNumber: recall.nhtsaCampaignNumber
		}
	}));
	
	// Return normalized record
	return {
		vin,
		source: 'nhtsa_recalls',
		identity: undefined,
		events,
		odometerReadings: [],
		titleBrands: [],
		recalls,
		marketValue: undefined,
		damageRecords: undefined
	};
}
