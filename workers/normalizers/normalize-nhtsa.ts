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
	// The raw data is the NHTSA API response format: { Results: [...] }
	const nhtsaResponse = rawJson as { Results?: Array<{ Variable: string; Value: string | null }> };
	
	if (!nhtsaResponse.Results || !Array.isArray(nhtsaResponse.Results)) {
		throw new Error('Invalid NHTSA decode response format');
	}
	
	// Helper to extract value by variable name
	const getValue = (variableName: string): string | undefined => {
		const result = nhtsaResponse.Results?.find(r => r.Variable === variableName);
		return result?.Value || undefined;
	};
	
	// Extract vehicle identity fields from NHTSA Results array
	const identity: VehicleIdentity = {
		year: parseInt(getValue('Model Year') || '0') || 0,
		make: getValue('Make') || '',
		model: getValue('Model') || '',
		trim: getValue('Trim') || undefined,
		bodyStyle: getValue('Body Class') || undefined,
		engineDescription: getValue('Engine Model') || 
			`${getValue('Displacement (L)') || ''} ${getValue('Engine Configuration') || ''}`.trim() || undefined,
		driveType: getValue('Drive Type') || undefined,
		fuelType: getValue('Fuel Type - Primary') || undefined
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
	// The raw data is the NHTSA recalls API response format
	const nhtsaResponse = rawJson as { results?: Array<{
		Component?: string;
		Summary?: string;
		Consequence?: string;
		Remedy?: string;
		ReportReceivedDate?: string;
		NHTSACampaignNumber?: string;
	}> };
	
	// Handle empty results (no recalls found)
	if (!nhtsaResponse.results || !Array.isArray(nhtsaResponse.results) || nhtsaResponse.results.length === 0) {
		return {
			vin,
			source: 'nhtsa_recalls',
			identity: undefined,
			events: [],
			odometerReadings: [],
			titleBrands: [],
			recalls: [],
			marketValue: undefined,
			damageRecords: undefined
		};
	}
	
	// Extract recalls
	const recalls: RecallRecord[] = nhtsaResponse.results.map(recall => ({
		component: recall.Component || 'Unknown',
		summary: recall.Summary || '',
		consequence: recall.Consequence || '',
		remedy: recall.Remedy || '',
		reportReceivedDate: recall.ReportReceivedDate || '',
		nhtsaCampaignNumber: recall.NHTSACampaignNumber || ''
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
