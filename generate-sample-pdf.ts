import { generateReport } from './src/lib/server/report-generator';
import { writeFileSync } from 'fs';

const sampleData = {
	vin: '1HGBH41JXMN109186',
	make: 'Honda',
	model: 'Accord',
	year: '2021',
	engine: '2.0L L4 DOHC 16V TURBO',
	bodyClass: 'Sedan/Saloon',
	plantCountry: 'United States',
	cifUsd: 25000,
	cifNgn: 37500000,
	confidence: 'Exact Match',
	importDuty: 13125000,
	surcharge: 2625000,
	nacLevy: 7500000,
	ciss: 375000,
	etls: 187500,
	vat: 3281250,
	totalDutyNgn: 27093750,
	cbnRate: 1500,
	rateTimestamp: new Date()
};

async function generateSamplePDF() {
	console.log('Generating sample PDF...');
	
	const { pdfBuffer } = await generateReport(sampleData);
	
	writeFileSync('static/docs/sample-report.pdf', pdfBuffer);
	
	console.log('✅ Sample PDF generated at static/docs/sample-report.pdf');
	process.exit(0);
}

generateSamplePDF().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
