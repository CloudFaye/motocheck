/**
 * NHTSA API Client
 * Handles all communication with NHTSA VIN decoder and recall APIs
 */

import { config } from '../config';

interface NHTSAResult {
	Variable: string;
	VariableId: number;
	Value: string | null;
}

interface NHTSAResponse {
	Results: NHTSAResult[];
}

/**
 * Fetch with automatic retry on failure
 */
async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
		if (response.status === 503 && retries > 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return fetchWithRetry(url, retries - 1);
		}
		return response;
	} catch (error) {
		if (retries > 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return fetchWithRetry(url, retries - 1);
		}
		throw error;
	}
}

/**
 * Decode VIN and return raw NHTSA data
 */
export async function decodeVIN(vin: string): Promise<Map<string, string>> {
	const url = `${config.NHTSA_API_URL}/vehicles/DecodeVin/${vin}?format=json`;
	const response = await fetchWithRetry(url);

	if (!response.ok) {
		throw new Error(`NHTSA API error: ${response.status}`);
	}

	const data: NHTSAResponse = await response.json();

	// Convert to Map for easy lookup
	const resultMap = new Map<string, string>();
	data.Results.forEach((result) => {
		if (result.Value) {
			resultMap.set(result.Variable, result.Value);
		}
	});

	return resultMap;
}

interface RecallResult {
	Component?: string;
	Summary?: string;
	Consequence?: string;
	Remedy?: string;
	ReportReceivedDate?: string;
	NHTSACampaignNumber?: string;
}

/**
 * Fetch recall information for a VIN
 */
export async function getRecalls(vin: string): Promise<RecallResult[]> {
	try {
		const url = `${config.NHTSA_API_URL}/Recalls/GetRecallsByVIN/${vin}?format=json`;
		const response = await fetchWithRetry(url);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		return data.Results || [];
	} catch (error) {
		console.error('Failed to fetch recalls:', error);
		return [];
	}
}
