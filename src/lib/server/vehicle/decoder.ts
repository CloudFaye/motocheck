/**
 * Vehicle Decoder Service
 * Main entry point for decoding VINs and aggregating vehicle data
 */

import { decodeVIN, getRecalls } from './nhtsa-client';
import {
	mapIdentification,
	mapEngine,
	mapTransmission,
	mapDimensions,
	mapBody,
	mapSafety,
	mapTires,
	mapManufacturing,
	mapMarket,
	mapValidation,
	mapRecalls
} from './nhtsa-mapper';
import type { ComprehensiveVehicleData } from './types';

/**
 * Decode VIN and return comprehensive vehicle data
 * Aggregates data from multiple sources (NHTSA, recalls, etc.)
 */
export async function decodeVehicle(vin: string): Promise<ComprehensiveVehicleData> {
	// Fetch data from NHTSA
	const nhtsaData = await decodeVIN(vin);

	// Validate essential fields
	if (!nhtsaData.get('Make') || !nhtsaData.get('Model') || !nhtsaData.get('Model Year')) {
		throw new Error('VIN not found in NHTSA database. Please verify the VIN is correct.');
	}

	// Fetch recalls in parallel
	const recallsPromise = getRecalls(vin);

	// Map all data sections
	const vehicleData: ComprehensiveVehicleData = {
		identification: mapIdentification(nhtsaData, vin),
		engine: mapEngine(nhtsaData),
		transmission: mapTransmission(nhtsaData),
		dimensions: mapDimensions(nhtsaData),
		body: mapBody(nhtsaData),
		safety: mapSafety(nhtsaData),
		tires: mapTires(nhtsaData),
		manufacturing: mapManufacturing(nhtsaData),
		market: mapMarket(nhtsaData),
		validation: mapValidation(nhtsaData),
		recalls: mapRecalls(await recallsPromise)
	};

	return vehicleData;
}

/**
 * Get basic vehicle info for quick lookups (backward compatibility)
 */
export async function decodeVINBasic(vin: string) {
	const data = await decodeVIN(vin);

	return {
		make: data.get('Make') || 'Unknown',
		model: data.get('Model') || 'Unknown',
		year: data.get('Model Year') || 'Unknown',
		engine: data.get('Engine Model') || 'Unknown',
		displacement: data.get('Displacement (L)') || 'Unknown',
		bodyClass: data.get('Body Class') || 'Unknown',
		plantCountry: data.get('Plant Country') || 'Unknown',
		driveType: data.get('Drive Type') || 'Unknown',
		fuelType: data.get('Fuel Type - Primary') || 'Unknown'
	};
}
