import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('DATABASE_URL not set');
	process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function checkOrders() {
	try {
		console.log('Fetching recent orders...\n');
		
		const orders = await sql`
			SELECT 
				o.id,
				o.email,
				o.amount_ngn,
				o.payment_ref,
				o.payment_id,
				o.status,
				o.source,
				o.created_at,
				o.paid_at,
				l.vin
			FROM orders o
			LEFT JOIN lookups l ON o.lookup_id = l.id
			ORDER BY o.created_at DESC
			LIMIT 10
		`;
		
		console.log(`Found ${orders.length} recent orders:\n`);
		
		orders.forEach((order, i) => {
			console.log(`${i + 1}. Order ${order.id}`);
			console.log(`   VIN: ${order.vin}`);
			console.log(`   Email: ${order.email}`);
			console.log(`   Amount: ₦${order.amount_ngn}`);
			console.log(`   Status: ${order.status}`);
			console.log(`   Payment Ref: ${order.payment_ref}`);
			console.log(`   Payment ID: ${order.payment_id || 'N/A'}`);
			console.log(`   Created: ${order.created_at}`);
			console.log(`   Paid: ${order.paid_at || 'Not paid'}`);
			console.log('');
		});
		
		// Check for reports
		const reports = await sql`
			SELECT 
				r.id,
				r.order_id,
				r.r2_key,
				r.sent_at,
				o.email
			FROM reports r
			LEFT JOIN orders o ON r.order_id = o.id
			ORDER BY r.created_at DESC
			LIMIT 5
		`;
		
		console.log(`\nFound ${reports.length} recent reports:\n`);
		
		reports.forEach((report, i) => {
			console.log(`${i + 1}. Report ${report.id}`);
			console.log(`   Order ID: ${report.order_id}`);
			console.log(`   Email: ${report.email}`);
			console.log(`   R2 Key: ${report.r2_key}`);
			console.log(`   Sent: ${report.sent_at}`);
			console.log('');
		});
		
		await sql.end();
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		await sql.end();
		process.exit(1);
	}
}

checkOrders();
