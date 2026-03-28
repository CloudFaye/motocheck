import { db } from './src/lib/server/db/index';
import { lookups } from './src/lib/server/db/schema';
import { sql } from 'drizzle-orm';

async function clearInvalidVINs() {
	console.log('Checking for invalid VINs in cache...');

	// Find lookups with Unknown make, model, or year
	const allLookups = await db.select().from(lookups);
	
	let invalidCount = 0;
	const invalidIds: string[] = [];

	for (const lookup of allLookups) {
		const decoded = lookup.decodedJson as any;
		if (decoded.make === 'Unknown' || decoded.model === 'Unknown' || decoded.year === 'Unknown') {
			invalidIds.push(lookup.id);
			invalidCount++;
			console.log(`Found invalid VIN: ${lookup.vin} (${decoded.make} ${decoded.model} ${decoded.year})`);
		}
	}

	if (invalidCount === 0) {
		console.log('✅ No invalid VINs found in cache');
		process.exit(0);
	}

	console.log(`\nFound ${invalidCount} invalid VIN(s). Deleting...`);

	// Delete invalid lookups
	await db.delete(lookups).where(sql`id = ANY(${invalidIds})`);

	console.log(`✅ Cleared ${invalidCount} invalid VIN(s) from cache`);
	process.exit(0);
}

clearInvalidVINs().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
