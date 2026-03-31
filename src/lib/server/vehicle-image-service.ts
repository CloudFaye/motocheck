/**
 * Vehicle Image Service
 * Intelligent image aggregation from multiple free sources with database caching and rate limiting
 */

import { db } from './db';
import { vehicleImagesCache } from './db/schema';
import { eq, sql } from 'drizzle-orm';

export interface ImageResult {
	url: string;
	source: 'auction' | 'dealer' | 'google' | 'duckduckgo' | 'placeholder';
	matchType: 'vin-exact' | 'stock' | 'placeholder';
	confidence: number; // 0-100
	metadata: {
		date?: string;
		location?: string;
		description?: string;
	};
}

export interface ImageSearchOptions {
	vin: string;
	make: string;
	model: string;
	year: string;
	maxResults?: number;
}

export class VehicleImageService {
	private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
	private readonly MAX_CACHE_SIZE = 1000;
	private readonly RATE_LIMIT_DELAY_MS = 1000; // 1 second

	/**
	 * Get cached images for a VIN if valid (less than 24 hours old)
	 */
	private async getCached(vin: string): Promise<ImageResult[] | null> {
		try {
			const cached = await db
				.select()
				.from(vehicleImagesCache)
				.where(eq(vehicleImagesCache.vin, vin))
				.limit(1);

			if (cached.length === 0) return null;

			const entry = cached[0];
			const age = Date.now() - entry.cachedAt.getTime();

			// Check if cache is expired (older than 24 hours)
			if (age > this.CACHE_TTL_MS) {
				await db.delete(vehicleImagesCache).where(eq(vehicleImagesCache.vin, vin));
				return null;
			}

			return entry.imagesJson as ImageResult[];
		} catch (error) {
			console.warn('Cache read error:', error);
			return null;
		}
	}

	/**
	 * Cache images for a VIN
	 */
	private async setCached(vin: string, images: ImageResult[]): Promise<void> {
		try {
			// Check cache size and evict if necessary
			await this.evictOldestCache();

			// Upsert cache entry
			await db
				.insert(vehicleImagesCache)
				.values({
					vin,
					imagesJson: images as unknown as Record<string, unknown>[],
					cachedAt: new Date()
				})
				.onConflictDoUpdate({
					target: vehicleImagesCache.vin,
					set: {
						imagesJson: images as unknown as Record<string, unknown>[],
						cachedAt: new Date()
					}
				});
		} catch (error) {
			console.warn('Cache write error:', error);
		}
	}

	/**
	 * Evict the oldest cache entry if cache exceeds MAX_CACHE_SIZE
	 */
	private async evictOldestCache(): Promise<void> {
		try {
			// Count current cache entries
			const count = await db
				.select({ count: sql<number>`count(*)` })
				.from(vehicleImagesCache);

			const cacheSize = Number(count[0]?.count || 0);

			// If at capacity, delete oldest entry
			if (cacheSize >= this.MAX_CACHE_SIZE) {
				const oldest = await db
					.select()
					.from(vehicleImagesCache)
					.orderBy(vehicleImagesCache.cachedAt)
					.limit(1);

				if (oldest.length > 0) {
					await db.delete(vehicleImagesCache).where(eq(vehicleImagesCache.id, oldest[0].id));
				}
			}
		} catch (error) {
			console.warn('Cache eviction error:', error);
		}
	}

	/**
	 * Generate a professional placeholder SVG image
	 */
	private generatePlaceholder(options: ImageSearchOptions): ImageResult {
		const { make, model, year } = options;
		const vehicleType = this.inferVehicleType(model);
		const svg = this.generatePlaceholderSVG(make, model, year, vehicleType);

		// Convert SVG to data URI
		const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

		return {
			url: dataUri,
			source: 'placeholder',
			matchType: 'placeholder',
			confidence: 0,
			metadata: {
				description: 'Generated placeholder image'
			}
		};
	}

	/**
	 * Infer vehicle type from model name
	 */
	private inferVehicleType(model: string): string {
		const modelLower = model.toLowerCase();

		if (modelLower.includes('suv') || modelLower.includes('explorer') || modelLower.includes('tahoe')) {
			return 'suv';
		}
		if (modelLower.includes('truck') || modelLower.includes('f-150') || modelLower.includes('silverado')) {
			return 'truck';
		}
		if (modelLower.includes('van') || modelLower.includes('transit') || modelLower.includes('caravan')) {
			return 'van';
		}

		return 'sedan';
	}

	/**
	 * Generate Clay.io style placeholder SVG
	 */
	private generatePlaceholderSVG(make: string, model: string, year: string, vehicleType: string): string {
		const silhouettes = {
			sedan: `
				<path d="M150,300 L200,280 L250,270 L350,270 L450,270 L550,270 L600,280 L650,300 L650,350 L600,370 L550,380 L250,380 L200,370 L150,350 Z" 
					fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
				<ellipse cx="250" cy="380" rx="30" ry="15" fill="#64748b"/>
				<ellipse cx="550" cy="380" rx="30" ry="15" fill="#64748b"/>
				<rect x="300" y="250" width="200" height="40" rx="5" fill="#94a3b8"/>
			`,
			suv: `
				<path d="M150,280 L200,250 L250,240 L350,240 L450,240 L550,240 L600,250 L650,280 L650,360 L600,380 L550,390 L250,390 L200,380 L150,360 Z" 
					fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
				<ellipse cx="250" cy="390" rx="35" ry="18" fill="#64748b"/>
				<ellipse cx="550" cy="390" rx="35" ry="18" fill="#64748b"/>
				<rect x="280" y="220" width="240" height="50" rx="5" fill="#94a3b8"/>
			`,
			truck: `
				<path d="M150,300 L200,280 L300,270 L400,270 L400,250 L500,250 L550,270 L650,300 L650,360 L600,380 L550,390 L250,390 L200,380 L150,360 Z" 
					fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
				<ellipse cx="250" cy="390" rx="35" ry="18" fill="#64748b"/>
				<ellipse cx="550" cy="390" rx="35" ry="18" fill="#64748b"/>
				<rect x="420" y="230" width="100" height="50" rx="5" fill="#94a3b8"/>
				<rect x="150" y="360" width="250" height="30" fill="#94a3b8"/>
			`,
			van: `
				<path d="M150,260 L200,240 L250,230 L550,230 L600,240 L650,260 L650,370 L600,390 L550,400 L250,400 L200,390 L150,370 Z" 
					fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
				<ellipse cx="250" cy="400" rx="35" ry="18" fill="#64748b"/>
				<ellipse cx="550" cy="400" rx="35" ry="18" fill="#64748b"/>
				<rect x="250" y="210" width="300" height="60" rx="5" fill="#94a3b8"/>
			`
		};

		const silhouette = silhouettes[vehicleType as keyof typeof silhouettes] || silhouettes.sedan;

		return `
			<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#f8fafc"/>
				<g transform="translate(0, 50)">
					${silhouette}
				</g>
				<text x="400" y="480" font-family="Arial, sans-serif" font-size="24" font-weight="600" 
					fill="#475569" text-anchor="middle">
					${year} ${make} ${model}
				</text>
				<text x="400" y="520" font-family="Arial, sans-serif" font-size="18" 
					fill="#64748b" text-anchor="middle" font-style="italic">
					No image available
				</text>
			</svg>
		`.trim();
	}

	/**
	 * Search for vehicle images using waterfall strategy
	 */
	async searchImages(options: ImageSearchOptions): Promise<ImageResult[]> {
		try {
			// Check cache first
			const cached = await this.getCached(options.vin);
			if (cached) {
				return cached;
			}

			// Call all source adapters in parallel with timeout
			const timeout = 3000; // 3 seconds
			const searchPromises = [
				this.searchAuctionSites(options),
				this.searchDealerListings(options),
				this.searchGoogleImages(options),
				this.searchDuckDuckGo(options)
			].map(promise => 
				Promise.race([
					promise,
					new Promise<ImageResult[]>((_, reject) => 
						setTimeout(() => reject(new Error('Timeout')), timeout)
					)
				])
			);

			const results = await Promise.allSettled(searchPromises);

			// Collect successful results
			const images: ImageResult[] = [];
			for (const result of results) {
				if (result.status === 'fulfilled') {
					images.push(...result.value);
				}
			}

			// If no images found, generate placeholder
			if (images.length === 0) {
				const placeholder = this.generatePlaceholder(options);
				await this.setCached(options.vin, [placeholder]);
				return [placeholder];
			}

			// Prioritize VIN-exact matches over stock images
			const vinExact = images.filter(img => img.matchType === 'vin-exact');
			const stock = images.filter(img => img.matchType === 'stock');
			const prioritized = [...vinExact, ...stock];

			// Sort by date metadata (most recent first)
			prioritized.sort((a, b) => {
				if (!a.metadata.date && !b.metadata.date) return 0;
				if (!a.metadata.date) return 1;
				if (!b.metadata.date) return -1;
				return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
			});

			// Limit results if specified
			const finalResults = options.maxResults 
				? prioritized.slice(0, options.maxResults)
				: prioritized;

			// Cache results before returning
			await this.setCached(options.vin, finalResults);

			return finalResults;
		} catch (error) {
			console.error('Image search failed:', error);
			return [this.generatePlaceholder(options)];
		}
	}

	/**
	 * Search auction sites for VIN-exact matches
	 * Uses free auction listing aggregators and public auction data
	 */
	private async searchAuctionSites(options: ImageSearchOptions): Promise<ImageResult[]> {
		await this.rateLimit();
		
		try {
			const results: ImageResult[] = [];

			// Prevent unused parameter warning
			void options;

			// Search Copart public listings (example implementation)
			// Note: In production, this would use actual web scraping or API
			// For now, we'll implement a graceful handler that returns empty results
			// since we don't have actual auction site access without authentication
			
			// In a real implementation, we would:
			// 1. Fetch HTML from auction sites
			// 2. Parse for VIN matches
			// 3. Extract image URLs, dates, locations
			// 4. Return ImageResult objects
			
			// For now, return empty array as these require authentication
			// or specific scraping setup that's beyond free tier access
			
			return results;
		} catch (error) {
			console.warn('Auction site search failed:', error);
			return [];
		}
	}

	/**
	 * Search dealer listings for VIN-exact matches
	 * Searches free dealer listing aggregators
	 */
	private async searchDealerListings(options: ImageSearchOptions): Promise<ImageResult[]> {
		await this.rateLimit();
		
		try {
			const results: ImageResult[] = [];

			// Prevent unused parameter warning
			void options;

			// Search Cars.com API (free tier) or similar aggregators
			// Note: Most dealer APIs require authentication or paid access
			// This is a graceful implementation that handles the limitation
			
			// In a real implementation with API access:
			// 1. Make API request to dealer listing service
			// 2. Parse JSON response for VIN matches
			// 3. Extract image URLs, listing dates, descriptions
			// 4. Validate URLs (HTTP/HTTPS only)
			// 5. Return ImageResult objects
			
			// Example of what the implementation would look like with API access:
			/*
			const response = await fetch(`https://api.example.com/listings?vin=${vin}`);
			if (!response.ok) return [];
			
			const data = await response.json();
			if (!data.listings || !Array.isArray(data.listings)) return [];
			
			for (const listing of data.listings) {
				if (listing.images && Array.isArray(listing.images)) {
					for (const image of listing.images) {
						// Validate URL is HTTP/HTTPS only
						if (!image.url || !/^https?:\/\//i.test(image.url)) continue;
						
						results.push({
							url: image.url,
							source: 'dealer',
							matchType: 'vin-exact',
							confidence: 90,
							metadata: {
								date: listing.listingDate,
								location: listing.location,
								description: listing.description
							}
						});
					}
				}
			}
			*/
			
			return results;
		} catch (error) {
			console.warn('Dealer listing search failed:', error);
			return [];
		}
	}

	/**
	 * Search Google Images for stock images
	 * Uses Google Custom Search API (free tier: 100 queries/day)
	 */
	private async searchGoogleImages(options: ImageSearchOptions): Promise<ImageResult[]> {
		await this.rateLimit();
		
		try {
			const { make, model, year } = options;
			const results: ImageResult[] = [];
			
			// Google Custom Search API requires API key and Search Engine ID
			// Free tier: 100 queries per day
			const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
			const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
			
			if (!apiKey || !searchEngineId) {
				console.warn('Google Search API credentials not configured');
				return [];
			}

			const query = `${year} ${make} ${model} car`;
			const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;

			let retries = 0;
			const maxRetries = 3;
			let delay = 1000; // Start with 1 second

			while (retries < maxRetries) {
				try {
					const response = await fetch(url);
					
					// Handle rate limiting with exponential backoff
					if (response.status === 429) {
						console.warn(`Google Images rate limited, retrying in ${delay}ms...`);
						await new Promise(resolve => setTimeout(resolve, delay));
						delay *= 2; // Exponential backoff
						retries++;
						continue;
					}

					if (!response.ok) {
						console.warn(`Google Images search failed: ${response.status}`);
						return [];
					}

					const data = await response.json();
					
					if (!data.items || !Array.isArray(data.items)) {
						return [];
					}

					for (const item of data.items) {
						if (item.link) {
							results.push({
								url: item.link,
								source: 'google',
								matchType: 'stock',
								confidence: 60,
								metadata: {
									description: item.title || `${year} ${make} ${model}`,
									location: item.image?.contextLink
								}
							});
						}
					}

					return results;
				} catch (fetchError) {
					console.warn('Google Images fetch error:', fetchError);
					retries++;
					if (retries < maxRetries) {
						await new Promise(resolve => setTimeout(resolve, delay));
						delay *= 2;
					}
				}
			}

			return results;
		} catch (error) {
			console.warn('Google Images search failed:', error);
			return [];
		}
	}

	/**
	 * Search DuckDuckGo for stock images
	 * Uses DuckDuckGo's free image search (no API key required)
	 */
	private async searchDuckDuckGo(options: ImageSearchOptions): Promise<ImageResult[]> {
		await this.rateLimit();
		
		try {
			const { make, model, year } = options;
			const results: ImageResult[] = [];
			
			// DuckDuckGo has an unofficial API endpoint that doesn't require authentication
			// This is a free service but should be used respectfully with rate limiting
			const query = `${year} ${make} ${model} car`;
			const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&t=vehicle-report`;

			const response = await fetch(url, {
				headers: {
					'User-Agent': 'VehicleReportGenerator/1.0'
				}
			});

			if (!response.ok) {
				console.warn(`DuckDuckGo search failed: ${response.status}`);
				return [];
			}

			const data = await response.json();
			
			// DuckDuckGo API returns results in various formats
			// Check for image results in the response
			if (data.Image) {
				results.push({
					url: data.Image,
					source: 'duckduckgo',
					matchType: 'stock',
					confidence: 50,
					metadata: {
						description: data.Heading || `${year} ${make} ${model}`
					}
				});
			}

			// Check for related topics with images
			if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
				for (const topic of data.RelatedTopics.slice(0, 5)) {
					if (topic.Icon && topic.Icon.URL) {
						// Filter out placeholder icons
						if (!topic.Icon.URL.includes('placeholder') && 
						    !topic.Icon.URL.includes('blank')) {
							results.push({
								url: topic.Icon.URL,
								source: 'duckduckgo',
								matchType: 'stock',
								confidence: 40,
								metadata: {
									description: topic.Text || `${year} ${make} ${model}`
								}
							});
						}
					}
				}
			}

			return results;
		} catch (error) {
			console.warn('DuckDuckGo search failed:', error);
			return [];
		}
	}

	/**
	 * Rate limiting delay
	 */
	private async rateLimit(): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY_MS));
	}
}
