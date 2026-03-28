export interface RateLimitResult {
	allowed: boolean;
	retryAfter: number;
}

const requestLog = new Map<string, number[]>();

export function checkRateLimit(
	identifier: string,
	limit: number,
	windowSeconds: number
): RateLimitResult {
	const now = Date.now();
	const windowMs = windowSeconds * 1000;
	const requests = requestLog.get(identifier) || [];

	// Filter to sliding window
	const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);

	if (recentRequests.length >= limit) {
		const oldestRequest = Math.min(...recentRequests);
		const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
		return { allowed: false, retryAfter };
	}

	// Allow request
	recentRequests.push(now);
	requestLog.set(identifier, recentRequests);

	return { allowed: true, retryAfter: 0 };
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [identifier, requests] of requestLog.entries()) {
		const filtered = requests.filter((timestamp) => now - timestamp < 3600000); // Keep last hour
		if (filtered.length === 0) {
			requestLog.delete(identifier);
		} else {
			requestLog.set(identifier, filtered);
		}
	}
}, 300000);
