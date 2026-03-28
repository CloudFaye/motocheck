import { Resend } from 'resend';
import { config } from './config';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendReport(
	to: string,
	reportId: string,
	vin: string,
	signedUrl: string
): Promise<void> {
	await resend.emails.send({
		from: config.FROM_EMAIL,
		to,
		subject: `Your VIN Report - ${vin}`,
		html: `
<h1>Your Vehicle Import Duty Report is Ready</h1>
<p>Thank you for using our VIN Check service.</p>
<p><strong>VIN:</strong> ${vin}</p>
<p><strong>Report ID:</strong> ${reportId}</p>
<p><a href="${signedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Download Report</a></p>
<p>This link will expire in 72 hours.</p>
<p>If you have any questions, please contact our support team.</p>
`
	});
}
