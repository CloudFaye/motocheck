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
	const response = await generateText(
		[{ role: 'user', content: prompt }],
		{
			maxTokens: 2000,
			temperature: 0.7,
			timeout: timeoutMs,
		}
	);

	return {
		content: response.content,
		model: response.model,
		provider: response.provider,
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
async function logProgress(vin: string, status: 'started' | 'completed' | 'failed', message?: string) {
	await db.insert(pipelineLog).values({
		vin,
		stage: 'llm-analyze',
		status,
		message,
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
		// Load stitched timeline from reports table (Requirement 15.1)
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

		// Call LLM API with timeout (Requirement 82.1)
		const response = await callLLMWithTimeout(prompt);

		// Parse and validate response (Requirement 46.1, 46.2)
		const analysisResult = parseLLMResponse(response.content);

		if (!analysisResult) {
			// Store raw response with parse error flag (Requirement 46.1)
			await db
				.update(pipelineReports)
				.set({
					llmFlags: { parseError: true, rawResponse: response.content, model: response.model, provider: response.provider },
					llmVerdict: 'Analysis parsing failed',
					updatedAt: new Date(),
				})
				.where(eq(pipelineReports.vin, vin));

			throw new Error('Failed to parse LLM analysis response');
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
					model: response.model,
					provider: response.provider,
				},
				llmVerdict: `${analysisResult.verdict.toUpperCase()}: ${analysisResult.verdictReasoning}`,
				updatedAt: new Date(),
			})
			.where(eq(pipelineReports.vin, vin));

		console.log(`[llm-analyze] Analysis completed for VIN: ${vin} using ${response.provider}`);
		await logProgress(vin, 'completed', `Risk score: ${analysisResult.riskScore}, Verdict: ${analysisResult.verdict}, Model: ${response.model}`);

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
				updatedAt: new Date(),
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
