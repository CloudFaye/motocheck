/**
 * LLM Section Writing Worker
 * 
 * Writes 9 report sections using LLM:
 * 1. Summary - 3-sentence buyer overview
 * 2. Ownership History - owner count and patterns
 * 3. Accident Analysis - damage severity and implications
 * 4. Odometer Analysis - actual vs expected mileage
 * 5. Title History - title brands explained
 * 6. Recall Status - open and closed recalls
 * 7. Market Value - asking price fairness
 * 8. Gap Analysis - unexplained periods
 * 9. Buyers Checklist - 8 specific inspection items
 * 
 * Supports multiple LLM providers (Gemini, Anthropic) via unified service.
 * 
 * Requirements: 16.1-16.13, 67.1-67.5, 68.1-68.5, 69.1-69.5, 70.1-70.5, 71.1-71.5, 72.1-72.5, 73.1-73.5, 76.1-76.5, 79.1-79.5, 94.1-94.5
 */

import { generateText, getLLMInfo } from '../src/lib/server/llm/index.js';
import { db } from '../src/lib/server/db/index.js';
import { pipelineReports, reportSections, pipelineLog } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { Jobs } from '../src/lib/server/queue/job-names.js';
import type { Timeline } from '../src/lib/shared/types.js';

interface SectionPrompt {
	key: string;
	prompt: (timeline: Timeline, llmFlags: Record<string, unknown>) => string;
}

/**
 * Define section prompts (Requirement 16.1)
 */
const SECTION_PROMPTS: SectionPrompt[] = [
	{
		key: 'summary',
		prompt: (timeline, llmFlags) => `You are writing the SUMMARY section of a vehicle history report.

VEHICLE DATA:
${JSON.stringify({ identity: timeline.identity, riskScore: llmFlags?.riskScore, verdict: llmFlags?.verdict }, null, 2)}

TIMELINE HIGHLIGHTS:
- Total events: ${timeline.events.length}
- Title brands: ${timeline.titleBrands.length > 0 ? timeline.titleBrands.map(b => b.brand).join(', ') : 'None'}
- Damage records: ${timeline.damageRecords.length}
- Recalls: ${timeline.recalls.length}
- History gaps: ${timeline.gaps.length}

Write a 3-sentence summary that:
1. Leads with the SINGLE MOST IMPORTANT finding (Requirement 76.1)
2. Uses specific dates and numbers (Requirement 76.3)
3. Avoids jargon (Requirement 76.4)
4. Provides a clear buy/caution/avoid verdict (Requirement 76.5)

Return ONLY the summary text, no additional formatting.`,
	},
	{
		key: 'ownership_history',
		prompt: (timeline) => `You are writing the OWNERSHIP HISTORY section of a vehicle history report.

TITLE HISTORY:
${JSON.stringify(timeline.titleHistory, null, 2)}

VEHICLE AGE: ${new Date().getFullYear() - timeline.identity.year} years

Write 2-3 paragraphs explaining:
1. Whether the number of owners is normal for the vehicle age (Requirement 73.1)
2. Any unusually short ownership periods (Requirement 73.2)
3. Geographic patterns in ownership (Requirement 73.3)
4. Any ownership changes shortly after accidents (Requirement 73.4)
5. What normal ownership duration looks like (Requirement 73.5)

Use plain English and specific dates. Return ONLY the section text.`,
	},
	{
		key: 'accident_analysis',
		prompt: (timeline) => `You are writing the ACCIDENT ANALYSIS section of a vehicle history report.

DAMAGE RECORDS:
${JSON.stringify(timeline.damageRecords, null, 2)}

Write 2-3 paragraphs explaining:
1. Classify each accident as minor, moderate, or severe (Requirement 68.1)
2. Explain the difference between cosmetic and structural damage (Requirement 68.2)
3. Consider airbag deployment as an indicator of severity (Requirement 68.3)
4. Estimate repair costs when data is available (Requirement 68.4)
5. Explain how accident history affects resale value (Requirement 68.5)

If no accidents, state that clearly. Use plain English and specific dates. Return ONLY the section text.`,
	},
	{
		key: 'odometer_analysis',
		prompt: (timeline, llmFlags) => `You are writing the ODOMETER ANALYSIS section of a vehicle history report.

ODOMETER READINGS:
${JSON.stringify(timeline.odometerReadings, null, 2)}

VEHICLE AGE: ${new Date().getFullYear() - timeline.identity.year} years
EXPECTED MILEAGE: ${(new Date().getFullYear() - timeline.identity.year) * 12000} miles (at 12,000 miles/year)

ODOMETER ASSESSMENT FROM ANALYSIS:
${llmFlags?.odometerAssessment || 'Not available'}

Write 2-3 paragraphs explaining:
1. Whether mileage is high, low, or normal (Requirement 74.3)
2. Implications of high mileage (wear and tear) (Requirement 74.4)
3. Implications of low mileage (potential storage issues) (Requirement 74.5)
4. Any rollbacks or anomalies detected
5. Comparison of actual vs expected mileage

Use plain English and specific numbers. Return ONLY the section text.`,
	},
	{
		key: 'title_history',
		prompt: (timeline, llmFlags) => `You are writing the TITLE HISTORY section of a vehicle history report.

TITLE BRANDS:
${JSON.stringify(timeline.titleBrands, null, 2)}

TITLE ASSESSMENT FROM ANALYSIS:
${llmFlags?.titleAssessment || 'Not available'}

Write 2-3 paragraphs explaining:
1. What salvage title means for safety (Requirement 72.1)
2. What salvage title means for insurance (Requirement 72.2)
3. What salvage title means for resale value (Requirement 72.3)
4. Distinguish between salvage and rebuilt titles (Requirement 72.4)
5. Explain flood and lemon law titles when present (Requirement 72.5)

If no title brands, state that the vehicle has a clean title. Use plain English. Return ONLY the section text.`,
	},
	{
		key: 'recall_status',
		prompt: (timeline) => `You are writing the RECALL STATUS section of a vehicle history report.

RECALLS:
${JSON.stringify(timeline.recalls, null, 2)}

Write 2-3 paragraphs explaining:
1. Distinguish between open and closed recalls (Requirement 71.1)
2. Explain what each recall component means in plain English (Requirement 71.2)
3. Explain the consequence of not addressing open recalls (Requirement 71.3)
4. Provide remedy information for open recalls (Requirement 71.4)
5. Confirm when no recalls exist (Requirement 71.5)

Use plain English and avoid technical jargon. Return ONLY the section text.`,
	},
	{
		key: 'market_value',
		prompt: (timeline) => `You are writing the MARKET VALUE section of a vehicle history report.

MARKET VALUE DATA:
${JSON.stringify(timeline.marketValue, null, 2)}

VEHICLE CONDITION FACTORS:
- Damage records: ${timeline.damageRecords.length}
- Title brands: ${timeline.titleBrands.length > 0 ? timeline.titleBrands.map(b => b.brand).join(', ') : 'None'}
- Current mileage: ${timeline.odometerReadings[timeline.odometerReadings.length - 1]?.mileage || 'Unknown'}

Write 2-3 paragraphs explaining:
1. Compare asking price to market average when available (Requirement 70.1)
2. Explain how accident history affects value (Requirement 70.2)
3. Explain how title brands affect value (Requirement 70.3)
4. Explain how mileage affects value (Requirement 70.4)
5. Provide a clear buy/caution/avoid recommendation (Requirement 70.5)

Use plain English and specific numbers. Return ONLY the section text.`,
	},
	{
		key: 'gap_analysis',
		prompt: (timeline, llmFlags) => `You are writing the GAP ANALYSIS section of a vehicle history report.

HISTORY GAPS:
${JSON.stringify(timeline.gaps, null, 2)}

GAP ANALYSIS FROM LLM:
${JSON.stringify(llmFlags?.gapAnalysis || [], null, 2)}

VEHICLE AGE: ${new Date().getFullYear() - timeline.identity.year} years

Write 2-3 paragraphs explaining:
1. Provide vehicle age context when analyzing gaps (Requirement 67.1)
2. Consider gap duration when assessing concern level (Requirement 67.2)
3. Suggest specific questions to ask the seller (Requirement 67.3)
4. Distinguish between normal gaps (storage, private ownership) and concerning gaps (Requirement 67.4)
5. Rate buyer concern level from 1 to 10 for each gap (Requirement 67.5)

If no gaps, state that the vehicle has continuous history. Use plain English. Return ONLY the section text.`,
	},
	{
		key: 'buyers_checklist',
		prompt: (timeline) => `You are writing the BUYERS CHECKLIST section of a vehicle history report.

VEHICLE HISTORY SUMMARY:
- Damage records: ${JSON.stringify(timeline.damageRecords, null, 2)}
- Title brands: ${JSON.stringify(timeline.titleBrands, null, 2)}
- Recalls: ${JSON.stringify(timeline.recalls, null, 2)}
- Odometer anomalies: ${timeline.odometerReadings.filter(r => r.isAnomaly).length}

Generate a maximum of 8 specific inspection items (Requirement 69.1) that:
1. Are based on the vehicle's specific history (Requirement 69.2)
2. Avoid generic items like "check the engine" (Requirement 69.3)
3. Reference specific damage areas from accident records (Requirement 69.4)
4. Reference specific recall components if applicable (Requirement 69.5)

Format as a numbered list. Be specific and actionable. Return ONLY the checklist.`,
	},
];

/**
 * Call LLM API to generate ALL sections at once (single request)
 */
async function generateAllSections(
	timeline: Timeline,
	llmFlags: Record<string, unknown>,
	timeoutMs: number = 120000
): Promise<Record<string, string>> {
	const combinedPrompt = `You are writing a complete vehicle history report. Generate ALL 9 sections in a single JSON response.

VEHICLE DATA:
${JSON.stringify({ 
	identity: timeline.identity, 
	riskScore: llmFlags?.riskScore, 
	verdict: llmFlags?.verdict,
	titleBrands: timeline.titleBrands,
	damageRecords: timeline.damageRecords,
	recalls: timeline.recalls,
	gaps: timeline.gaps,
	odometerReadings: timeline.odometerReadings,
	titleHistory: timeline.titleHistory,
	marketValue: timeline.marketValue,
	odometerAssessment: llmFlags?.odometerAssessment,
	titleAssessment: llmFlags?.titleAssessment,
	gapAnalysis: llmFlags?.gapAnalysis
}, null, 2)}

Generate a JSON object with these 9 sections (keep each section concise, 2-3 paragraphs max):

{
  "summary": "3-sentence overview with verdict",
  "ownership_history": "Ownership patterns analysis",
  "accident_analysis": "Damage severity and implications",
  "odometer_analysis": "Mileage assessment",
  "title_history": "Title brands explained",
  "recall_status": "Open/closed recalls",
  "market_value": "Price fairness assessment",
  "gap_analysis": "History gaps explained",
  "buyers_checklist": "8 specific inspection items as numbered list"
}

Return ONLY valid JSON, no markdown formatting.`;

	const response = await generateText(
		[{ role: 'user', content: combinedPrompt }],
		{
			maxTokens: 4000, // Increased for all sections
			temperature: 0.7,
			timeout: timeoutMs,
		}
	);

	// Parse JSON response
	let cleanedText = response.content.trim();
	cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '');
	cleanedText = cleanedText.replace(/\n?```\s*$/, '');
	
	const sections = JSON.parse(cleanedText.trim());
	
	return {
		content: sections,
		model: response.model,
		provider: response.provider,
	};
}

/**
 * Log pipeline progress
 */
async function logProgress(vin: string, status: 'started' | 'completed' | 'failed', message?: string) {
	await db.insert(pipelineLog).values({
		vin,
		stage: 'llm-write-sections',
		status,
		message,
	});
}

/**
 * LLM Section Writing Worker Handler
 */
export async function writeSectionsHandler(jobs: Array<{ data: { vin: string } }>): Promise<void> {
	for (const job of jobs) {
		await writeSections(job);
	}
}

/**
 * Process a single section writing job
 */
async function writeSections(job: { data: { vin: string } }): Promise<void> {
	const { vin } = job.data;

	console.log(`[llm-write-sections] Starting section writing for VIN: ${vin}`);
	await logProgress(vin, 'started');

	try {
		// Load report with timeline and LLM flags
		const [report] = await db
			.select()
			.from(pipelineReports)
			.where(eq(pipelineReports.vin, vin))
			.limit(1);

		if (!report) {
			throw new Error(`Report not found for VIN: ${vin}`);
		}

		if (!report.timeline) {
			throw new Error(`Timeline not found for VIN: ${vin}`);
		}

		const timeline = report.timeline as Timeline;
		const llmFlags = (report.llmFlags as Record<string, unknown>) || {};

		// Generate ALL sections in a single LLM call (reduces from 9 calls to 1)
		console.log(`[llm-write-sections] Generating all sections in single request`);
		
		const llmInfo = getLLMInfo();
		const response = await generateAllSections(timeline, llmFlags);
		
		const sections = response.content as Record<string, string>;
		const sectionsGenerated: string[] = [];
		const sectionsFailed: string[] = [];

		// Store each section in database
		for (const sectionDef of SECTION_PROMPTS) {
			try {
				const content = sections[sectionDef.key];
				
				if (!content || typeof content !== 'string') {
					throw new Error(`Missing or invalid content for section: ${sectionDef.key}`);
				}

				await db.insert(reportSections).values({
					vin,
					sectionKey: sectionDef.key,
					content: content,
					modelUsed: response.model,
				}).onConflictDoUpdate({
					target: [reportSections.vin, reportSections.sectionKey],
					set: {
						content: content,
						modelUsed: response.model,
						generatedAt: new Date(),
					},
				});

				sectionsGenerated.push(sectionDef.key);
				console.log(`[llm-write-sections] Section stored: ${sectionDef.key}`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error(`[llm-write-sections] Failed to store section ${sectionDef.key}:`, errorMessage);
				sectionsFailed.push(sectionDef.key);
			}
		}

		// Check if all sections were generated
		if (sectionsGenerated.length === SECTION_PROMPTS.length) {
			// Update report status to ready (Requirement 16.13)
			await db
				.update(pipelineReports)
				.set({
					status: 'ready',
					completedAt: new Date(), // Requirement 16.8, 79.1
					updatedAt: new Date(),
				})
				.where(eq(pipelineReports.vin, vin));

			console.log(`[llm-write-sections] All sections completed for VIN: ${vin}`);
			await logProgress(vin, 'completed', `Generated ${sectionsGenerated.length} sections`);
		} else {
			// Some sections failed, but report is still usable
			await db
				.update(pipelineReports)
				.set({
					status: 'ready',
					completedAt: new Date(),
					updatedAt: new Date(),
					errorMessage: `Partial completion: ${sectionsFailed.length} sections failed (${sectionsFailed.join(', ')})`,
				})
				.where(eq(pipelineReports.vin, vin));

			console.log(`[llm-write-sections] Partial completion for VIN: ${vin}. Failed sections: ${sectionsFailed.join(', ')}`);
			await logProgress(vin, 'completed', `Generated ${sectionsGenerated.length}/${SECTION_PROMPTS.length} sections. Failed: ${sectionsFailed.join(', ')}`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`[llm-write-sections] Failed for VIN ${vin}:`, errorMessage);
		await logProgress(vin, 'failed', errorMessage);

		// Update report status to failed
		await db
			.update(pipelineReports)
			.set({
				status: 'failed',
				errorMessage: `Section writing failed: ${errorMessage}`,
				updatedAt: new Date(),
			})
			.where(eq(pipelineReports.vin, vin));

		throw error;
	}
}

/**
 * Register the LLM write sections worker with pg-boss
 */
export async function registerLLMWriteSectionsWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.LLM_WRITE_SECTIONS, writeSectionsHandler);
	console.log('[llm-write-sections] Worker registered');
}
