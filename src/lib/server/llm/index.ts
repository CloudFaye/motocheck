/**
 * Unified LLM Service
 * 
 * Supports multiple LLM providers:
 * - Alibaba Cloud Model Studio (default, free tier available)
 * - MuleRouter (free credits available)
 * - Google Gemini (free tier available)
 * - Anthropic Claude (premium option)
 * - OpenAI (GPT-4o-mini, affordable and reliable)
 * - OpenRouter (access to many open-source models)
 * 
 * Provider selection via LLM_PROVIDER environment variable:
 * - "alibaba" (default) - Uses Alibaba Cloud Model Studio API (Qwen models)
 * - "mulerouter" - Uses MuleRouter API (various models)
 * - "gemini" - Uses Google Gemini API
 * - "anthropic" - Uses Anthropic Claude API
 * - "openai" - Uses OpenAI API
 * - "openrouter" - Uses OpenRouter API (supports Llama, Mistral, etc.)
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// LLM Provider configuration
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'alibaba').toLowerCase();
const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const MULEROUTER_API_KEY = process.env.MULEROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model configuration
const ALIBABA_MODEL = process.env.ALIBABA_MODEL || 'qwen-plus';
const MULEROUTER_MODEL = process.env.MULEROUTER_MODEL || 'qwen-flash';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

// Initialize clients
let alibabaClient: OpenAI | null = null;
let mulerouterClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let openrouterClient: OpenAI | null = null;

if (LLM_PROVIDER === 'alibaba' && ALIBABA_API_KEY) {
	alibabaClient = new OpenAI({
		apiKey: ALIBABA_API_KEY,
		baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
	});
} else if (LLM_PROVIDER === 'mulerouter' && MULEROUTER_API_KEY) {
	mulerouterClient = new OpenAI({
		apiKey: MULEROUTER_API_KEY,
		baseURL: 'https://api.mulerouter.ai/vendors/openai/v1',
	});
} else if (LLM_PROVIDER === 'gemini' && GEMINI_API_KEY) {
	geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
} else if (LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
	anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
} else if (LLM_PROVIDER === 'openai' && OPENAI_API_KEY) {
	openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
} else if (LLM_PROVIDER === 'openrouter' && OPENROUTER_API_KEY) {
	openrouterClient = new OpenAI({
		apiKey: OPENROUTER_API_KEY,
		baseURL: 'https://openrouter.ai/api/v1',
	});
}

export interface LLMMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface LLMResponse {
	content: string;
	model: string;
	provider: 'alibaba' | 'mulerouter' | 'gemini' | 'anthropic' | 'openai' | 'openrouter';
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

	// Use Alibaba Cloud Model Studio
	if (LLM_PROVIDER === 'alibaba') {
		if (!alibabaClient) {
			throw new Error('Alibaba API key not configured. Set ALIBABA_API_KEY environment variable.');
		}

		return await generateWithAlibaba(messages, maxTokens, temperature, timeout);
	}

	// Use MuleRouter
	if (LLM_PROVIDER === 'mulerouter') {
		if (!mulerouterClient) {
			throw new Error('MuleRouter API key not configured. Set MULEROUTER_API_KEY environment variable.');
		}

		return await generateWithMuleRouter(messages, maxTokens, temperature, timeout);
	}

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

	// Use OpenAI
	if (LLM_PROVIDER === 'openai') {
		if (!openaiClient) {
			throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
		}

		return await generateWithOpenAI(messages, maxTokens, temperature, timeout);
	}

	// Use OpenRouter
	if (LLM_PROVIDER === 'openrouter') {
		if (!openrouterClient) {
			throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.');
		}

		return await generateWithOpenRouter(messages, maxTokens, temperature, timeout);
	}

	throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
}

/**
 * Generate text using Alibaba Cloud Model Studio (Qwen)
 */
async function generateWithAlibaba(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!alibabaClient) {
		throw new Error('Alibaba client not initialized');
	}

	// Convert messages to OpenAI-compatible format
	const alibabaMessages = messages.map(m => ({
		role: m.role as 'system' | 'user' | 'assistant',
		content: m.content,
	}));

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('Alibaba API timeout')), timeout);
	});

	// Race between API call and timeout
	const response = await Promise.race([
		alibabaClient.chat.completions.create({
			model: ALIBABA_MODEL,
			messages: alibabaMessages,
			max_tokens: maxTokens,
			temperature: temperature,
		}),
		timeoutPromise,
	]);

	const content = response.choices[0]?.message?.content;
	if (!content) {
		throw new Error('No content in Alibaba response');
	}

	return {
		content: content,
		model: ALIBABA_MODEL,
		provider: 'alibaba',
		tokensUsed: response.usage?.total_tokens,
	};
}

/**
 * Generate text using MuleRouter
 */
async function generateWithMuleRouter(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!mulerouterClient) {
		throw new Error('MuleRouter client not initialized');
	}

	// Convert messages to OpenAI-compatible format
	const mulerouterMessages = messages.map(m => ({
		role: m.role as 'system' | 'user' | 'assistant',
		content: m.content,
	}));

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('MuleRouter API timeout')), timeout);
	});

	// Race between API call and timeout
	const response = await Promise.race([
		mulerouterClient.chat.completions.create({
			model: MULEROUTER_MODEL,
			messages: mulerouterMessages,
			max_tokens: maxTokens,
			temperature: temperature,
		}),
		timeoutPromise,
	]);

	const content = response.choices[0]?.message?.content;
	if (!content) {
		throw new Error('No content in MuleRouter response');
	}

	return {
		content: content,
		model: MULEROUTER_MODEL,
		provider: 'mulerouter',
		tokensUsed: response.usage?.total_tokens,
	};
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
 * Generate text using OpenAI
 */
async function generateWithOpenAI(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!openaiClient) {
		throw new Error('OpenAI client not initialized');
	}

	// Convert messages to OpenAI format
	const openaiMessages = messages.map(m => ({
		role: m.role as 'system' | 'user' | 'assistant',
		content: m.content,
	}));

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('OpenAI API timeout')), timeout);
	});

	// Race between API call and timeout
	const response = await Promise.race([
		openaiClient.chat.completions.create({
			model: OPENAI_MODEL,
			messages: openaiMessages,
			max_tokens: maxTokens,
			temperature: temperature,
		}),
		timeoutPromise,
	]);

	const content = response.choices[0]?.message?.content;
	if (!content) {
		throw new Error('No content in OpenAI response');
	}

	return {
		content: content,
		model: OPENAI_MODEL,
		provider: 'openai',
		tokensUsed: response.usage?.total_tokens,
	};
}

/**
 * Generate text using OpenRouter
 */
async function generateWithOpenRouter(
	messages: LLMMessage[],
	maxTokens: number,
	temperature: number,
	timeout: number
): Promise<LLMResponse> {
	if (!openrouterClient) {
		throw new Error('OpenRouter client not initialized');
	}

	// Convert messages to OpenRouter format (same as OpenAI)
	const openrouterMessages = messages.map(m => ({
		role: m.role as 'system' | 'user' | 'assistant',
		content: m.content,
	}));

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('OpenRouter API timeout')), timeout);
	});

	// Race between API call and timeout
	const response = await Promise.race([
		openrouterClient.chat.completions.create({
			model: OPENROUTER_MODEL,
			messages: openrouterMessages,
			max_tokens: maxTokens,
			temperature: temperature,
		}),
		timeoutPromise,
	]);

	const content = response.choices[0]?.message?.content;
	if (!content) {
		throw new Error('No content in OpenRouter response');
	}

	return {
		content: content,
		model: OPENROUTER_MODEL,
		provider: 'openrouter',
		tokensUsed: response.usage?.total_tokens,
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
	if (LLM_PROVIDER === 'alibaba') {
		return {
			provider: 'alibaba',
			model: ALIBABA_MODEL,
			configured: !!ALIBABA_API_KEY,
		};
	}

	if (LLM_PROVIDER === 'mulerouter') {
		return {
			provider: 'mulerouter',
			model: MULEROUTER_MODEL,
			configured: !!MULEROUTER_API_KEY,
		};
	}

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

	if (LLM_PROVIDER === 'openai') {
		return {
			provider: 'openai',
			model: OPENAI_MODEL,
			configured: !!OPENAI_API_KEY,
		};
	}

	if (LLM_PROVIDER === 'openrouter') {
		return {
			provider: 'openrouter',
			model: OPENROUTER_MODEL,
			configured: !!OPENROUTER_API_KEY,
		};
	}

	return {
		provider: LLM_PROVIDER,
		model: 'unknown',
		configured: false,
	};
}
