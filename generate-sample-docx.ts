import { generateReport } from './src/lib/server/reports/generator';
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

async function generateSampleDOCX() {
	console.log('Generating sample DOCX...');
	
	try {
		const result = await generateReport(sampleData, 'docx');
		
		writeFileSync('sample-report.docx', result.buffer);
		
		console.log('✅ Sample DOCX generated successfully!');
		console.log(`   File: sample-report.docx`);
		console.log(`   Format: ${result.format}`);
		console.log(`   Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
		console.log(`   Generation time: ${result.generationTime}ms`);
		console.log(`   Hash: ${result.hash}`);
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Error generating DOCX:', error);
		process.exit(1);
	}
}

generateSampleDOCX();
