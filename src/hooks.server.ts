import { type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Generate unique request ID for tracing
const requestIdHandle: Handle = async ({ event, resolve }) => {
	const requestId = crypto.randomUUID();
	event.locals.requestId = requestId;
	
	const response = await resolve(event);
	response.headers.set('X-Request-ID', requestId);
	
	return response;
};

// Add security headers
const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	
	// Content Security Policy
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.flutterwave.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https: blob:",
			"font-src 'self' data:",
			"connect-src 'self' https://api.flutterwave.com https://vpic.nhtsa.dot.gov",
			"frame-src https://checkout.flutterwave.com",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self' https://checkout.flutterwave.com"
		].join('; ')
	);
	
	// Other security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	
	// HSTS (only in production)
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	
	return response;
};

// Global error handler
const errorHandle: Handle = async ({ event, resolve }) => {
	try {
		return await resolve(event);
	} catch (error) {
		console.error('Unhandled error:', {
			requestId: event.locals.requestId,
			url: event.url.pathname,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		
		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				requestId: event.locals.requestId
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};

export const handle = sequence(requestIdHandle, securityHeadersHandle, errorHandle);
