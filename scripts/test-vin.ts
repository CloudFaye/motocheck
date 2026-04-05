#!/usr/bin/env tsx
/**
 * Manual VIN Testing Script
 * 
 * Usage: pnpm test:vin <VIN>
 * 
 * This script:
 * 1. Accepts VIN as command line argument
 * 2. Triggers report generation via API
 * 3. Polls status endpoint until completion or failure
 * 4. Displays pipeline progress in real-time
 * 5. Outputs final report or error message
 * 
 * Requirements: 92.1-92.5
 */

import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5173';
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_WAIT_TIME_MS = 10 * 60 * 1000; // 10 minutes max

interface ReportStatus {
	vin: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	errorMessage?: string;
	stages: Array<{
		stage: string;
		status: string;
		message?: string;
		timestamp: string;
	}>;
	logs: Array<{
		stage: string;
		status: string;
		message?: string;
		timestamp: string;
	}>;
}

interface Report {
	id: number;
	vin: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	errorMessage?: string;
	year?: number;
	make?: string;
	model?: string;
	trim?: string;
	bodyStyle?: string;
	engineDescription?: string;
	driveType?: string;
	fuelType?: string;
	timeline?: any;
	llmFlags?: any;
	llmVerdict?: string;
}

// ANSI color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logError(message: string) {
	log(`❌ ${message}`, colors.red);
}

function logSuccess(message: string) {
	log(`✅ ${message}`, colors.green);
}

function logInfo(message: string) {
	log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
	log(`⚠️  ${message}`, colors.yellow);
}

function logProgress(message: string) {
	log(`⏳ ${message}`, colors.cyan);
}

async function triggerReport(vin: string): Promise<boolean> {
	try {
		logInfo(`Triggering report generation for VIN: ${vin}`);
		
		const response = await fetch(`${API_BASE_URL}/api/report`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ vin }),
		});

		if (!response.ok) {
			const error = await response.json();
			logError(`Failed to trigger report: ${error.error || response.statusText}`);
			return false;
		}

		const result = await response.json();
		logSuccess(`Report generation started: ${result.status}`);
		return true;
	} catch (error) {
		logError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}

async function getStatus(vin: string): Promise<ReportStatus | null> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/status/${encodeURIComponent(vin)}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			const error = await response.json();
			logError(`Failed to get status: ${error.error || response.statusText}`);
			return null;
		}

		return await response.json();
	} catch (error) {
		logError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}

async function getReport(vin: string): Promise<Report | null> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/report?vin=${encodeURIComponent(vin)}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			const error = await response.json();
			logError(`Failed to get report: ${error.error || response.statusText}`);
			return null;
		}

		return await response.json();
	} catch (error) {
		logError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}

function displayStatus(status: ReportStatus) {
	console.log('\n' + '='.repeat(80));
	log(`Status: ${status.status.toUpperCase()}`, getStatusColor(status.status));
	log(`Updated: ${new Date(status.updatedAt).toLocaleString()}`, colors.dim);
	
	if (status.errorMessage) {
		logError(`Error: ${status.errorMessage}`);
	}

	if (status.stages.length > 0) {
		console.log('\n' + colors.bright + 'Pipeline Stages:' + colors.reset);
		
		// Group stages by status
		const completed = status.stages.filter(s => s.status === 'completed');
		const failed = status.stages.filter(s => s.status === 'failed');
		const started = status.stages.filter(s => s.status === 'started');
		
		if (completed.length > 0) {
			log(`  ✅ Completed: ${completed.length}`, colors.green);
			completed.forEach(s => {
				log(`     • ${s.stage}`, colors.dim);
			});
		}
		
		if (started.length > 0) {
			log(`  ⏳ In Progress: ${started.length}`, colors.cyan);
			started.forEach(s => {
				log(`     • ${s.stage}`, colors.dim);
			});
		}
		
		if (failed.length > 0) {
			log(`  ❌ Failed: ${failed.length}`, colors.red);
			failed.forEach(s => {
				log(`     • ${s.stage}${s.message ? ': ' + s.message : ''}`, colors.dim);
			});
		}
	}

	if (status.logs.length > 0) {
		console.log('\n' + colors.bright + 'Recent Activity:' + colors.reset);
		status.logs.slice(0, 5).forEach(log => {
			const timestamp = new Date(log.timestamp).toLocaleTimeString();
			const statusIcon = log.status === 'completed' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
			console.log(`  ${statusIcon} [${timestamp}] ${log.stage}: ${log.status}${log.message ? ' - ' + log.message : ''}`);
		});
	}
	
	console.log('='.repeat(80));
}

function getStatusColor(status: string): string {
	switch (status) {
		case 'ready':
			return colors.green;
		case 'failed':
			return colors.red;
		case 'pending':
		case 'fetching':
		case 'normalizing':
		case 'stitching':
		case 'analyzing':
			return colors.yellow;
		default:
			return colors.reset;
	}
}

function displayReport(report: Report) {
	console.log('\n' + '='.repeat(80));
	log('FINAL REPORT', colors.bright + colors.green);
	console.log('='.repeat(80));
	
	// Vehicle Identity
	if (report.year && report.make && report.model) {
		console.log('\n' + colors.bright + 'Vehicle Identity:' + colors.reset);
		log(`  ${report.year} ${report.make} ${report.model}${report.trim ? ' ' + report.trim : ''}`, colors.cyan);
		if (report.bodyStyle) log(`  Body Style: ${report.bodyStyle}`, colors.dim);
		if (report.engineDescription) log(`  Engine: ${report.engineDescription}`, colors.dim);
		if (report.driveType) log(`  Drive Type: ${report.driveType}`, colors.dim);
		if (report.fuelType) log(`  Fuel Type: ${report.fuelType}`, colors.dim);
	}
	
	// LLM Verdict
	if (report.llmVerdict) {
		console.log('\n' + colors.bright + 'AI Assessment:' + colors.reset);
		log(`  ${report.llmVerdict}`, colors.cyan);
	}
	
	// LLM Flags
	if (report.llmFlags) {
		console.log('\n' + colors.bright + 'Flags & Analysis:' + colors.reset);
		if (report.llmFlags.riskScore) {
			const riskColor = report.llmFlags.riskScore > 7 ? colors.red : 
			                  report.llmFlags.riskScore > 4 ? colors.yellow : colors.green;
			log(`  Risk Score: ${report.llmFlags.riskScore}/10`, riskColor);
		}
		if (report.llmFlags.flags && Array.isArray(report.llmFlags.flags)) {
			report.llmFlags.flags.forEach((flag: any) => {
				const flagColor = flag.severity === 'high' ? colors.red : 
				                  flag.severity === 'medium' ? colors.yellow : colors.green;
				log(`  • [${flag.severity?.toUpperCase()}] ${flag.description || flag}`, flagColor);
			});
		}
	}
	
	// Timeline Summary
	if (report.timeline) {
		console.log('\n' + colors.bright + 'Timeline Summary:' + colors.reset);
		
		if (report.timeline.events && Array.isArray(report.timeline.events)) {
			log(`  Total Events: ${report.timeline.events.length}`, colors.dim);
		}
		
		if (report.timeline.odometerReadings && Array.isArray(report.timeline.odometerReadings)) {
			log(`  Odometer Readings: ${report.timeline.odometerReadings.length}`, colors.dim);
			const anomalies = report.timeline.odometerReadings.filter((r: any) => r.isAnomaly);
			if (anomalies.length > 0) {
				logWarning(`  Odometer Anomalies: ${anomalies.length}`);
			}
		}
		
		if (report.timeline.gaps && Array.isArray(report.timeline.gaps)) {
			if (report.timeline.gaps.length > 0) {
				logWarning(`  History Gaps: ${report.timeline.gaps.length}`);
			}
		}
		
		if (report.timeline.titleBrands && Array.isArray(report.timeline.titleBrands)) {
			if (report.timeline.titleBrands.length > 0) {
				logWarning(`  Title Brands: ${report.timeline.titleBrands.length}`);
			}
		}
		
		if (report.timeline.recalls && Array.isArray(report.timeline.recalls)) {
			if (report.timeline.recalls.length > 0) {
				logWarning(`  Recalls: ${report.timeline.recalls.length}`);
			}
		}
		
		if (report.timeline.sourcesCovered && Array.isArray(report.timeline.sourcesCovered)) {
			log(`  Data Sources: ${report.timeline.sourcesCovered.join(', ')}`, colors.dim);
		}
	}
	
	console.log('\n' + '='.repeat(80));
	logSuccess(`Report completed at: ${report.completedAt ? new Date(report.completedAt).toLocaleString() : 'N/A'}`);
	console.log('='.repeat(80) + '\n');
}

async function pollUntilComplete(vin: string): Promise<boolean> {
	const startTime = Date.now();
	let lastStatus = '';
	
	while (true) {
		const elapsed = Date.now() - startTime;
		
		// Check timeout
		if (elapsed > MAX_WAIT_TIME_MS) {
			logError('Timeout: Report generation took longer than 10 minutes');
			return false;
		}
		
		// Get current status
		const status = await getStatus(vin);
		
		if (!status) {
			logError('Failed to retrieve status');
			return false;
		}
		
		// Display status if changed
		if (status.status !== lastStatus) {
			displayStatus(status);
			lastStatus = status.status;
		} else {
			// Just show a progress indicator
			process.stdout.write('.');
		}
		
		// Check if complete
		if (status.status === 'ready') {
			console.log('\n');
			logSuccess('Report generation completed!');
			return true;
		}
		
		// Check if failed
		if (status.status === 'failed') {
			console.log('\n');
			logError('Report generation failed');
			if (status.errorMessage) {
				logError(`Error: ${status.errorMessage}`);
			}
			return false;
		}
		
		// Wait before next poll
		await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
	}
}

async function main() {
	// Get VIN from command line arguments
	const vin = process.argv[2];
	
	if (!vin) {
		logError('Usage: pnpm test:vin <VIN>');
		logInfo('Example: pnpm test:vin 1HGBH41JXMN109186');
		process.exit(1);
	}
	
	log('\n' + '='.repeat(80), colors.bright);
	log('Vehicle History Report Testing Script', colors.bright + colors.cyan);
	log('='.repeat(80) + '\n', colors.bright);
	
	logInfo(`API Base URL: ${API_BASE_URL}`);
	logInfo(`VIN: ${vin}\n`);
	
	// Step 1: Trigger report generation
	const triggered = await triggerReport(vin);
	if (!triggered) {
		logError('Failed to trigger report generation');
		process.exit(1);
	}
	
	console.log('');
	logProgress('Polling for status updates...\n');
	
	// Step 2: Poll until complete or failed
	const success = await pollUntilComplete(vin);
	
	if (!success) {
		process.exit(1);
	}
	
	// Step 3: Retrieve and display final report
	const report = await getReport(vin);
	
	if (!report) {
		logError('Failed to retrieve final report');
		process.exit(1);
	}
	
	displayReport(report);
	
	logSuccess('Test completed successfully!');
	process.exit(0);
}

// Run the script
main().catch(error => {
	logError(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
	console.error(error);
	process.exit(1);
});
