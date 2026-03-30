import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports, orders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getReport } from '$lib/server/storage-service';

export const GET: RequestHandler = async ({ params, url }) => {
	const { reportId } = params;
	const email = url.searchParams.get('email');
	const token = url.searchParams.get('token');

	if (!reportId) {
		error(400, 'Report ID required');
	}

	// Find report
	const reportRecords = await db
		.select({
			report: reports,
			order: orders
		})
		.from(reports)
		.innerJoin(orders, eq(reports.orderId, orders.id))
		.where(eq(reports.id, reportId))
		.limit(1);

	if (reportRecords.length === 0) {
		error(404, 'Report not found');
	}

	const { report, order } = reportRecords[0];

	// Verify access
	if (email) {
		// Email-based access
		if (order.email.toLowerCase() !== email.toLowerCase()) {
			error(403, 'Access denied');
		}
	} else if (token) {
		// Token-based access (for future implementation)
		// Verify token matches report
		error(501, 'Token authentication not yet implemented');
	} else {
		error(401, 'Authentication required');
	}

	// Verify order is paid
	if (order.status !== 'paid') {
		error(403, 'Report not available - payment pending');
	}

	try {
		// Fetch PDF from R2
		const pdfBuffer = await getReport(report.r2Key);

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="vehicle-report-${order.lookupId}.pdf"`,
				'Cache-Control': 'private, max-age=3600'
			}
		});
	} catch (err) {
		console.error('Error fetching report:', err);
		error(500, 'Failed to retrieve report');
	}
};
