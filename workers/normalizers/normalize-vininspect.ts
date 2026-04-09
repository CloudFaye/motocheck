/**
 * VINInspect Normalizer
 * 
 * Extracts service records, recalls, and odometer readings from VINInspect.
 * VINInspect provides comprehensive vehicle history including service records.
 */

import type {
	NormalizedVehicleRecord,
	VehicleEvent,
	OdometerReading,
	RecallRecord
} from '../../src/lib/shared/types.js';

/**
 * VINInspect scraped data structure
 */
interface VINInspectData {
	year: string | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	odometer: number | null;
	titleStatus: string | null;
	accidentHistory: string | null;
	ownershipHistory: string | null;
	serviceRecords: Array<{
		date: string;
		description: string;
		mileage: number | null;
	}>;
	images: string[];
	recalls: Array<{
		campaign: string;
		description: string;
	}>;
}

/**
 * Generate human-readable event description for service record
 */
function generateServiceDescription(record: VINInspectData['serviceRecords'][0]): string {
	return `Service: ${record.description}`;
}

/**
 * Normalize VINInspect data
 */
export async function normalizeVininspect(
	vin: string,
	rawJson: unknown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_rawHtml: string | null
): Promise<NormalizedVehicleRecord> {
	const vininspectData = rawJson as VINInspectData;
	
	const events: VehicleEvent[] = [];
	const odometerReadings: OdometerReading[] = [];
	const recalls: RecallRecord[] = [];
	
	// Extract service record events
	if (vininspectData.serviceRecords && vininspectData.serviceRecords.length > 0) {
		for (const record of vininspectData.serviceRecords) {
			if (record.date && record.description) {
				events.push({
					type: 'inspection',
					date: record.date,
					description: generateServiceDescription(record),
					details: {
						source: 'VINInspect',
						serviceType: record.description,
						mileage: record.mileage
					}
				});
				
				// Extract odometer reading from service record
				if (record.mileage && record.mileage > 0) {
					odometerReadings.push({
						date: record.date,
						mileage: record.mileage,
						source: 'service_record',
						reportedBy: 'VINInspect service record'
					});
				}
			}
		}
	}
	
	// Extract recalls
	if (vininspectData.recalls && vininspectData.recalls.length > 0) {
		for (const recall of vininspectData.recalls) {
			if (recall.campaign && recall.description) {
				recalls.push({
					component: 'Unknown',
					summary: recall.description,
					consequence: '',
					remedy: '',
					reportReceivedDate: new Date().toISOString(),
					nhtsaCampaignNumber: recall.campaign
				});
				
				events.push({
					type: 'recall',
					date: new Date().toISOString(),
					description: `Recall: ${recall.description}`,
					details: {
						campaign: recall.campaign,
						source: 'VINInspect'
					}
				});
			}
		}
	}
	
	// Extract accident history if available
	if (vininspectData.accidentHistory && vininspectData.accidentHistory !== 'None' && vininspectData.accidentHistory !== 'No accidents reported') {
		events.push({
			type: 'accident',
			date: new Date().toISOString(), // VINInspect doesn't provide specific dates
			description: `Accident history: ${vininspectData.accidentHistory}`,
			details: {
				source: 'VINInspect',
				accidentHistory: vininspectData.accidentHistory
			}
		});
	}
	
	// Return normalized record
	return {
		vin,
		source: 'vininspect',
		identity: undefined,
		events,
		odometerReadings,
		titleBrands: [],
		recalls: recalls.length > 0 ? recalls : undefined,
		marketValue: undefined,
		damageRecords: undefined
	};
}
