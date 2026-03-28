/**
 * Tests for rate limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limiter';

describe('Rate Limiter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it('should allow requests within limit', () => {
		const result1 = checkRateLimit('user1', 5, 60);
		const result2 = checkRateLimit('user1', 5, 60);
		const result3 = checkRateLimit('user1', 5, 60);

		expect(result1.allowed).toBe(true);
		expect(result2.allowed).toBe(true);
		expect(result3.allowed).toBe(true);
	});

	it('should block requests exceeding limit', () => {
		for (let i = 0; i < 5; i++) {
			checkRateLimit('user2', 5, 60);
		}

		const result = checkRateLimit('user2', 5, 60);
		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeGreaterThan(0);
	});

	it('should track different identifiers separately', () => {
		for (let i = 0; i < 5; i++) {
			checkRateLimit('user3', 5, 60);
		}

		const result = checkRateLimit('user4', 5, 60);
		expect(result.allowed).toBe(true);
	});

	it('should reset after window expires', () => {
		for (let i = 0; i < 5; i++) {
			checkRateLimit('user5', 5, 60);
		}

		vi.advanceTimersByTime(61000); // Advance 61 seconds

		const result = checkRateLimit('user5', 5, 60);
		expect(result.allowed).toBe(true);
	});
});
