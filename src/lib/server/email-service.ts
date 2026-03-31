import { Resend } from 'resend';
import { config } from './config';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendReport(
	to: string,
	reportId: string,
	vin: string,
	signedUrl: string,
	format: 'pdf' | 'docx' = 'docx'
): Promise<void> {
	const formatName = format === 'docx' ? 'Word Document (DOCX)' : 'PDF Document';
	const formatIcon = format === 'docx' ? '📄' : '📕';
	
	await resend.emails.send({
		from: config.FROM_EMAIL,
		to,
		subject: `${formatIcon} Your Vehicle Report (${formatName}) - ${vin}`,
		html: `
<h1>Your Vehicle Import Duty Report is Ready</h1>
<p>Thank you for using our VIN Check service.</p>
<p><strong>VIN:</strong> ${vin}</p>
<p><strong>Report ID:</strong> ${reportId}</p>
<p><strong>Format:</strong> ${formatIcon} ${formatName}</p>
<p><a href="${signedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Download Report</a></p>
<p>This link will expire in 72 hours.</p>
${format === 'docx' ? '<p><em>💡 Tip: Your Word document can be edited, annotated, and customized. Open it in Microsoft Word, Google Docs, or any compatible word processor.</em></p>' : ''}
<p>If you have any questions, please contact our support team.</p>
`
	});
}
