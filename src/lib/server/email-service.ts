import { Resend } from 'resend';
import { config } from './config';

const resend = new Resend(config.RESEND_API_KEY);

/**
 * Send completed report to user
 */
export async function sendReport(
	to: string,
	reportId: string,
	vin: string,
	docxBuffer: Buffer,
	pdfBuffer?: Buffer
): Promise<void> {
	const subject = pdfBuffer ? `Your Vehicle Reports - ${vin}` : `Your Vehicle Report - ${vin}`;

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
${
	pdfBuffer
		? '• Word Document (DOCX) - Editable format, perfect for adding notes\n• PDF Document - Print-ready format for archiving'
		: '• Vehicle Report - Your comprehensive vehicle history'
}

WHAT'S IN YOUR REPORT
✓ Complete vehicle specifications
✓ Nigerian import duty breakdown
✓ NCS valuation details
✓ Safety recall information
✓ Manufacturing and compliance data

${
	pdfBuffer
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
														${
															pdfBuffer
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
														${
															pdfBuffer
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

/**
 * Send report processing status update to user
 */
export async function sendProgressUpdate(
	to: string,
	vin: string,
	completedSources: number,
	totalSources: number,
	estimatedMinutes: number
): Promise<void> {
	const progress = Math.round((completedSources / totalSources) * 100);

	await resend.emails.send({
		from: config.FROM_EMAIL,
		to,
		subject: `Report Processing: ${progress}% Complete - ${vin}`,
		text: `
MotoCheck - Report Processing Update

Your vehicle report for ${vin} is being generated.

Progress: ${completedSources}/${totalSources} data sources complete (${progress}%)
Estimated time remaining: ${estimatedMinutes} minutes

We're gathering data from multiple sources to provide you with the most comprehensive report possible. You'll receive an email with your report as soon as it's ready.

Questions? Contact us at support@motocheck.ng

---
MotoCheck
www.motocheck.ng
`,
		html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
					<tr>
						<td style="padding: 40px 40px 32px 40px; border-bottom: 1px solid #e5e7eb;">
							<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">MotoCheck</h1>
							<p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b; font-weight: 500;">Report Processing Update</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 40px;">
							<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Your Report is Being Generated</h2>
							<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #475569;">We're gathering data from multiple sources for VIN <strong>${vin}</strong>.</p>
							
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background-color: #f8fafc; border-radius: 10px; padding: 24px;">
								<tr>
									<td>
										<p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Progress</p>
										<div style="background-color: #e2e8f0; border-radius: 9999px; height: 12px; margin-bottom: 12px; overflow: hidden;">
											<div style="background: linear-gradient(90deg, #d4943a 0%, #f59e0b 100%); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
										</div>
										<p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">${progress}% Complete</p>
										<p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">${completedSources} of ${totalSources} data sources processed</p>
									</td>
								</tr>
							</table>
							
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background-color: #eff6ff; border-radius: 10px; border-left: 4px solid #3b82f6;">
								<tr>
									<td style="padding: 20px 24px;">
										<p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #1e40af;">⏱️ Estimated Time Remaining</p>
										<p style="margin: 0; font-size: 14px; color: #1e3a8a;">${estimatedMinutes} minutes</p>
									</td>
								</tr>
							</table>
							
							<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b;">You'll receive an email with your complete report as soon as it's ready. No need to wait around!</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
							<p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a;">MotoCheck</p>
							<p style="margin: 0; font-size: 13px; color: #64748b;">Professional Vehicle Reports for Nigeria</p>
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

/**
 * Send admin notification about worker status and errors
 */
export async function sendAdminNotification(
	subject: string,
	message: string,
	details?: Record<string, unknown>
): Promise<void> {
	const adminEmail = process.env.ADMIN_EMAIL;
	if (!adminEmail) {
		console.warn('[email-service] ADMIN_EMAIL not configured, skipping admin notification');
		return;
	}

	const detailsHtml = details
		? `
			<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #f8fafc; border-radius: 8px; padding: 16px; font-family: 'Courier New', monospace; font-size: 13px;">
				<tr>
					<td>
						<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #475569;">${JSON.stringify(details, null, 2)}</pre>
					</td>
				</tr>
			</table>
		`
		: '';

	await resend.emails.send({
		from: config.FROM_EMAIL,
		to: adminEmail,
		subject: `[MotoCheck Admin] ${subject}`,
		text: `
MotoCheck Admin Notification

${subject}

${message}

${details ? `Details:\n${JSON.stringify(details, null, 2)}` : ''}

---
Sent from MotoCheck Worker System
`,
		html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
					<tr>
						<td style="padding: 40px 40px 32px 40px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
							<h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">🔧 MotoCheck Admin</h1>
							<p style="margin: 6px 0 0 0; font-size: 14px; color: #cbd5e1; font-weight: 500;">Worker System Notification</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 40px;">
							<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${subject}</h2>
							<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">${message}</p>
							${detailsHtml}
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">Sent from MotoCheck Worker System • ${new Date().toISOString()}</p>
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

/**
 * Send batch admin digest of worker activity
 */
export async function sendAdminDigest(
	period: string,
	stats: {
		totalJobs: number;
		completedJobs: number;
		failedJobs: number;
		activeJobs: number;
		avgProcessingTime: number;
		errors: Array<{ job: string; error: string; count: number }>;
	}
): Promise<void> {
	const adminEmail = process.env.ADMIN_EMAIL;
	if (!adminEmail) return;

	const successRate =
		stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0;

	const errorsHtml =
		stats.errors.length > 0
			? `
			<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
				<tr>
					<td>
						<p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a;">Recent Errors</p>
						${stats.errors
							.map(
								(err) => `
							<div style="margin-bottom: 12px; padding: 12px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
								<p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #991b1b;">${err.job}</p>
								<p style="margin: 0 0 4px 0; font-size: 13px; color: #7f1d1d;">${err.error}</p>
								<p style="margin: 0; font-size: 12px; color: #991b1b;">Occurrences: ${err.count}</p>
							</div>
						`
							)
							.join('')}
					</td>
				</tr>
			</table>
		`
			: '';

	await resend.emails.send({
		from: config.FROM_EMAIL,
		to: adminEmail,
		subject: `[MotoCheck] Worker Digest - ${period}`,
		html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
					<tr>
						<td style="padding: 40px 40px 32px 40px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
							<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">📊 Worker Digest</h1>
							<p style="margin: 6px 0 0 0; font-size: 14px; color: #cbd5e1; font-weight: 500;">${period}</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 40px;">
							<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
								<div style="padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
									<p style="margin: 0 0 4px 0; font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Completed</p>
									<p style="margin: 0; font-size: 28px; font-weight: 700; color: #047857;">${stats.completedJobs}</p>
								</div>
								<div style="padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
									<p style="margin: 0 0 4px 0; font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Failed</p>
									<p style="margin: 0; font-size: 28px; font-weight: 700; color: #dc2626;">${stats.failedJobs}</p>
								</div>
							</div>
							
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
								<tr>
									<td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
										<p style="margin: 0; font-size: 14px; color: #64748b;">Total Jobs</p>
										<p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${stats.totalJobs}</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
										<p style="margin: 0; font-size: 14px; color: #64748b;">Active Jobs</p>
										<p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${stats.activeJobs}</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
										<p style="margin: 0; font-size: 14px; color: #64748b;">Success Rate</p>
										<p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${successRate}%</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 16px 0;">
										<p style="margin: 0; font-size: 14px; color: #64748b;">Avg Processing Time</p>
										<p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${stats.avgProcessingTime}s</p>
									</td>
								</tr>
							</table>
							
							${errorsHtml}
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">MotoCheck Worker System • ${new Date().toISOString()}</p>
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
