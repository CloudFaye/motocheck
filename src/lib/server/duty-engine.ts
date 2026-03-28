export interface DutyBreakdown {
	cifNgn: number;
	cifUsd: number;
	importDuty: number;
	surcharge: number;
	nacLevy: number;
	ciss: number;
	etls: number;
	vat: number;
	totalDutyNgn: number;
	totalDutyUsd: number;
	cbnRate: number;
	rateTimestamp: Date;
	financeActYear: number;
}

export function calculateDuty(cifUsd: number, cbnRate: number): DutyBreakdown {
	const cifNgn = cifUsd * cbnRate;
	const importDuty = cifNgn * 0.35;
	const surcharge = importDuty * 0.07;
	const nacLevy = cifNgn * 0.2;
	const ciss = cifNgn * 0.01;
	const etls = cifNgn * 0.005;
	const vat = (cifNgn + importDuty + surcharge + nacLevy + ciss + etls) * 0.075;
	const totalDutyNgn = importDuty + surcharge + nacLevy + ciss + etls + vat;

	return {
		cifNgn: Math.round(cifNgn),
		cifUsd,
		importDuty: Math.round(importDuty),
		surcharge: Math.round(surcharge),
		nacLevy: Math.round(nacLevy),
		ciss: Math.round(ciss),
		etls: Math.round(etls),
		vat: Math.round(vat),
		totalDutyNgn: Math.round(totalDutyNgn),
		totalDutyUsd: Math.round(totalDutyNgn / cbnRate),
		cbnRate,
		rateTimestamp: new Date(),
		financeActYear: 2024
	};
}
