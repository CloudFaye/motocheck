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
	
	// Plain text version for email clients that don't support HTML
	const textContent = `
MotoCheck - Your Vehicle Report${pdfBuffer ? 's are' : ' is'} Ready

Thank you for using MotoCheck. Your comprehensive vehicle history and import duty report${pdfBuffer ? 's are' : ' is'} attached to this email.

VEHICLE IDENTIFICATION NUMBER
${vin}

ATTACHED FILES
${pdfBuffer 
	? '• Word Document (DOCX) - Editable format, perfect for adding notes\n• PDF Document - Print-ready format for archiving'
	: '• Vehicle Report - Your comprehensive vehicle history'
}

WHAT'S IN YOUR REPORT
✓ Complete vehicle specifications
✓ Nigerian import duty breakdown
✓ NCS valuation details
✓ Safety recall information
✓ Manufacturing and compliance data

${pdfBuffer 
	? 'TIP: Use the Word document to add notes, highlight important sections, or share with your clearing agent. The PDF is perfect for printing or long-term storage.'
	: 'TIP: Open the Word document in Microsoft Word, Google Docs, or any compatible word processor to edit and customize your report.'
}

Questions? Contact us at support@motocheck.ng

---
MotoCheck
Professional Vehicle Reports for Nigeria
www.motocheck.ng

This report is based on data from NHTSA and official Nigerian Customs Service valuation tables. Always verify critical details independently before making purchase decisions.
`;
	
	await resend.emails.send({
		from: config.FROM_EMAIL,
		to,
		subject,
		attachments,
		text: textContent,
		html: `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>Your MotoCheck Report${pdfBuffer ? 's are' : ' is'} Ready</title>
	<!--[if mso]>
	<style type="text/css">
		body, table, td {font-family: Arial, sans-serif !important;}
	</style>
	<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
	<!-- Wrapper Table -->
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
		<tr>
			<td style="padding: 40px 20px;">
				<!-- Main Container -->
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
					
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 32px 40px; border-bottom: 1px solid #e5e7eb;">
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td>
										<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">MotoCheck</h1>
										<p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b; font-weight: 500;">Comprehensive Vehicle History Report</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					
					<!-- Main Content -->
					<tr>
						<td style="padding: 40px;">
							<!-- Greeting -->
							<h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">Your Report${pdfBuffer ? 's are' : ' is'} Ready! 🎉</h2>
							<p style="margin: 0 0 28px 0; font-size: 16px; line-height: 1.6; color: #475569;">Thank you for using MotoCheck. Your comprehensive vehicle history and import duty report${pdfBuffer ? 's are' : ' is'} attached to this email and ready to download.</p>
							
							<!-- VIN Card -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; border: 1px solid #e2e8f0;">
								<tr>
									<td style="padding: 24px;">
										<p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Vehicle Identification Number</p>
										<p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.1em;">${vin}</p>
									</td>
								</tr>
							</table>
							
							<!-- Attachments Info -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; background-color: #fffbeb; border-radius: 10px; border-left: 4px solid #f59e0b;">
								<tr>
									<td style="padding: 20px 24px;">
										<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
											<tr>
												<td width="32" valign="top">
													<span style="font-size: 24px;">📎</span>
												</td>
												<td valign="top">
													<p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #92400e;">Attached Files</p>
													<p style="margin: 0; font-size: 14px; line-height: 1.7; color: #78350f;">
														${pdfBuffer 
															? '• <strong>Word Document (DOCX)</strong> - Editable format, perfect for adding notes<br>• <strong>PDF Document</strong> - Print-ready format for archiving'
															: '• <strong>Vehicle Report</strong> - Your comprehensive vehicle history'
														}
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							
							<!-- Tips -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; background-color: #eff6ff; border-radius: 10px; border-left: 4px solid #3b82f6;">
								<tr>
									<td style="padding: 20px 24px;">
										<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
											<tr>
												<td width="32" valign="top">
													<span style="font-size: 24px;">💡</span>
												</td>
												<td valign="top">
													<p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e40af;">Quick Tip</p>
													<p style="margin: 0; font-size: 14px; line-height: 1.7; color: #1e3a8a;">
														${pdfBuffer 
															? 'Use the Word document to add notes, highlight important sections, or share with your clearing agent. The PDF is perfect for printing or long-term storage.'
															: 'Open the Word document in Microsoft Word, Google Docs, or any compatible word processor to edit and customize your report.'
														}
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							
							<!-- What's Included -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
								<tr>
									<td>
										<p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a;">What's in your report:</p>
										<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
											<tr>
												<td style="padding: 10px 0; font-size: 15px; color: #475569; line-height: 1.6;">
													<span style="color: #10b981; font-size: 18px; margin-right: 12px; font-weight: bold;">✓</span> Complete vehicle specifications
												</td>
											</tr>
											<tr>
												<td style="padding: 10px 0; font-size: 15px; color: #475569; line-height: 1.6;">
													<span style="color: #10b981; font-size: 18px; margin-right: 12px; font-weight: bold;">✓</span> Nigerian import duty breakdown
												</td>
											</tr>
											<tr>
												<td style="padding: 10px 0; font-size: 15px; color: #475569; line-height: 1.6;">
													<span style="color: #10b981; font-size: 18px; margin-right: 12px; font-weight: bold;">✓</span> NCS valuation details
												</td>
											</tr>
											<tr>
												<td style="padding: 10px 0; font-size: 15px; color: #475569; line-height: 1.6;">
													<span style="color: #10b981; font-size: 18px; margin-right: 12px; font-weight: bold;">✓</span> Safety recall information
												</td>
											</tr>
											<tr>
												<td style="padding: 10px 0; font-size: 15px; color: #475569; line-height: 1.6;">
													<span style="color: #10b981; font-size: 18px; margin-right: 12px; font-weight: bold;">✓</span> Manufacturing and compliance data
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							
							<!-- Divider -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
								<tr>
									<td style="border-top: 1px solid #e5e7eb;"></td>
								</tr>
							</table>
							
							<!-- Support -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td style="text-align: center;">
										<p style="margin: 0 0 12px 0; font-size: 15px; color: #64748b;">Need help or have questions?</p>
										<p style="margin: 0;">
											<a href="mailto:support@motocheck.ng" style="display: inline-block; padding: 12px 24px; background-color: #d4943a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Contact Support</a>
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td style="text-align: center;">
										<p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a;">MotoCheck</p>
										<p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; font-weight: 500;">Professional Vehicle Reports for Nigeria</p>
										<p style="margin: 0;">
											<a href="https://www.motocheck.ng" style="color: #d4943a; text-decoration: none; font-weight: 600; font-size: 14px;">www.motocheck.ng</a>
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
				
				<!-- Legal Footer -->
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 24px auto 0 auto;">
					<tr>
						<td style="text-align: center; padding: 0 20px;">
							<p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
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
