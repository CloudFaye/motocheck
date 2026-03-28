export interface ExchangeRate {
	cbnRate: number;
	parallelRate: number;
	fetchedAt: Date;
}

let currentRate: ExchangeRate = {
	cbnRate: 1500,
	parallelRate: 1650,
	fetchedAt: new Date()
};

let refreshInterval: NodeJS.Timeout | null = null;

export async function fetchExchangeRate(): Promise<ExchangeRate> {
	// TODO: Integrate with real CBN API or third-party rate provider
	// For MVP, using hardcoded rates
	currentRate = {
		cbnRate: 1500,
		parallelRate: 1650,
		fetchedAt: new Date()
	};

	return currentRate;
}

export function getCurrentRate(): ExchangeRate {
	// Start refresh interval on first access
	if (!refreshInterval) {
		refreshInterval = setInterval(
			() => {
				fetchExchangeRate().catch(console.error);
			},
			6 * 60 * 60 * 1000
		);
	}
	
	return currentRate;
}
