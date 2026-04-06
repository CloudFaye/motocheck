/**
 * Unified LLM Service
 * 
 * Supports multiple LLM providers with automatic fallback:
 * - Google Gemini (default, free tier)
 * - Anthropic Claude (premium option)
 * 
 * Provider selection via LLM_PROVIDER environment variable:
 * - "gemini" (default) - Uses Google Gemini API
 * - "anthropic" - Uses Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// LLM Provider configuration
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Model configuration
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// Initialize clients
let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: Anthropic | null = null;

if (LLM_PROVIDER === 'gemini' && GEMINI_API_KEY) {
	geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
} else if (LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
	anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

export interface LLMMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface LLMResponse {
	content: string;
	model: string;
	provider: 'gemini' | 'anthropic';
	tokensUsed?: number;
}

/**
 * Generate text using the configured LLM provider
 */
export async function generateText(
	messages: LLMMessage[],
	options?: {
		maxTokens?: number;
		temperature?: number;
		timeout?: number;
	}
): Promise<LLMResponse> {
	const maxTokens = options?.maxTokens || 2000;
	const temperature = options?.temperature || 0.7;
	const timeout = options?.timeout || 60000;

	// Use Gemini
	if (LLM_PROVIDER === 'gemini') {
		if (!geminiClient) {
			throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
		}

		return await generateWithGemini(messages, maxTokens, temperature, timeout);
	}

	// Use Anthropic
	if (LLM_PROVIDER === 'anthropic') {
		if (!anthropicClient) {
			throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.');
		}

		return await generateWithAnthropic(messages, maxTokens, temperature, timeout);
	}

	throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
}

/**
 * Generate text using Google Gemini
 */
async function generateWithGemini(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!geminiClient) {
		throw new Error('Gemini client not initialized');
	}

	const model = geminiClient.getGenerativeModel({
		model: GEMINI_MODEL,
		generationConfig: {
			maxOutputTokens: maxTokens,
			temperature: temperature,
		},
	});

	// Convert messages to Gemini format
	// Gemini doesn't have a system role, so we prepend system messages to the first user message
	const systemMessages = messages.filter(m => m.role === 'system');
	const conversationMessages = messages.filter(m => m.role !== 'system');

	let prompt = '';
	if (systemMessages.length > 0) {
		prompt = systemMessages.map(m => m.content).join('\n\n') + '\n\n';
	}

	// For single-turn conversations (most common in our use case)
	if (conversationMessages.length === 1 && conversationMessages[0].role === 'user') {
		prompt += conversationMessages[0].content;

		// Create timeout promise
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Gemini API timeout')), timeout);
		});

		// Race between API call and timeout
		const result = await Promise.race([
			model.generateContent(prompt),
			timeoutPromise,
		]);

		const response = result.response;
		const text = response.text();

		return {
			content: text,
			model: GEMINI_MODEL,
			provider: 'gemini',
			tokensUsed: response.usageMetadata?.totalTokenCount,
		};
	}

	// For multi-turn conversations, use chat
	const chat = model.startChat({
		history: conversationMessages.slice(0, -1).map(m => ({
			role: m.role === 'user' ? 'user' : 'model',
			parts: [{ text: m.content }],
		})),
	});

	const lastMessage = conversationMessages[conversationMessages.length - 1];
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('Gemini API timeout')), timeout);
	});

	const result = await Promise.race([
		chat.sendMessage(prompt + lastMessage.content),
		timeoutPromise,
	]);

	const response = result.response;
	const text = response.text();

	return {
		content: text,
		model: GEMINI_MODEL,
		provider: 'gemini',
		tokensUsed: response.usageMetadata?.totalTokenCount,
	};
}

/**
 * Generate text using Anthropic Claude
 */
async function generateWithAnthropic(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!anthropicClient) {
		throw new Error('Anthropic client not initialized');
	}

	// Extract system message if present
	const systemMessage = messages.find(m => m.role === 'system')?.content;
	const conversationMessages = messages
		.filter(m => m.role !== 'system')
		.map(m => ({
			role: m.role as 'user' | 'assistant',
			content: m.content,
		}));

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('Anthropic API timeout')), timeout);
	});

	// Race between API call and timeout
	const response = await Promise.race([
		anthropicClient.messages.create({
			model: ANTHROPIC_MODEL,
			max_tokens: maxTokens,
			temperature: temperature,
			system: systemMessage,
			messages: conversationMessages,
		}),
		timeoutPromise,
	]);

	const content = response.content[0];
	if (content.type !== 'text') {
		throw new Error('Unexpected response type from Anthropic');
	}

	return {
		content: content.text,
		model: ANTHROPIC_MODEL,
		provider: 'anthropic',
		tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
	};
}

/**
 * Get current LLM provider information
 */
export function getLLMInfo(): {
	provider: string;
	model: string;
	configured: boolean;
} {
	if (LLM_PROVIDER === 'gemini') {
		return {
			provider: 'gemini',
			model: GEMINI_MODEL,
			configured: !!GEMINI_API_KEY,
		};
	}

	if (LLM_PROVIDER === 'anthropic') {
		return {
			provider: 'anthropic',
			model: ANTHROPIC_MODEL,
			configured: !!ANTHROPIC_API_KEY,
		};
	}

	return {
		provider: LLM_PROVIDER,
		model: 'unknown',
		configured: false,
	};
}
