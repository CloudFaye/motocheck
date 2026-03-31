import { Resend } from 'resend';
import { config } from './config';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendReport(
	to: string,
	reportId: string,
	vin: string,
	docxBuffer: Buffer,
	pdfBuffer?: Buffer
): Promise<void> {
	const subject = pdfBuffer 
		? `Your Vehicle Reports - ${vin}`
		: `Your Vehicle Report - ${vin}`;
	
	const attachments = pdfBuffer
		? [
				{
					filename: `motocheck-report-${vin}.docx`,
					content: docxBuffer
				},
				{
					filename: `motocheck-report-${vin}.pdf`,
					content: pdfBuffer
				}
		  ]
		: [
				{
					filename: `motocheck-report-${vin}.${docxBuffer ? 'docx' : 'pdf'}`,
					content: docxBuffer
				}
		  ];
	
	await resend.emails.send({
		from: config.FROM_EMAIL,
		to,
		subject,
		attachments,
		html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e5e7eb;">
							<h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0f0f0f; font-family: 'Instrument Serif', Georgia, serif;">MotoCheck</h1>
							<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Comprehensive Vehicle History Report</p>
						</td>
					</tr>
					
					<!-- Main Content -->
					<tr>
						<td style="padding: 32px;">
							<h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 600; color: #0f0f0f;">Your Report${pdfBuffer ? 's are' : ' is'} Ready</h2>
							<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">Thank you for using MotoCheck. Your comprehensive vehicle history and import duty report${pdfBuffer ? 's are' : ' is'} attached to this email.</p>
							
							<!-- VIN Card -->
							<table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
								<tr>
									<td style="padding: 20px;">
										<p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em;">Vehicle Identification Number</p>
										<p style="margin: 0; font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 600; color: #0f0f0f; letter-spacing: 0.05em;">${vin}</p>
									</td>
								</tr>
							</table>
							
							<!-- Attachments Info -->
							<table role="presentation" style="width: 100%; background-color: #fffbeb; border-radius: 8px; border-left: 3px solid #d4943a; margin-bottom: 24px;">
								<tr>
									<td style="padding: 16px 20px;">
										<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">📎 Attached Files</p>
										<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
											${pdfBuffer 
												? '• <strong>Word Document (DOCX)</strong> - Editable format, perfect for adding notes<br>• <strong>PDF Document</strong> - Print-ready format for archiving'
												: '• <strong>Vehicle Report</strong> - Your comprehensive vehicle history'
											}
										</p>
									</td>
								</tr>
							</table>
							
							<!-- Tips -->
							<table role="presentation" style="width: 100%; background-color: #f0f9ff; border-radius: 8px; border-left: 3px solid #3b82f6; margin-bottom: 24px;">
								<tr>
									<td style="padding: 16px 20px;">
										<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e40af;">💡 Quick Tips</p>
										<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e3a8a;">
											${pdfBuffer 
												? 'Use the Word document to add notes, highlight important sections, or share with your clearing agent. The PDF is perfect for printing or long-term storage.'
												: 'Open the Word document in Microsoft Word, Google Docs, or any compatible word processor to edit and customize your report.'
											}
										</p>
									</td>
								</tr>
							</table>
							
							<!-- What's Included -->
							<p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0f0f0f;">What's in your report:</p>
							<table role="presentation" style="width: 100%; margin-bottom: 24px;">
								<tr>
									<td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
										<span style="color: #10b981; margin-right: 8px;">✓</span> Complete vehicle specifications
									</td>
								</tr>
								<tr>
									<td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
										<span style="color: #10b981; margin-right: 8px;">✓</span> Nigerian import duty breakdown
									</td>
								</tr>
								<tr>
									<td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
										<span style="color: #10b981; margin-right: 8px;">✓</span> NCS valuation details
									</td>
								</tr>
								<tr>
									<td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
										<span style="color: #10b981; margin-right: 8px;">✓</span> Safety recall information
									</td>
								</tr>
								<tr>
									<td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
										<span style="color: #10b981; margin-right: 8px;">✓</span> Manufacturing and compliance data
									</td>
								</tr>
							</table>
							
							<!-- Support -->
							<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
								Questions? Contact us at <a href="mailto:support@motocheck.ng" style="color: #d4943a; text-decoration: none; font-weight: 500;">support@motocheck.ng</a>
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
							<table role="presentation" style="width: 100%;">
								<tr>
									<td style="text-align: center;">
										<p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #0f0f0f;">MotoCheck</p>
										<p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">Professional Vehicle Reports for Nigeria</p>
										<p style="margin: 0; font-size: 12px; color: #9ca3af;">
											<a href="https://www.motocheck.ng" style="color: #d4943a; text-decoration: none;">www.motocheck.ng</a>
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
				
				<!-- Legal Footer -->
				<table role="presentation" style="max-width: 600px; margin: 20px auto 0 auto;">
					<tr>
						<td style="text-align: center; padding: 0 20px;">
							<p style="margin: 0; font-size: 11px; line-height: 1.5; color: #9ca3af;">
								This report is based on data from NHTSA and official Nigerian Customs Service valuation tables. Always verify critical details independently before making purchase decisions.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`
	});
}
