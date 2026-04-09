/**
 * LLM Analysis Worker
 *
 * Analyzes the complete stitched timeline using LLM to generate:
 * - Risk score (1-10)
 * - Verdict (buy/caution/avoid) with reasoning
 * - Top flags with severity levels
 * - Gap analysis with explanations
 * - Odometer assessment
 * - Title assessment
 *
 * Supports multiple LLM providers (Gemini, Anthropic) via unified service.
 *
 * Requirements: 15.1-15.10, 45.1-45.6, 46.1-46.5, 82.1-82.5
 */

import { generateText, getLLMInfo } from '../src/lib/server/llm/index.js';
import { db } from '../src/lib/server/db/index.js';
import { pipelineReports, pipelineLog } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getQueue } from '../src/lib/server/queue/index.js';
import { Jobs } from '../src/lib/server/queue/job-names.js';
import type { Timeline } from '../src/lib/shared/types.js';

interface LLMAnalysisResult {
	riskScore: number;
	verdict: 'buy' | 'caution' | 'avoid';
	verdictReasoning: string;
	topFlags: Array<{
		flag: string;
		severity: 'high' | 'medium' | 'low';
		explanation: string;
	}>;
	gapAnalysis: Array<{
		startDate: string;
		endDate: string;
		durationMonths: number;
		likelyExplanation: string;
		buyerConcernLevel: number;
	}>;
	odometerAssessment: string;
	titleAssessment: string;
}

function clampRiskScore(score: number): number {
	return Math.max(1, Math.min(10, Math.round(score)));
}

function buildFallbackAnalysis(timeline: Timeline): LLMAnalysisResult {
	const vehicleAge = Math.max(0, new Date().getFullYear() - timeline.identity.year);
	const titleBrands = timeline.titleBrands.map((brand) => brand.brand);
	const hasSevereTitleBrand = titleBrands.some((brand) => ['salvage', 'flood'].includes(brand));
	const hasRebuiltTitle = titleBrands.includes('rebuilt');
	const hasOdometerAnomaly = timeline.odometerReadings.some((reading) => reading.isAnomaly);
	const longGap = timeline.gaps.some((gap) => gap.durationMonths >= 36);
	const lastMileage = timeline.odometerReadings[timeline.odometerReadings.length - 1]?.mileage;
	const expectedMileage = vehicleAge > 0 ? vehicleAge * 12000 : undefined;

	let riskScore = 2;
	riskScore += Math.min(3, timeline.damageRecords.length);
	riskScore += Math.min(2, timeline.gaps.length);
	riskScore += timeline.recalls.length > 0 ? 1 : 0;
	riskScore += hasOdometerAnomaly ? 3 : 0;
	riskScore += hasSevereTitleBrand ? 4 : hasRebuiltTitle ? 2 : 0;
	riskScore += longGap ? 1 : 0;
	riskScore = clampRiskScore(riskScore);

	let verdict: LLMAnalysisResult['verdict'] = 'buy';
	if (riskScore >= 8 || hasSevereTitleBrand || hasOdometerAnomaly) {
		verdict = 'avoid';
	} else if (riskScore >= 5 || timeline.damageRecords.length > 0 || timeline.gaps.length > 0) {
		verdict = 'caution';
	}

	const topFlags: LLMAnalysisResult['topFlags'] = [];

	if (titleBrands.length > 0) {
		topFlags.push({
			flag: `Title brands reported: ${titleBrands.join(', ')}`,
			severity: hasSevereTitleBrand ? 'high' : 'medium',
			explanation:
				'Title branding can affect safety inspections, financing, insurance, and resale value.'
		});
	}

	if (hasOdometerAnomaly) {
		topFlags.push({
			flag: 'Mileage anomaly detected',
			severity: 'high',
			explanation: 'The mileage history contains a rollback or an implausible annual usage rate.'
		});
	}

	if (timeline.damageRecords.length > 0) {
		topFlags.push({
			flag: `${timeline.damageRecords.length} damage record${timeline.damageRecords.length === 1 ? '' : 's'} found`,
			severity: timeline.damageRecords.length >= 2 ? 'high' : 'medium',
			explanation:
				'Auction and damage records suggest the vehicle has prior condition or repair history to verify.'
		});
	}

	if (timeline.gaps.length > 0) {
		topFlags.push({
			flag: `${timeline.gaps.length} history gap${timeline.gaps.length === 1 ? '' : 's'} detected`,
			severity: longGap ? 'high' : 'medium',
			explanation:
				'Long gaps do not prove a problem, but they reduce confidence in the continuity of the vehicle history.'
		});
	}

	if (timeline.recalls.length > 0) {
		topFlags.push({
			flag: `${timeline.recalls.length} recall${timeline.recalls.length === 1 ? '' : 's'} reported`,
			severity: 'medium',
			explanation: 'Open recalls should be checked with a dealer before purchase or import.'
		});
	}

	const gapAnalysis: LLMAnalysisResult['gapAnalysis'] = timeline.gaps.map((gap) => ({
		startDate: gap.startDate,
		endDate: gap.endDate,
		durationMonths: gap.durationMonths,
		likelyExplanation:
			gap.durationMonths >= 36
				? 'This is a long enough gap to justify asking for maintenance, registration, or storage records.'
				: 'This may reflect private ownership, storage, or a period where no public record source captured activity.',
		buyerConcernLevel: gap.durationMonths >= 36 ? 8 : gap.durationMonths >= 24 ? 6 : 4
	}));

	const odometerAssessment = hasOdometerAnomaly
		? 'The mileage history contains at least one anomaly, so the odometer should not be trusted without supporting service or title records.'
		: lastMileage && expectedMileage
			? `The latest recorded mileage is ${lastMileage.toLocaleString()} miles against an expected baseline of about ${expectedMileage.toLocaleString()} miles for a ${vehicleAge}-year-old vehicle. The pattern looks directionally plausible, but the confidence still depends on how many sources contributed readings.`
			: 'There are too few mileage records to make a strong odometer judgement, so an in-person inspection and supporting maintenance records are important.';

	const titleAssessment =
		titleBrands.length === 0
			? 'No title brands were found in the stitched data, which is a positive signal, but it is only as strong as the source coverage available for this VIN.'
			: `The title history shows ${titleBrands.join(', ')} branding. That should be treated as a meaningful value and condition risk until the branding history is independently verified.`;

	return {
		riskScore,
		verdict,
		verdictReasoning:
			verdict === 'avoid'
				? 'The available history shows one or more high-risk signals that materially affect trust in the vehicle condition or value.'
				: verdict === 'caution'
					? 'The report contains moderate risk signals, so this vehicle should only move forward with targeted verification and price discipline.'
					: 'The stitched history does not show major red flags from the sources that responded, although limited source coverage still matters.',
		topFlags: topFlags.slice(0, 5),
		gapAnalysis,
		odometerAssessment,
		titleAssessment
	};
}

/**
 * Construct analysis prompt for LLM
 */
function buildAnalysisPrompt(timeline: Timeline): string {
	return `You are an expert vehicle history analyst. Analyze the following vehicle history timeline and provide a comprehensive risk assessment.

VEHICLE TIMELINE DATA:
${JSON.stringify(timeline, null, 2)}

Provide your analysis in the following JSON format:
{
  "riskScore": <integer 1-10, where 1 is lowest risk and 10 is highest risk>,
  "verdict": "<buy|caution|avoid>",
  "verdictReasoning": "<2-3 sentences explaining the verdict>",
  "topFlags": [
    {
      "flag": "<brief description of the issue>",
      "severity": "<high|medium|low>",
      "explanation": "<1-2 sentences explaining why this matters>"
    }
  ],
  "gapAnalysis": [
    {
      "startDate": "<ISO date>",
      "endDate": "<ISO date>",
      "durationMonths": <number>,
      "likelyExplanation": "<1-2 sentences explaining what likely happened>",
      "buyerConcernLevel": <integer 1-10, where 1 is no concern and 10 is major concern>
    }
  ],
  "odometerAssessment": "<2-3 sentences in plain English about mileage patterns, rollbacks, and whether mileage is normal for vehicle age>",
  "titleAssessment": "<2-3 sentences in plain English about title status, brands, and any concerns>"
}

ANALYSIS GUIDELINES:
- Use specific dates and numbers from the timeline
- Explain technical terms in plain English
- Focus on buyer-relevant concerns (safety, value, reliability)
- Consider vehicle age when assessing gaps and mileage
- Flag any rollbacks, salvage titles, or major accidents as high severity
- Be honest about risks but avoid unnecessary alarm
- Provide actionable insights

Return ONLY the JSON object, no additional text.`;
}

/**
 * Validate LLM analysis response
 */
function validateAnalysisResult(result: unknown): result is LLMAnalysisResult {
	// Validate risk score (Requirement 15.2)
	if (typeof result !== 'object' || result === null) {
		console.error('[llm-analyze] Invalid result type:', typeof result);
		return false;
	}

	const obj = result as Record<string, unknown>;

	if (typeof obj.riskScore !== 'number' || obj.riskScore < 1 || obj.riskScore > 10) {
		console.error('[llm-analyze] Invalid risk score:', obj.riskScore);
		return false;
	}

	// Validate verdict (Requirement 15.3)
	if (!['buy', 'caution', 'avoid'].includes(obj.verdict as string)) {
		console.error('[llm-analyze] Invalid verdict:', obj.verdict);
		return false;
	}

	// Validate required fields exist
	if (!obj.verdictReasoning || !obj.odometerAssessment || !obj.titleAssessment) {
		console.error('[llm-analyze] Missing required fields');
		return false;
	}

	// Validate arrays
	if (!Array.isArray(obj.topFlags) || !Array.isArray(obj.gapAnalysis)) {
		console.error('[llm-analyze] Invalid array fields');
		return false;
	}

	return true;
}

/**
 * Call LLM API with timeout and retry logic
 */
async function callLLMWithTimeout(
	prompt: string,
	timeoutMs: number = 60000
): Promise<{ content: string; model: string; provider: string }> {
	// Call unified LLM service (Requirement 82.1)
	const response = await generateText([{ role: 'user', content: prompt }], {
		maxTokens: 2000,
		temperature: 0.7,
		timeout: timeoutMs
	});

	return {
		content: response.content,
		model: response.model,
		provider: response.provider
	};
}

/**
 * Parse and validate LLM response
 */
function parseLLMResponse(responseText: string): LLMAnalysisResult | null {
	try {
		// Strip markdown code blocks if present (handles ```json...``` format)
		let cleanedText = responseText.trim();

		// Remove opening code block markers (```json or ```)
		cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '');

		// Remove closing code block marker (```)
		cleanedText = cleanedText.replace(/\n?```\s*$/, '');

		// Try to parse as JSON (Requirement 46.1)
		const parsed = JSON.parse(cleanedText.trim());

		// Validate structure (Requirement 46.2)
		if (!validateAnalysisResult(parsed)) {
			console.error('[llm-analyze] Response validation failed');
			return null;
		}

		return parsed;
	} catch (error) {
		// Handle parse errors (Requirement 46.1)
		console.error('[llm-analyze] Failed to parse LLM response:', error);
		return null;
	}
}

/**
 * Log pipeline progress
 */
async function logProgress(
	vin: string,
	status: 'started' | 'completed' | 'failed',
	message?: string
) {
	await db.insert(pipelineLog).values({
		vin,
		stage: 'llm-analyze',
		status,
		message
	});
}

/**
 * LLM Analysis Worker Handler
 */
export async function analyzeLLMHandler(jobs: Array<{ data: { vin: string } }>): Promise<void> {
	for (const job of jobs) {
		await analyzeLLM(job);
	}
}

/**
 * Process a single LLM analysis job
 */
async function analyzeLLM(job: { data: { vin: string } }): Promise<void> {
	const { vin } = job.data;

	console.log(`[llm-analyze] Starting analysis for VIN: ${vin}`);
	await logProgress(vin, 'started');

	try {
		// Load stitched timeline from pipeline_reports (Requirement 15.1)
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

		// Construct analysis prompt (Requirement 45.1, 45.2)
		const prompt = buildAnalysisPrompt(timeline);

		// Get LLM info for logging
		const llmInfo = getLLMInfo();
		console.log(`[llm-analyze] Using ${llmInfo.provider} (${llmInfo.model}) for VIN: ${vin}`);

		let analysisResult: LLMAnalysisResult;
		let responseMeta: { model: string; provider: string };

		if (!llmInfo.configured) {
			console.warn(
				`[llm-analyze] No LLM provider configured for VIN ${vin}, using fallback analysis`
			);
			analysisResult = buildFallbackAnalysis(timeline);
			responseMeta = {
				model: 'rules-v1',
				provider: 'fallback'
			};
		} else {
			try {
				// Call LLM API with timeout (Requirement 82.1)
				const response = await callLLMWithTimeout(prompt);

				// Parse and validate response (Requirement 46.1, 46.2)
				const parsedResponse = parseLLMResponse(response.content);
				analysisResult = parsedResponse ?? buildFallbackAnalysis(timeline);
				responseMeta = {
					model: parsedResponse ? response.model : `${response.model}:fallback`,
					provider: parsedResponse ? response.provider : 'fallback'
				};
			} catch (error) {
				console.warn(
					`[llm-analyze] LLM call failed for VIN ${vin}, using fallback analysis:`,
					error
				);
				analysisResult = buildFallbackAnalysis(timeline);
				responseMeta = {
					model: 'rules-v1',
					provider: 'fallback'
				};
			}
		}

		// Store analysis results (Requirement 15.9)
		await db
			.update(pipelineReports)
			.set({
				llmFlags: {
					riskScore: analysisResult.riskScore,
					topFlags: analysisResult.topFlags,
					gapAnalysis: analysisResult.gapAnalysis,
					odometerAssessment: analysisResult.odometerAssessment,
					titleAssessment: analysisResult.titleAssessment,
					model: responseMeta.model,
					provider: responseMeta.provider
				},
				llmVerdict: `${analysisResult.verdict.toUpperCase()}: ${analysisResult.verdictReasoning}`,
				updatedAt: new Date()
			})
			.where(eq(pipelineReports.vin, vin));

		console.log(`[llm-analyze] Analysis completed for VIN: ${vin} using ${responseMeta.provider}`);
		await logProgress(
			vin,
			'completed',
			`Risk score: ${analysisResult.riskScore}, Verdict: ${analysisResult.verdict}, Model: ${responseMeta.model}`
		);

		// Enqueue section writing job (Requirement 15.10)
		const queue = await getQueue();
		await queue.send(Jobs.LLM_WRITE_SECTIONS, { vin });

		console.log(`[llm-analyze] Enqueued section writing job for VIN: ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`[llm-analyze] Failed for VIN ${vin}:`, errorMessage);
		await logProgress(vin, 'failed', errorMessage);

		// Update report status to failed
		await db
			.update(pipelineReports)
			.set({
				status: 'failed',
				errorMessage: `LLM analysis failed: ${errorMessage}`,
				updatedAt: new Date()
			})
			.where(eq(pipelineReports.vin, vin));

		throw error;
	}
}

/**
 * Register the LLM analyze worker with pg-boss
 */
export async function registerLLMAnalyzeWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.LLM_ANALYZE, analyzeLLMHandler);
	console.log('[llm-analyze] Worker registered');
}
