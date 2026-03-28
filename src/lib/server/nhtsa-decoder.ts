import { config } from './config';

export interface NHTSADecodedData {
	make: string;
	model: string;
	year: string;
	engine: string;
	displacement: string;
	bodyClass: string;
	plantCountry: string;
	driveType: string;
	fuelType: string;
}

interface NHTSAResult {
	VariableId: number;
	Value: string | null;
}

interface NHTSAResponse {
	Results: NHTSAResult[];
}

const VARIABLE_IDS = {
	MAKE: 26,
	MODEL: 28,
	YEAR: 29,
	ENGINE: 13,
	DISPLACEMENT: 11,
	BODY_CLASS: 5,
	PLANT_COUNTRY: 75,
	DRIVE_TYPE: 15,
	FUEL_TYPE: 24
} as const;

async function fetchWithRetry(url: string): Promise<Response> {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
		if (response.status === 503) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return fetch(url, { signal: AbortSignal.timeout(10000) });
		}
		return response;
	} catch (error) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return fetch(url, { signal: AbortSignal.timeout(10000) });
	}
}

export async function decodeVIN(vin: string): Promise<NHTSADecodedData> {
	const url = `${config.NHTSA_API_URL}/vehicles/DecodeVin/${vin}?format=json`;
	const response = await fetchWithRetry(url);

	if (!response.ok) {
		throw new Error(`NHTSA API error: ${response.status}`);
	}

	const data: NHTSAResponse = await response.json();
	const resultMap = new Map(data.Results.map((r) => [r.VariableId, r.Value || 'Unknown']));

	const decoded = {
		make: resultMap.get(VARIABLE_IDS.MAKE) || 'Unknown',
		model: resultMap.get(VARIABLE_IDS.MODEL) || 'Unknown',
		year: resultMap.get(VARIABLE_IDS.YEAR) || 'Unknown',
		engine: resultMap.get(VARIABLE_IDS.ENGINE) || 'Unknown',
		displacement: resultMap.get(VARIABLE_IDS.DISPLACEMENT) || 'Unknown',
		bodyClass: resultMap.get(VARIABLE_IDS.BODY_CLASS) || 'Unknown',
		plantCountry: resultMap.get(VARIABLE_IDS.PLANT_COUNTRY) || 'Unknown',
		driveType: resultMap.get(VARIABLE_IDS.DRIVE_TYPE) || 'Unknown',
		fuelType: resultMap.get(VARIABLE_IDS.FUEL_TYPE) || 'Unknown'
	};

	// Validate that we got real data (not all Unknown)
	if (decoded.make === 'Unknown' || decoded.model === 'Unknown' || decoded.year === 'Unknown') {
		throw new Error('VIN not found in NHTSA database. Please verify the VIN is correct.');
	}

	return decoded;
}
