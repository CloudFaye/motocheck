import valuationTable from './data/valuation_table.json';

export type ValuationConfidence = 'exact' | 'interpolated' | 'estimated';

export interface ValuationResult {
	cifUsd: number;
	confidence: ValuationConfidence;
	matchedKey: string;
}

const valuationMap = new Map<string, number>(Object.entries(valuationTable));

function buildKey(year: string, make: string, model: string): string {
	return `${year}-${make.toUpperCase()}-${model.toUpperCase()}`;
}

export function lookupValuation(year: string, make: string, model: string): ValuationResult {
	const key = buildKey(year, make, model);

	// Exact match
	const exactMatch = valuationMap.get(key);
	if (exactMatch) {
		return { cifUsd: exactMatch, confidence: 'exact', matchedKey: key };
	}

	// Interpolated match - find nearest year with same make-model
	const yearNum = parseInt(year);
	if (!isNaN(yearNum)) {
		const makeModel = `${make.toUpperCase()}-${model.toUpperCase()}`;
		const candidates: Array<{ year: number; value: number; key: string }> = [];

		for (const [k, v] of valuationMap.entries()) {
			if (k.includes(makeModel)) {
				const y = parseInt(k.split('-')[0]);
				if (!isNaN(y)) {
					candidates.push({ year: y, value: v, key: k });
				}
			}
		}

		if (candidates.length > 0) {
			candidates.sort((a, b) => Math.abs(a.year - yearNum) - Math.abs(b.year - yearNum));
			const nearest = candidates[0];
			return { cifUsd: nearest.value, confidence: 'interpolated', matchedKey: nearest.key };
		}
	}

	// Estimated fallback - average of make-model or hardcoded
	const makeUpper = make.toUpperCase();
	const matches: number[] = [];

	for (const [k, v] of valuationMap.entries()) {
		if (k.includes(makeUpper)) {
			matches.push(v);
		}
	}

	if (matches.length > 0) {
		const avg = Math.round(matches.reduce((a, b) => a + b, 0) / matches.length);
		return { cifUsd: avg, confidence: 'estimated', matchedKey: `${makeUpper}-AVERAGE` };
	}

	return { cifUsd: 10000, confidence: 'estimated', matchedKey: 'FALLBACK' };
}
